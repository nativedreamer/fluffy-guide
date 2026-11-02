import { ALL_COMPETITIONS } from './competitions.js';
import { loadDataset, mergeSamples, samplesForTeam, saveDataset } from './dataset.js';
import { parseEspnOdds, toFixtureOdds } from './odds.js';
import { projectBookings, projectCorners } from './project.js';
import { parseBasketballResult, parseSummary } from './samples.js';
import { selectBasketball, selectFootball } from './select.js';
import { buildAccumulator, buildDailyTips, buildWeeklyTips } from './accumulator.js';
import { backtestGoalModel } from './edge.js';
import { collectSofaFallback, enrichFixturesFromSofa } from './sofascore.js';
import { addDays, dateKey, fetchJson, mapPool, utcDate } from './util.js';

const memory = {
  at: 0,
  days: 0,
  fixtures: null,
  dataset: null,
  coverage: [],
  warnings: [],
  backtest: null,
  backtestSamples: -1
};

let pendingBuild = null;
let pendingKey = '';

const CUP_LEAGUE_CODES = new Set(['uefa.champions', 'uefa.europa', 'uefa.europa.conf']);

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function formMarks(form) {
  return String(form || '').toUpperCase().replace(/[^WDL]/g, '').slice(-5).split('').filter(Boolean);
}

function recordSummary(competitor, sport) {
  const records = competitor?.records || [];
  const total = records.find((record) => record.type === 'total') || records[0];
  return total?.summary || '';
}

function dayCategory(eventDate, today) {
  const kickoff = new Date(eventDate);
  const diff = Math.round((Date.UTC(kickoff.getUTCFullYear(), kickoff.getUTCMonth(), kickoff.getUTCDate()) - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / 86400000);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'TOMORROW';
  return 'WEEKEND';
}

function isLowStakes(event, sport) {
  const blob = JSON.stringify({
    name: event?.name,
    season: event?.season,
    seasonType: event?.seasonType,
    notes: event?.competitions?.[0]?.notes
  });
  if (/preseason|exhibition|all-star|all star/i.test(blob)) return true;
  if (sport === 'basketball' && Number(event?.season?.type) === 1) return true;
  return false;
}

function streakStats(marks) {
  const last = (Array.isArray(marks) ? marks : []).slice(-5).map((m) => String(m || '').toUpperCase());
  const wins = last.filter((m) => m === 'W').length;
  const losses = last.filter((m) => m === 'L').length;
  const strongWin = wins >= 4;
  const strongLoss = losses >= 4;
  let label = null;
  if (wins === 5) label = '5/5 wins';
  else if (wins === 4) label = '4/5 wins';
  else if (losses === 5) label = '5/5 losses';
  else if (losses === 4) label = '4/5 losses';
  return { wins, losses, strongWin, strongLoss, label, form: last.join('') || '-----' };
}

function isLeagueOnlyFootball(fixture) {
  if (!fixture || fixture.sport !== 'Football') return false;
  if (fixture.lowStakes) return false;
  const code = String(fixture.leagueCode || '').toLowerCase();
  if (CUP_LEAGUE_CODES.has(code)) return false;
  const blob = `${fixture.league || ''} ${fixture.country || ''}`.toLowerCase();
  if (/women|wnba|youth|u19|u20|u21|u23|cup|trophy|play-?off/i.test(blob) && !/league|liga|serie|premier|bundes|eredivisie|primeira|championship|allsvenskan|superliga|mls|brasileirao/i.test(blob)) {
    return false;
  }
  return true;
}

function catDateKey(iso) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

function catTime(iso) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Johannesburg',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(iso));
  } catch {
    return '—';
  }
}

