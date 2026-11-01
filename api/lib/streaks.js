/**
 * One-sided form streak scanner (upgrade module).
 * League games only — no cups, no women's, no youth.
 * Window: today 00:00–23:59 CAT (Africa/Johannesburg, UTC+2).
 *
 * Rules:
 * - Include only if at least one side has 4/5 or 5/5 wins OR 4/5 or 5/5 losses.
 * - WVL = one side strong wins vs other side strong losses.
 * - If both sides show similar strong streaks, attach a Counter Tip.
 */

const CUP_LEAGUE_CODES = new Set([
  'uefa.champions',
  'uefa.europa',
  'uefa.europa.conf'
]);

function formString(marks) {
  const arr = Array.isArray(marks) ? marks : [];
  return arr.slice(-5).join('') || '-----';
}

function streakStats(marks) {
  const last = (Array.isArray(marks) ? marks : []).slice(-5).map((m) => String(m || '').toUpperCase());
  const wins = last.filter((m) => m === 'W').length;
  const losses = last.filter((m) => m === 'L').length;
  const draws = last.filter((m) => m === 'D').length;
  const strongWin = wins >= 4;
  const strongLoss = losses >= 4;
  let label = null;
  if (wins === 5) label = '5/5 wins';
  else if (wins === 4) label = '4/5 wins';
  else if (losses === 5) label = '5/5 losses';
  else if (losses === 4) label = '4/5 losses';
  return { wins, losses, draws, strongWin, strongLoss, label, form: last.join('') || '-----' };
}

function isLeagueOnlyFootball(fixture) {
  if (!fixture || fixture.sport !== 'Football') return false;
  if (fixture.lowStakes) return false;
  const code = String(fixture.leagueCode || '').toLowerCase();
  if (CUP_LEAGUE_CODES.has(code)) return false;
  // Exclude anything that looks like cup / women / youth from label or notes
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

function todayCatKey() {
  return catDateKey(new Date().toISOString());
}

function buildTip(home, away, streakType, advantage) {
  if (streakType === 'WVL') {
    if (advantage === 'HOME') {
      return `Home in strong winning run vs Away in heavy losing run — lean Home win or Home DNB.`;
    }
    return `Away in strong winning run vs Home in heavy losing run — lean Away win or Away DNB.`;
  }
  if (streakType.includes('wins')) {
    if (advantage === 'HOME') return `Home 4/5+ wins streak — lean Home or Home DNB while form holds.`;
    if (advantage === 'AWAY') return `Away 4/5+ wins streak — lean Away or Away DNB while form holds.`;
    return `Both sides showing winning streaks — treat carefully; consider under or draw angles.`;
  }
  if (streakType.includes('losses')) {
    if (advantage === 'HOME') return `Away on 4/5+ losses — lean Home or Home DNB.`;
    if (advantage === 'AWAY') return `Home on 4/5+ losses — lean Away or Away DNB.`;
    return `Both sides on heavy losing runs — high variance; avoid heavy favourites.`;
  }
  return 'One-sided form edge present — check price before acting.';
}

function buildCounterTip(home, away) {
  if (home.strongWin && away.strongWin) {
    return 'Counter: both sides on winning streaks — momentum collision; consider draw or under goals.';
  }
  if (home.strongLoss && away.strongLoss) {
    return 'Counter: both sides on losing streaks — avoid strong fav; lean under or double chance.';
  }
  if (home.strongWin && away.strongLoss && home.wins === away.losses) {
    return 'Counter: streaks are mirrored in strength — still favour the winners but size down.';
  }
  if (away.strongWin && home.strongLoss && away.wins === home.losses) {
    return 'Counter: streaks are mirrored in strength — still favour the winners but size down.';
  }
  return null;
}

/**
 * Build streak tips for today's CAT league fixtures.
 * @param {Array} fixtures - full analysis fixtures
 * @returns {Array} streak tip rows
 */
export function buildStreakTips(fixtures = []) {
  const today = todayCatKey();
  if (!today) return [];

  const rows = [];
  for (const fixture of fixtures) {
    if (!isLeagueOnlyFootball(fixture)) continue;
    const kick = fixture.kickoffAt || fixture.date;
    if (!kick) continue;
    const day = catDateKey(kick);
    if (day !== today) continue;

    const home = streakStats(fixture.homeForm);
    const away = streakStats(fixture.awayForm);

    // Must have at least one strong win or strong loss side
    if (!home.strongWin && !home.strongLoss && !away.strongWin && !away.strongLoss) continue;

    let streakType = '';
    let advantage = 'NONE';

    // Prefer WVL when one is strong W and the other strong L
    if ((home.strongWin && away.strongLoss) || (away.strongWin && home.strongLoss)) {
      streakType = 'WVL 4/5 vs 5/5';
      if (home.strongWin && away.strongLoss) advantage = 'HOME';
      else advantage = 'AWAY';
      // Refine label with actual fractions
      const winSide = home.strongWin ? home : away;
      const lossSide = home.strongLoss ? home : away;
      streakType = `WVL ${winSide.label} vs ${lossSide.label}`;
    } else if (home.strongWin || away.strongWin) {
      const side = home.strongWin ? home : away;
      streakType = side.label || '4/5+ wins';
      advantage = home.strongWin && away.strongWin ? 'BOTH' : home.strongWin ? 'HOME' : 'AWAY';
    } else {
      const side = home.strongLoss ? home : away;
      streakType = side.label || '4/5+ losses';
      advantage = home.strongLoss && away.strongLoss ? 'BOTH' : home.strongLoss ? 'AWAY' : 'HOME';
      // When only losses: advantage goes to the opponent of the losing side
      if (home.strongLoss && !away.strongLoss) advantage = 'AWAY';
      else if (away.strongLoss && !home.strongLoss) advantage = 'HOME';
      else if (home.strongLoss && away.strongLoss) advantage = 'BOTH';
    }

    const tip = buildTip(home, away, streakType, advantage);
    const counterTip = (home.strongWin && away.strongWin) || (home.strongLoss && away.strongLoss)
      ? buildCounterTip(home, away)
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

  // Sort by kickoff time
  rows.sort((a, b) => String(a.kickoffAt || '').localeCompare(String(b.kickoffAt || '')));
  return rows;
}
