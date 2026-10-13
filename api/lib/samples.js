import { toNumber } from './util.js';

function statMap(statistics = []) {
  const out = {};
  for (const stat of statistics) {
    if (!stat?.name) continue;
    out[stat.name] = toNumber(stat.displayValue ?? stat.value);
  }
  return out;
}

function scoreOf(competitor) {
  const score = competitor?.score;
  if (typeof score === 'number' || typeof score === 'string') return toNumber(score);
  if (score && typeof score === 'object') return toNumber(score.displayValue ?? score.value);
  return null;
}

/**
 * Turns an ESPN match summary into one verified corner/booking sample.
 * Returns null when the boxscore does not publish corner counts — those matches
 * are omitted rather than estimated.
 */
export function parseSummary(summary, meta = {}) {
  const teams = summary?.boxscore?.teams;
  if (!Array.isArray(teams) || teams.length < 2) return null;

  const sides = {};
  for (const team of teams) {
    const stats = statMap(team.statistics);
    if (stats.wonCorners == null) return null;
    sides[team.homeAway] = {
      teamId: String(team.team?.id || ''),
      name: team.team?.displayName || team.team?.name || '',
      corners: stats.wonCorners,
      yellow: stats.yellowCards,
      red: stats.redCards,
      fouls: stats.foulsCommitted,
      shots: stats.totalShots,
      shotsOnTarget: stats.shotsOnTarget,
      possession: stats.possessionPct,
      crosses: stats.totalCrosses,
      blockedShots: stats.blockedShots
    };
  }
  if (!sides.home?.teamId || !sides.away?.teamId) return null;

  const headerComp = summary?.header?.competitions?.[0];
  const competitors = headerComp?.competitors || [];
  const homeScoreRow = competitors.find((row) => row.homeAway === 'home');
  const awayScoreRow = competitors.find((row) => row.homeAway === 'away');
  const status = headerComp?.status?.type?.state || summary?.header?.competitions?.[0]?.status?.type?.state;
  if (status && status !== 'post') return null;

  let firstHalfYellow = 0;
  let secondHalfYellow = 0;
  let firstHalfRed = 0;
  let secondHalfRed = 0;
  const keyEvents = Array.isArray(summary.keyEvents) ? summary.keyEvents : null;
  if (keyEvents) {
    for (const event of keyEvents) {
      const label = event?.type?.text || '';
      const period = event?.period?.number;
      const yellow = label === 'Yellow Card';
      const red = label === 'Red Card';
      if (!yellow && !red) continue;
      if (period === 1) yellow ? firstHalfYellow++ : firstHalfRed++;
      else if (period === 2) yellow ? secondHalfYellow++ : secondHalfRed++;
    }
  }

  const referee = (summary?.gameInfo?.officials || []).find((official) => official?.position?.name === 'Referee');
  const homeCards = (sides.home.yellow || 0) + (sides.home.red || 0);
  const awayCards = (sides.away.yellow || 0) + (sides.away.red || 0);

  return {
    eventId: String(headerComp?.id || meta.eventId || ''),
    league: meta.league || headerComp?.league?.abbreviation || '',
    leagueLabel: meta.leagueLabel || '',
    date: (headerComp?.date || meta.date || '').slice(0, 10),
    homeTeamId: sides.home.teamId,
    awayTeamId: sides.away.teamId,
    homeTeam: sides.home.name,
    awayTeam: sides.away.name,
    homeGoals: scoreOf(homeScoreRow),
    awayGoals: scoreOf(awayScoreRow),
    homeCorners: sides.home.corners,
    awayCorners: sides.away.corners,
    totalCorners: sides.home.corners + sides.away.corners,
    homeYellow: sides.home.yellow,
    awayYellow: sides.away.yellow,
    homeRed: sides.home.red,
    awayRed: sides.away.red,
    homeFouls: sides.home.fouls,
    awayFouls: sides.away.fouls,
    homeShots: sides.home.shots,
    awayShots: sides.away.shots,
    homeShotsOnTarget: sides.home.shotsOnTarget,
    awayShotsOnTarget: sides.away.shotsOnTarget,
    homePossession: sides.home.possession,
    awayPossession: sides.away.possession,
    homeCrosses: sides.home.crosses,
    awayCrosses: sides.away.crosses,
    totalCards: homeCards + awayCards,
    totalYellow: (sides.home.yellow || 0) + (sides.away.yellow || 0),
    totalRed: (sides.home.red || 0) + (sides.away.red || 0),
    firstHalfCards: keyEvents ? firstHalfYellow + firstHalfRed : null,
    secondHalfCards: keyEvents ? secondHalfYellow + secondHalfRed : null,
    referee: referee?.displayName || null,
    source: 'ESPN summary boxscore'
  };
}

export function perspective(sample, teamId) {
  const home = sample.homeTeamId === String(teamId);
  const yellowRaw = home ? sample.homeYellow : sample.awayYellow;
  const redRaw = home ? sample.homeRed : sample.awayRed;
  const cards = yellowRaw == null && redRaw == null ? null : (Number(yellowRaw) || 0) + (Number(redRaw) || 0);
  return {
    eventId: sample.eventId,
    date: sample.date,
    venue: home ? 'home' : 'away',
    cornersWon: home ? sample.homeCorners : sample.awayCorners,
    cornersAgainst: home ? sample.awayCorners : sample.homeCorners,
    totalCorners: sample.totalCorners,
    cards,
    yellow: yellowRaw == null ? null : Number(yellowRaw) || 0,
    red: redRaw == null ? null : Number(redRaw) || 0,
    fouls: home ? sample.homeFouls : sample.awayFouls,
    goalsFor: home ? sample.homeGoals : sample.awayGoals,
    goalsAgainst: home ? sample.awayGoals : sample.homeGoals,
    shotsFor: home ? sample.homeShots : sample.awayShots,
    shotsAgainst: home ? sample.awayShots : sample.homeShots,
    totalCards: sample.totalCards,
    firstHalfCards: sample.firstHalfCards,
    secondHalfCards: sample.secondHalfCards,
    bothTeamsScored: sample.homeGoals != null && sample.awayGoals != null
      ? sample.homeGoals > 0 && sample.awayGoals > 0
      : null
  };
}

export function parseBasketballResult(event, teamId) {
  const competition = event?.competitions?.[0];
  const status = competition?.status?.type;
  if (!status?.completed && status?.state !== 'post') return null;
  const competitors = competition?.competitors || [];
  const self = competitors.find((row) => String(row.team?.id) === String(teamId));
  const opponent = competitors.find((row) => String(row.team?.id) !== String(teamId));
  if (!self || !opponent) return null;
  const pointsFor = toNumber(self.score?.displayValue ?? self.score?.value ?? self.score);
  const pointsAgainst = toNumber(opponent.score?.displayValue ?? opponent.score?.value ?? opponent.score);
  if (pointsFor == null || pointsAgainst == null) return null;
  return {
    eventId: String(event.id),
    date: (event.date || '').slice(0, 10),
    venue: self.homeAway === 'home' ? 'home' : 'away',
    pointsFor,
    pointsAgainst,
    margin: pointsFor - pointsAgainst,
    win: pointsFor > pointsAgainst
  };
}