function buildStreakTipText(home, away, streakType, advantage) {
  if (streakType.startsWith('WVL')) {
    if (advantage === 'HOME') return 'Home in strong winning run vs Away in heavy losing run — lean Home win or Home DNB.';
    return 'Away in strong winning run vs Home in heavy losing run — lean Away win or Away DNB.';
  }
  if (streakType.includes('wins')) {
    if (advantage === 'HOME') return 'Home 4/5+ wins streak — lean Home or Home DNB while form holds.';
    if (advantage === 'AWAY') return 'Away 4/5+ wins streak — lean Away or Away DNB while form holds.';
    return 'Both sides showing winning streaks — treat carefully; consider under or draw angles.';
  }
  if (streakType.includes('losses')) {
    if (advantage === 'HOME') return 'Away on 4/5+ losses — lean Home or Home DNB.';
    if (advantage === 'AWAY') return 'Home on 4/5+ losses — lean Away or Away DNB.';
    return 'Both sides on heavy losing runs — high variance; avoid heavy favourites.';
  }
  return 'One-sided form edge present — check price before acting.';
}

function buildCounterTipText(home, away) {
  if (home.strongWin && away.strongWin) {
    return 'Counter: both sides on winning streaks — momentum collision; consider draw or under goals.';
  }
  if (home.strongLoss && away.strongLoss) {
    return 'Counter: both sides on losing streaks — avoid strong fav; lean under or double chance.';
  }
  return null;
}

function buildStreakTips(fixtures = []) {
  const today = catDateKey(new Date().toISOString());
  if (!today) return [];
  const rows = [];
  for (const fixture of fixtures) {
    if (!isLeagueOnlyFootball(fixture)) continue;
    const kick = fixture.kickoffAt || fixture.date;
    if (!kick || catDateKey(kick) !== today) continue;
    const home = streakStats(fixture.homeForm);
    const away = streakStats(fixture.awayForm);
    if (!home.strongWin && !home.strongLoss && !away.strongWin && !away.strongLoss) continue;

    let streakType = '';
    let advantage = 'NONE';
    if ((home.strongWin && away.strongLoss) || (away.strongWin && home.strongLoss)) {
      const winSide = home.strongWin ? home : away;
      const lossSide = home.strongLoss ? home : away;
      streakType = `WVL ${winSide.label} vs ${lossSide.label}`;
      advantage = home.strongWin && away.strongLoss ? 'HOME' : 'AWAY';
    } else if (home.strongWin || away.strongWin) {
      const side = home.strongWin ? home : away;
      streakType = side.label || '4/5+ wins';
      advantage = home.strongWin && away.strongWin ? 'BOTH' : home.strongWin ? 'HOME' : 'AWAY';
    } else {
      const side = home.strongLoss ? home : away;
      streakType = side.label || '4/5+ losses';
      if (home.strongLoss && !away.strongLoss) advantage = 'AWAY';
      else if (away.strongLoss && !home.strongLoss) advantage = 'HOME';
      else advantage = 'BOTH';
    }

    const tip = buildStreakTipText(home, away, streakType, advantage);
    const counterTip = (home.strongWin && away.strongWin) || (home.strongLoss && away.strongLoss)
      ? buildCounterTipText(home, away)
      : null;

    rows.push({
      id: `streak-${fixture.id}`,
      matchId: fixture.id,
      timeCAT: `${catTime(kick)} CAT`,
      kickoffAt: fixture.kickoffAt,
      league: fixture.league,
      country: fixture.country,
      homeTeam: fixture.homeTeam,
      awayTeam: fixture.awayTeam,
      homeForm: home.form,
      awayForm: away.form,
      homeWins: home.wins,
      homeLosses: home.losses,
      awayWins: away.wins,
      awayLosses: away.losses,
      streakType,
      advantage,
      tip,
      counterTip: counterTip || undefined,
      odds: fixture.odds || null
    });
  }
  rows.sort((a, b) => String(a.kickoffAt || '').localeCompare(String(b.kickoffAt || '')));
  return rows;
}

