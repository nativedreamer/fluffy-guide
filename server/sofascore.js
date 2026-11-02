/**
 * SofaScore public API fallback when ESPN boxscores are missing.
 * Lives outside api/ so it is not counted as a separate serverless function.
 * Unofficial endpoints — rate-limited, best-effort, never invents stats.
 */

const BASE = 'https://api.sofascore.com/api/v1';
const teamCache = new Map();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw || /^off$/i.test(raw)) return null;
  const n = Number(raw.replace(/[%+,]/g, '').replace(/^[ou]/i, ''));
  return Number.isFinite(n) ? n : null;
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = await fn(items[index], index);
      } catch (error) {
        results[index] = { error };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export async function fetchSofaJson(path, { timeoutMs = 16000, attempts = 2 } = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'application/json',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          referer: 'https://www.sofascore.com/',
          origin: 'https://www.sofascore.com'
        },
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (response.status === 403 || response.status === 429 || response.status >= 500) {
        lastError = new Error(`SofaScore ${response.status}`);
        await delay(500 * attempt + Math.floor(Math.random() * 300));
        continue;
      }
      if (!response.ok) {
        const error = new Error(`SofaScore ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return response.json();
    } catch (error) {
      lastError = error;
      if (error?.status && error.status < 500 && error.status !== 403 && error.status !== 429) throw error;
      if (attempt === attempts) break;
      await delay(400 * attempt);
    }
  }
  throw lastError;
}

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameScore(query, candidate) {
  const q = normalizeName(query);
  const c = normalizeName(candidate);
  if (!q || !c) return 0;
  if (q === c) return 100;
  if (c.includes(q) || q.includes(c)) return 80;
  const qParts = q.split(' ').filter((p) => p.length > 2);
  const hits = qParts.filter((p) => c.includes(p)).length;
  return qParts.length ? Math.round((hits / qParts.length) * 60) : 0;
}

export async function searchSofaTeam(teamName) {
  const key = normalizeName(teamName);
  if (!key) return null;
  if (teamCache.has(key)) return teamCache.get(key);
  try {
    const payload = await fetchSofaJson(`/search/all?q=${encodeURIComponent(teamName)}`);
    const results = Array.isArray(payload?.results) ? payload.results : [];
    let best = null;
    let bestScore = 0;
    for (const row of results) {
      const entity = row.entity || row;
      const type = String(row.type || entity?.type || '').toLowerCase();
      if (type && type !== 'team') continue;
      const sport = entity?.sport?.slug || entity?.category?.sport?.slug || '';
      if (sport && sport !== 'football' && sport !== 'soccer') continue;
      const name = entity?.name || entity?.shortName || '';
      const score = nameScore(teamName, name);
      if (score > bestScore) {
        bestScore = score;
        best = {
          id: String(entity.id),
          name,
          slug: entity.slug || '',
          country: entity.country?.name || entity.category?.name || ''
        };
      }
    }
    const picked = bestScore >= 50 ? best : null;
    teamCache.set(key, picked);
    return picked;
  } catch {
    teamCache.set(key, null);
    return null;
  }
}

function isFinishedEvent(event) {
  const code = event?.status?.code;
  const type = event?.status?.type;
  return code === 100 || code === 110 || code === 120 || type === 'finished';
}

export async function lastSofaEvents(sofaTeamId, page = 0) {
  const payload = await fetchSofaJson(`/team/${sofaTeamId}/events/last/${page}`);
  return (payload?.events || []).filter(isFinishedEvent);
}

function extractStatPeriod(statistics, period = 'ALL') {
  const block = (statistics || []).find((row) => row.period === period) || (statistics || [])[0];
  if (!block) return { home: {}, away: {} };
  const home = {};
  const away = {};
  for (const group of block.groups || []) {
    for (const item of group.statisticsItems || []) {
      const key = item.key || item.name;
      if (!key) continue;
      home[key] = toNumber(item.homeValue ?? item.home);
      away[key] = toNumber(item.awayValue ?? item.away);
    }
  }
  return { home, away };
}

function cardCountsFromIncidents(incidents = []) {
  let homeYellow = 0;
  let awayYellow = 0;
  let homeRed = 0;
  let awayRed = 0;
  let firstHalfCards = 0;
  let secondHalfCards = 0;
  for (const row of incidents) {
    if (row.incidentType !== 'card') continue;
    const klass = String(row.incidentClass || '').toLowerCase();
    const isHome = Boolean(row.isHome);
    const time = Number(row.time);
    const isYellow = klass.includes('yellow');
    const isRed = klass.includes('red');
    if (isYellow) {
      if (isHome) homeYellow += 1;
      else awayYellow += 1;
    }
    if (isRed) {
      if (isHome) homeRed += 1;
      else awayRed += 1;
    }
    const totalAdd = (isYellow ? 1 : 0) + (isRed ? 1 : 0);
    if (Number.isFinite(time) && time <= 45) firstHalfCards += totalAdd;
    else if (Number.isFinite(time)) secondHalfCards += totalAdd;
  }
  return { homeYellow, awayYellow, homeRed, awayRed, firstHalfCards, secondHalfCards };
}

function pickCorners(sideStats) {
  return sideStats.cornerKicks ?? sideStats.corners ?? null;
}

function pickFouls(sideStats) {
  return sideStats.fouls ?? sideStats.foulsCommitted ?? null;
}

function pickShots(sideStats) {
  return sideStats.totalShotsOnGoal ?? sideStats.totalShots ?? sideStats.shots ?? null;
}

function pickShotsOnTarget(sideStats) {
  return sideStats.shotsOnTarget ?? sideStats.shotsOnGoal ?? null;
}

function pickPossession(sideStats) {
  return sideStats.ballPossession ?? sideStats.possession ?? null;
}

export function parseSofaEventSample(event, statsPayload, incidentsPayload, {
  espnTeamId,
  teamIsHome
}) {
  if (!event?.id) return null;
  const homeSofaId = String(event.homeTeam?.id || '');
  const awaySofaId = String(event.awayTeam?.id || '');
  if (!homeSofaId || !awaySofaId) return null;

  const { home: homeStats, away: awayStats } = extractStatPeriod(statsPayload?.statistics, 'ALL');
  const homeCorners = pickCorners(homeStats);
  const awayCorners = pickCorners(awayStats);
  if (homeCorners == null || awayCorners == null) return null;

  const cards = cardCountsFromIncidents(incidentsPayload?.incidents || []);
  const homeYellow = homeStats.yellowCards ?? cards.homeYellow;
  const awayYellow = awayStats.yellowCards ?? cards.awayYellow;
  const homeRed = homeStats.redCards ?? cards.homeRed;
  const awayRed = awayStats.redCards ?? cards.awayRed;

  let homeTeamId;
  let awayTeamId;
  if (teamIsHome == null) {
    homeTeamId = `ss-${homeSofaId}`;
    awayTeamId = `ss-${awaySofaId}`;
  } else if (teamIsHome) {
    homeTeamId = String(espnTeamId);
    awayTeamId = `ss-${awaySofaId}`;
  } else {
    homeTeamId = `ss-${homeSofaId}`;
    awayTeamId = String(espnTeamId);
  }

  const homeGoals = toNumber(event.homeScore?.current ?? event.homeScore?.normaltime);
  const awayGoals = toNumber(event.awayScore?.current ?? event.awayScore?.normaltime);
  const start = event.startTimestamp ? new Date(event.startTimestamp * 1000) : null;
  const date = start && !Number.isNaN(start.getTime()) ? start.toISOString().slice(0, 10) : '';

  const homeCards = (Number(homeYellow) || 0) + (Number(homeRed) || 0);
  const awayCards = (Number(awayYellow) || 0) + (Number(awayRed) || 0);

  return {
    eventId: `ss-${event.id}`,
    league: event.tournament?.uniqueTournament?.name || event.tournament?.name || '',
    leagueLabel: event.tournament?.name || '',
    date,
    homeTeamId,
    awayTeamId,
    homeTeam: event.homeTeam?.name || 'Home',
    awayTeam: event.awayTeam?.name || 'Away',
    homeGoals,
    awayGoals,
    homeCorners,
    awayCorners,
    totalCorners: homeCorners + awayCorners,
    homeYellow: homeYellow == null ? null : Number(homeYellow) || 0,
    awayYellow: awayYellow == null ? null : Number(awayYellow) || 0,
    homeRed: homeRed == null ? null : Number(homeRed) || 0,
    awayRed: awayRed == null ? null : Number(awayRed) || 0,
    homeFouls: pickFouls(homeStats),
    awayFouls: pickFouls(awayStats),
    homeShots: pickShots(homeStats),
    awayShots: pickShots(awayStats),
    homeShotsOnTarget: pickShotsOnTarget(homeStats),
    awayShotsOnTarget: pickShotsOnTarget(awayStats),
    homePossession: pickPossession(homeStats),
    awayPossession: pickPossession(awayStats),
    homeCrosses: null,
    awayCrosses: null,
    totalCards: homeCards + awayCards,
    totalYellow: (Number(homeYellow) || 0) + (Number(awayYellow) || 0),
    totalRed: (Number(homeRed) || 0) + (Number(awayRed) || 0),
    firstHalfCards: cards.firstHalfCards || null,
    secondHalfCards: cards.secondHalfCards || null,
    referee: event.referee?.name || null,
    source: 'SofaScore event statistics',
    sofaEventId: String(event.id),
    sofaHomeTeamId: homeSofaId,
    sofaAwayTeamId: awaySofaId
  };
}

async function samplesForSofaTeam({ espnTeamId, teamName }, eventCap) {
  const team = await searchSofaTeam(teamName);
  if (!team?.id) return [];
  let events = [];
  try {
    events = await lastSofaEvents(team.id, 0);
  } catch {
    return [];
  }
  const finished = events.slice(0, eventCap);
  const parsed = await mapPool(finished, 2, async (event) => {
    try {
      const teamIsHome = String(event.homeTeam?.id) === String(team.id);
      const [stats, incidents] = await Promise.all([
        fetchSofaJson(`/event/${event.id}/statistics`).catch(() => null),
        fetchSofaJson(`/event/${event.id}/incidents`).catch(() => null)
      ]);
      if (!stats) return null;
      return parseSofaEventSample(event, stats, incidents, {
        espnTeamId,
        teamIsHome
      });
    } catch {
      return null;
    }
  });
  return parsed.filter((row) => row && row.eventId && row.totalCorners != null);
}

export async function collectSofaFallback(fixtures, dataset, {
  teamCap = 10,
  eventsPerTeam = 4
} = {}) {
  const football = (fixtures || []).filter((f) => f.sport === 'Football' && !f.lowStakes);
  const needs = [];
  const seen = new Set();
  for (const fixture of football) {
    for (const side of [
      { espnTeamId: fixture.homeTeamId, teamName: fixture.homeTeam },
      { espnTeamId: fixture.awayTeamId, teamName: fixture.awayTeam }
    ]) {
      if (!side.espnTeamId || !side.teamName) continue;
      const key = String(side.espnTeamId);
      if (seen.has(key)) continue;
      const have = (dataset.samples || []).filter(
        (s) => s.homeTeamId === key || s.awayTeamId === key
      ).length;
      if (have >= 4) continue;
      seen.add(key);
      needs.push(side);
      if (needs.length >= teamCap) break;
    }
    if (needs.length >= teamCap) break;
  }

  const batches = await mapPool(needs, 2, async (side) => samplesForSofaTeam(side, eventsPerTeam));
  return batches.flat().filter(Boolean);
}

export async function enrichFixtureFromSofa(fixture) {
  if (!fixture || fixture.sport !== 'Football') return fixture;
  const needsH2h = !fixture.h2hSummary || /not published|only when the ESPN/i.test(fixture.h2hSummary);
  const needsRef = !fixture.confirmedReferee;
  const needsForm = !(fixture.homeForm?.length) || !(fixture.awayForm?.length);
  if (!needsH2h && !needsRef && !needsForm) return fixture;

  try {
    const [home, away] = await Promise.all([
      searchSofaTeam(fixture.homeTeam),
      searchSofaTeam(fixture.awayTeam)
    ]);
    if (!home?.id || !away?.id) return fixture;

    let shared = null;
    try {
      const [homeLast, awayLast] = await Promise.all([
        lastSofaEvents(home.id, 0).catch(() => []),
        lastSofaEvents(away.id, 0).catch(() => [])
      ]);
      const awayIds = new Set(awayLast.map((e) => String(e.id)));
      shared = homeLast.find((e) => awayIds.has(String(e.id))) || null;
    } catch {
      shared = null;
    }

    if (shared) {
      if (needsRef && shared.referee?.name) fixture.confirmedReferee = shared.referee.name;
      if (needsH2h) {
        const hs = shared.homeScore?.current;
        const as = shared.awayScore?.current;
        if (hs != null && as != null) {
          fixture.h2hSummary = `Recent SofaScore meeting: ${shared.homeTeam?.name} ${hs}-${as} ${shared.awayTeam?.name}.`;
        }
      }
    }

    if (needsForm) {
      try {
        const [homeEvents, awayEvents] = await Promise.all([
          lastSofaEvents(home.id, 0).catch(() => []),
          lastSofaEvents(away.id, 0).catch(() => [])
        ]);
        const toMarks = (events, teamId) => events.slice(0, 5).map((event) => {
          const isHome = String(event.homeTeam?.id) === String(teamId);
          const gf = toNumber(isHome ? event.homeScore?.current : event.awayScore?.current);
          const ga = toNumber(isHome ? event.awayScore?.current : event.homeScore?.current);
          if (gf == null || ga == null) return null;
          if (gf > ga) return 'W';
          if (gf < ga) return 'L';
          return 'D';
        }).filter(Boolean).reverse();
        if (!fixture.homeForm?.length) fixture.homeForm = toMarks(homeEvents, home.id);
        if (!fixture.awayForm?.length) fixture.awayForm = toMarks(awayEvents, away.id);
      } catch {
        /* form optional */
      }
    }

    fixture.sofaHomeTeamId = home.id;
    fixture.sofaAwayTeamId = away.id;
    fixture.statsSources = [...new Set([...(fixture.statsSources || ['ESPN']), 'SofaScore'])];
  } catch {
    /* best-effort */
  }
  return fixture;
}

export async function enrichFixturesFromSofa(fixtures, { cap = 12 } = {}) {
  const targets = (fixtures || [])
    .filter((f) => f.sport === 'Football' && !f.lowStakes)
    .slice(0, cap);
  await mapPool(targets, 2, async (fixture) => {
    await enrichFixtureFromSofa(fixture);
  });
  return fixtures;
}