function toFixture(event, competition, now, today) {
  const competitors = event.competitions?.[0]?.competitors || [];
  const home = competitors.find((team) => team.homeAway === 'home');
  const away = competitors.find((team) => team.homeAway === 'away');
  if (!home || !away || !event.date) return null;
  const kickoff = new Date(event.date);
  if (Number.isNaN(kickoff.getTime()) || kickoff <= now) return null;
  const priced = parseEspnOdds(event.competitions?.[0]?.odds);
  const sportName = competition.sport === 'basketball' ? 'Basketball' : 'Football';
  const time = kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
  return {
    id: `${competition.sport}-${competition.league}-${event.id}`,
    espnEventId: String(event.id),
    sport: sportName,
    league: competition.label,
    leagueCode: competition.league,
    sportPath: competition.sport,
    country: competition.country,
    homeTeam: home.team?.displayName || home.team?.name || 'Home team',
    awayTeam: away.team?.displayName || away.team?.name || 'Away team',
    homeTeamId: String(home.team?.id || ''),
    awayTeamId: String(away.team?.id || ''),
    kickoffTime: `${time} UTC`,
    kickoffAt: kickoff.toISOString(),
    date: kickoff.toISOString().slice(0, 10),
    dayCategory: dayCategory(event.date, today),
    scheduleType: 'BOTH',
    status: 'UPCOMING',
    venue: event.competitions?.[0]?.venue?.fullName || 'Venue not published',
    source: 'ESPN scoreboard',
    sourceUrl: `https://www.espn.com/${competition.sport}/scoreboard/_/league/${competition.league}`,
    homeForm: formMarks(home.form),
    awayForm: formMarks(away.form),
    homeRecord: recordSummary(home, sportName),
    awayRecord: recordSummary(away, sportName),
    lowStakes: isLowStakes(event, competition.sport),
    h2hSummary: 'Head-to-head detail is added only when the ESPN summary publishes a series.',
    oddsProvider: priced.provider,
    pricedOdds: priced,
    odds: toFixtureOdds(priced),
    recommendedSelection: {
      market: 'Fixture only',
      pick: 'No pick — analysis pending',
      odds: 1,
      confidenceScore: 0,
      evidenceGrade: 'B+',
      reasonSummary: 'Scoreboard loaded. Detailed samples have not been applied yet.'
    }
  };
}

async function loadScoreboards(days, now) {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dates = Array.from({ length: days }, (_, index) => dateKey(addDays(today, index)));
  const jobs = dates.flatMap((date) => ALL_COMPETITIONS.map((competition) => ({ date, competition })));
  const warnings = [];
  const pages = await mapPool(jobs, 4, async ({ date, competition }) => {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${competition.sport}/${competition.league}/scoreboard?dates=${date}`;
    try {
      const payload = await fetchJson(url);
      return (payload.events || []).map((event) => toFixture(event, competition, now, today)).filter(Boolean);
    } catch (error) {
      warnings.push(`${competition.label} ${date}: ${error.message}`);
      return [];
    }
  });
  const fixtures = pages.flat().flat().filter(Boolean);
  const unique = [];
  const seen = new Set();
  for (const fixture of fixtures.sort((a, b) => new Date(a.kickoffAt) - new Date(b.kickoffAt))) {
    if (seen.has(fixture.id)) continue;
    seen.add(fixture.id);
    unique.push(fixture);
  }
  const coverage = [...new Set(unique.map((fixture) => fixture.league))];
  return { fixtures: unique, warnings, coverage, today };
}

function balancedEvents(rows, cap) {
  const queues = new Map();
  for (const row of rows) {
    const key = row.teamId || row.league;
    if (!queues.has(key)) queues.set(key, []);
    queues.get(key).push(row);
  }
  for (const queue of queues.values()) {
    queue.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }
  const picked = [];
  const seen = new Set();
  const lists = [...queues.values()];
  let moved = true;
  while (picked.length < cap && moved) {
    moved = false;
    for (const queue of lists) {
      while (queue.length) {
        const row = queue.shift();
        if (seen.has(row.eventId)) continue;
        seen.add(row.eventId);
        picked.push(row);
        moved = true;
        break;
      }
      if (picked.length >= cap) break;
    }
  }
  return picked;
}

function completedScheduleIds(schedule, league) {
  return (schedule?.events || [])
    .filter((event) => {
      const status = event?.competitions?.[0]?.status?.type;
      return status?.completed || status?.state === 'post';
    })
    .map((event) => ({
      eventId: String(event.id),
      league,
      date: event.date || ''
    }))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 6);
}

async function collectSamples(fixtures, dataset, limits) {
  const football = fixtures.filter((fixture) => fixture.sport === 'Football' && !fixture.lowStakes);
  const needs = football.filter((fixture) => {
    return samplesForTeam(dataset, fixture.homeTeamId, 4).length < 4
      || samplesForTeam(dataset, fixture.awayTeamId, 4).length < 4;
  }).slice(0, limits.fixtures);

  const teams = new Map();
  for (const fixture of needs) {
    for (const teamId of [fixture.homeTeamId, fixture.awayTeamId]) {
      if (!teamId) continue;
      const key = `${fixture.leagueCode}:${teamId}`;
      if (!teams.has(key)) teams.set(key, fixture.leagueCode);
    }
  }

  const wanted = [];
  const seen = new Set((dataset.samples || []).map((sample) => sample.eventId));
  const remember = (row) => {
    if (!row?.eventId || seen.has(row.eventId)) return;
    seen.add(row.eventId);
    wanted.push(row);
  };

  await mapPool([...teams.entries()].slice(0, limits.fixtures * 2), 4, async ([key, league]) => {
    const teamId = key.split(':')[1];
    try {
      const schedule = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/teams/${teamId}/schedule`);
      for (const row of completedScheduleIds(schedule, league)) remember({ ...row, teamId });
    } catch {
      /* optional */
    }
  });

  await mapPool(needs, 4, async (fixture) => {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${fixture.sportPath}/${fixture.leagueCode}/summary?event=${fixture.espnEventId}`;
    try {
      const summary = await fetchJson(url);
      const series = Array.isArray(summary.seasonseries) ? summary.seasonseries[0] : null;
      if (series?.shortSummary) fixture.h2hSummary = `${series.shortSummary}. ${series.summary || ''}`.trim();
      const referee = (summary.gameInfo?.officials || []).find((official) => /referee/i.test(official?.position?.name || official?.position?.displayName || ''));
      if (referee?.displayName) fixture.confirmedReferee = referee.displayName;
      const injuries = summary.injuries;
      if (Array.isArray(injuries) && injuries.length) {
        fixture.h2hSummary += ` ESPN injury groups published: ${injuries.length}.`;
      }
      for (const side of summary.lastFiveGames || []) {
        for (const game of (side.events || []).slice(0, 6)) {
          if (!game?.id) continue;
          remember({
            eventId: String(game.id),
            league: String(game.leagueAbbreviation || fixture.leagueCode).toLowerCase(),
            date: game.gameDate || '',
            teamId: String(side.team?.id || fixture.homeTeamId || '')
          });
        }
      }
    } catch {
      /* optional */
    }
  });

  const batch = balancedEvents(wanted, limits.events);
  const parsed = await mapPool(batch, 4, async ({ eventId, league }) => {
    try {
      const summary = await fetchJson(
        `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/summary?event=${eventId}`,
        { timeoutMs: 20000 }
      );
      return parseSummary(summary, { eventId, league, leagueLabel: league });
    } catch {
      return null;
    }
  });
  return parsed.filter((sample) => sample && sample.eventId);
}

async function attachBasketballLogs(fixtures) {
  const games = fixtures.filter((fixture) => fixture.sport === 'Basketball' && !fixture.lowStakes);
  const teams = new Map();
  for (const fixture of games) {
    if (fixture.homeTeamId) teams.set(`${fixture.sportPath}:${fixture.leagueCode}:${fixture.homeTeamId}`, fixture);
    if (fixture.awayTeamId) teams.set(`${fixture.sportPath}:${fixture.leagueCode}:${fixture.awayTeamId}`, fixture);
  }
  const logs = new Map();
  await mapPool([...teams.entries()].slice(0, 36), 4, async ([key]) => {
    const [, league, teamId] = key.split(':');
    const sportPath = key.split(':')[0];
    try {
      const schedule = await fetchJson(`https://site.api.espn.com/apis/site/v2/sports/${sportPath}/${league}/teams/${teamId}/schedule`);
      const recent = (schedule.events || [])
        .map((event) => parseBasketballResult(event, teamId))
        .filter(Boolean)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8);
      logs.set(key, recent);
    } catch {
      logs.set(key, []);
    }
  });

  for (const fixture of games) {
    const homeKey = `${fixture.sportPath}:${fixture.leagueCode}:${fixture.homeTeamId}`;
    const awayKey = `${fixture.sportPath}:${fixture.leagueCode}:${fixture.awayTeamId}`;
    fixture.basketLog = { home: logs.get(homeKey) || [], away: logs.get(awayKey) || [] };
    if (!fixture.homeForm.length) fixture.homeForm = (fixture.basketLog.home || []).slice(0, 5).map((row) => (row.win ? 'W' : 'L'));
    if (!fixture.awayForm.length) fixture.awayForm = (fixture.basketLog.away || []).slice(0, 5).map((row) => (row.win ? 'W' : 'L'));
  }
}

function applyModels(fixtures, dataset) {
  const rankedCorners = [];
  const rankedBookings = [];
  for (const fixture of fixtures) {
    if (fixture.sport === 'Football' && fixture.homeTeamId && fixture.awayTeamId && !fixture.lowStakes) {
      const corners = projectCorners(dataset.samples || [], fixture.homeTeamId, fixture.awayTeamId);
      const bookings = projectBookings(dataset.samples || [], fixture.homeTeamId, fixture.awayTeamId, fixture.confirmedReferee);
      if (!corners.excluded) {
        fixture.corners = corners;
        rankedCorners.push(fixture);
      }
      if (!bookings.excluded) {
        fixture.bookings = bookings;
        rankedBookings.push(fixture);
      }
      fixture.recommendedSelection = selectFootball(fixture, dataset.samples || []);
    } else if (fixture.sport === 'Basketball') {
      fixture.recommendedSelection = selectBasketball(fixture);
    } else {
      fixture.recommendedSelection = {
        market: 'Fixture only',
        pick: 'No pick — evidence or price filter not met',
        odds: 1,
        confidenceScore: 0,
        evidenceGrade: 'B+',
        reasonSummary: fixture.lowStakes ? 'Non-competitive fixture excluded.' : 'Detailed samples were not available.'
      };
    }
  }
  rankedCorners.sort((a, b) => b.corners.confidenceScore - a.corners.confidenceScore);
  rankedBookings.sort((a, b) => b.bookings.confidenceScore - a.bookings.confidenceScore);
  return {
    corners: rankedCorners.slice(0, 20),
    bookings: rankedBookings.slice(0, 20)
  };
}

async function rebuild(safeDays, refresh) {
  const scoreboard = await loadScoreboards(safeDays, new Date());
  let dataset = await loadDataset();
  const incoming = await collectSamples(scoreboard.fixtures, dataset, {
    fixtures: numberEnv('SAMPLE_FIXTURE_CAP', refresh ? 24 : 10),
    events: numberEnv('SAMPLE_EVENT_CAP', refresh ? 140 : 72)
  });
  if (incoming.length) {
    dataset = mergeSamples(dataset, incoming);
    await saveDataset(dataset);
  }

  // SofaScore fallback: only when ESPN samples are still thin for upcoming teams
  try {
    const sofaIncoming = await collectSofaFallback(scoreboard.fixtures, dataset, {
      teamCap: numberEnv('SOFA_TEAM_CAP', refresh ? 12 : 8),
      eventsPerTeam: numberEnv('SOFA_EVENTS_PER_TEAM', 4)
    });
    if (sofaIncoming.length) {
      dataset = mergeSamples(dataset, sofaIncoming);
      await saveDataset(dataset);
      scoreboard.warnings.push(`SofaScore filled ${sofaIncoming.length} boxscore sample(s) where ESPN was thin.`);
    }
  } catch (error) {
    scoreboard.warnings.push(`SofaScore fallback skipped: ${error?.message || 'unavailable'}`);
  }

  try {
    await enrichFixturesFromSofa(scoreboard.fixtures, { cap: numberEnv('SOFA_ENRICH_CAP', 12) });
  } catch {
    /* enrichment is optional */
  }

  await attachBasketballLogs(scoreboard.fixtures);
  applyModels(scoreboard.fixtures, dataset);
  memory.at = Date.now();
  memory.days = safeDays;
  memory.fixtures = scoreboard.fixtures;
  memory.dataset = dataset;
  memory.coverage = scoreboard.coverage;
  memory.warnings = scoreboard.warnings.slice(0, 12);
  const sampleCount = dataset.samples?.length || 0;
  if (!memory.backtest || memory.backtestSamples !== sampleCount) {
    memory.backtest = backtestGoalModel(dataset.samples || []);
    memory.backtestSamples = sampleCount;
  }
}

export async function getMatchAnalysis({
  days = 6,
  sport = 'FOOTBALL',
  targetOdds = 10,
  refresh = false
} = {}) {
  const safeDays = Math.min(Math.max(Number(days) || 6, 1), 8);
  const now = Date.now();
  const cacheFresh = memory.fixtures && memory.days === safeDays && now - memory.at < 8 * 60 * 1000 && !refresh;
  if (!cacheFresh) {
    const key = `${safeDays}:${refresh ? '1' : '0'}`;
    if (!pendingBuild || pendingKey !== key) {
      pendingKey = key;
      const job = rebuild(safeDays, Boolean(refresh)).finally(() => {
        if (pendingBuild === job) {
          pendingBuild = null;
          pendingKey = '';
        }
      });
      pendingBuild = job;
    }
    await pendingBuild;
  }

  const fixtures = memory.fixtures || [];
  const visible = sport === 'BASKETBALL'
    ? fixtures.filter((fixture) => fixture.sport === 'Basketball')
    : sport === 'FOOTBALL'
      ? fixtures.filter((fixture) => fixture.sport === 'Football')
      : fixtures;
  const corners = visible.filter((fixture) => fixture.corners && !fixture.corners.excluded)
    .sort((a, b) => b.corners.confidenceScore - a.corners.confidenceScore)
    .slice(0, 20);
  const bookings = visible.filter((fixture) => fixture.bookings && !fixture.bookings.excluded)
    .sort((a, b) => b.bookings.confidenceScore - a.bookings.confidenceScore)
    .slice(0, 20);
  const accumulator = buildAccumulator(fixtures, sport, Number(targetOdds) || 10);
  const streakTips = buildStreakTips(fixtures);
  return {
    fetchedAt: new Date(memory.at || Date.now()).toISOString(),
    source: 'ESPN scoreboard + boxscores, with SofaScore fallback when ESPN stats are missing',
    coverage: memory.coverage,
    warnings: memory.warnings,
    windowDays: safeDays,
    dataset: {
      samples: memory.dataset?.samples?.length || 0,
      updatedAt: memory.dataset?.updatedAt || null,
      path: 'data/corner-booking-samples.json'
    },
    fixtures: visible,
    corners,
    bookings,
    accumulator,
    dailyTips: buildDailyTips(fixtures, sport),
    weeklyTips: buildWeeklyTips(fixtures, sport),
    streakTips,
    edgeModel: memory.backtest,
    signature: 'prompt by mr. Wolf'
  };
}

export async function getFixtures({ days = 6 } = {}) {
  const analysis = await getMatchAnalysis({ days, refresh: false });
  return {
    fixtures: analysis.fixtures,
    fetchedAt: analysis.fetchedAt,
    source: analysis.source,
    windowDays: analysis.windowDays,
    coverage: analysis.coverage,
    dataset: analysis.dataset
  };
}
