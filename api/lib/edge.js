import { round2 } from './util.js';

export const MIN_EDGE = 0.045;
export const CORNER_MODEL_MIN = 0.6;
export const CARD_MODEL_MIN = 0.58;

const logFacts = [0];

function logFact(n) {
  while (logFacts.length <= n) {
    const i = logFacts.length;
    logFacts.push(logFacts[i - 1] + Math.log(i));
  }
  return logFacts[n];
}

export function shrink(observed, n, prior, weight) {
  if (observed == null || !Number.isFinite(observed) || !(n > 0)) return prior;
  return (observed * n + prior * weight) / (n + weight);
}

export function devig(oddsList) {
  if (!Array.isArray(oddsList) || oddsList.length < 2) return null;
  const raw = oddsList.map((odds) => (typeof odds === 'number' && odds > 1 ? 1 / odds : null));
  if (raw.some((price) => price == null)) return null;
  const sum = raw.reduce((total, price) => total + price, 0);
  if (!(sum > 0)) return null;
  return raw.map((price) => price / sum);
}

export function impliedWithVig(odds) {
  if (!(odds > 1)) return null;
  return Math.min(0.93, (1 / odds) * 1.04);
}

export function poissonPmf(k, lambda) {
  if (k < 0) return 0;
  if (!(lambda > 0)) return k === 0 ? 1 : 0;
  return Math.exp(-lambda + k * Math.log(lambda) - logFact(k));
}

function tau(home, away, lambdaHome, lambdaAway, rho) {
  if (home === 0 && away === 0) return Math.max(0, 1 - lambdaHome * lambdaAway * rho);
  if (home === 0 && away === 1) return Math.max(0, 1 + lambdaHome * rho);
  if (home === 1 && away === 0) return Math.max(0, 1 + lambdaAway * rho);
  if (home === 1 && away === 1) return Math.max(0, 1 - rho);
  return 1;
}

export function scorelineModel(lambdaHome, lambdaAway, rho = -0.05) {
  const max = 8;
  const cells = [];
  let total = 0;
  for (let home = 0; home <= max; home += 1) {
    cells[home] = [];
    for (let away = 0; away <= max; away += 1) {
      const weight = poissonPmf(home, lambdaHome) * poissonPmf(away, lambdaAway) * tau(home, away, lambdaHome, lambdaAway, rho);
      cells[home][away] = Math.max(0, weight);
      total += cells[home][away];
    }
  }
  const scale = total || 1;
  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  for (let home = 0; home <= max; home += 1) {
    for (let away = 0; away <= max; away += 1) {
      cells[home][away] /= scale;
      if (home > away) homeWin += cells[home][away];
      else if (home === away) draw += cells[home][away];
      else awayWin += cells[home][away];
    }
  }
  const over = (line) => {
    let probability = 0;
    for (let home = 0; home <= max; home += 1) {
      for (let away = 0; away <= max; away += 1) {
        if (home + away > line) probability += cells[home][away];
      }
    }
    return probability;
  };
  return {
    lambdaHome,
    lambdaAway,
    home: homeWin,
    draw,
    away: awayWin,
    over,
    under: (line) => 1 - over(line)
  };
}

export function footballModel(homeGoals, awayGoals) {
  if (!homeGoals || !awayGoals || homeGoals.rows < 4 || awayGoals.rows < 4) return null;
  if ([homeGoals.avgFor, homeGoals.avgAgainst, awayGoals.avgFor, awayGoals.avgAgainst].some((value) => value == null)) return null;
  const rawHome = ((homeGoals.homeFor ?? homeGoals.avgFor) + (awayGoals.awayAgainst ?? awayGoals.avgAgainst)) / 2;
  const rawAway = ((awayGoals.awayFor ?? awayGoals.avgFor) + (homeGoals.homeAgainst ?? homeGoals.avgAgainst)) / 2;
  const n = Math.min(homeGoals.rows, awayGoals.rows);
  const lambdaHome = Math.min(4.2, Math.max(0.2, shrink(rawHome, n, 1.35, 2)));
  const lambdaAway = Math.min(3.6, Math.max(0.15, shrink(rawAway, n, 1.15, 2)));
  return scorelineModel(lambdaHome, lambdaAway);
}

export function sumOver(lambdaA, lambdaB, line) {
  const max = 24;
  let probability = 0;
  for (let a = 0; a <= max; a += 1) {
    const pa = poissonPmf(a, lambdaA);
    for (let b = 0; b <= max; b += 1) {
      if (a + b > line) probability += pa * poissonPmf(b, lambdaB);
    }
  }
  return Math.min(1, Math.max(0, probability));
}

export function shrunkRate(forAvg, againstAvg, n, prior) {
  if (forAvg == null || againstAvg == null) return null;
  return Math.max(0.3, shrink((forAvg + againstAvg) / 2, n, prior, 5));
}

export function normalCdf(x) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 + sign * erf);
}

export function normalAbove(mean, threshold, sd) {
  if (!(sd > 0)) return null;
  return 1 - normalCdf((threshold - mean) / sd);
}

export function basketballRates(homeLog, awayLog) {
  if (!homeLog || homeLog.length < 4 || !awayLog || awayLog.length < 4) return null;
  const mean = (rows, read) => {
    const slice = rows.slice(0, 8);
    return slice.reduce((sum, row) => sum + read(row), 0) / slice.length;
  };
  const homeMargin = shrink(mean(homeLog, (row) => row.margin), Math.min(8, homeLog.length), 0, 6);
  const awayMargin = shrink(mean(awayLog, (row) => row.margin), Math.min(8, awayLog.length), 0, 6);
  const homeFor = shrink(mean(homeLog, (row) => row.pointsFor), Math.min(8, homeLog.length), 110, 6);
  const awayFor = shrink(mean(awayLog, (row) => row.pointsFor), Math.min(8, awayLog.length), 110, 6);
  const homeAgainst = shrink(mean(homeLog, (row) => row.pointsFor - row.margin), Math.min(8, homeLog.length), 110, 6);
  const awayAgainst = shrink(mean(awayLog, (row) => row.pointsFor - row.margin), Math.min(8, awayLog.length), 110, 6);
  return {
    margin: (homeMargin - awayMargin) / 2 + 2.2,
    total: (homeFor + awayAgainst + awayFor + homeAgainst) / 2
  };
}

function quote(modelProb, sidedOdds, otherOdds, threeWay) {
  let implied = null;
  if (threeWay) implied = threeWay;
  else if (otherOdds > 1 && sidedOdds > 1) implied = devig([sidedOdds, otherOdds])?.[0] ?? null;
  else implied = impliedWithVig(sidedOdds);
  if (modelProb == null || implied == null) return null;
  return { modelProb, implied, edge: modelProb - implied };
}

export function stampEdge(option, assessment) {
  if (!assessment) return option;
  const next = {
    ...option,
    modelProbability: round2(assessment.modelProb),
    impliedProbability: round2(assessment.implied),
    edge: round2(assessment.edge)
  };
  const priceIsShort = assessment.implied - assessment.modelProb >= 0.08;
  const modelRejects = assessment.modelProb < 0.5;
  if (priceIsShort || modelRejects) {
    next._drop = true;
    return next;
  }
  if (assessment.edge > 0) {
    next.confidenceScore = Math.min(90, Math.max(0, Math.round(option.confidenceScore + Math.min(4, assessment.edge * 80))));
    next.reasonSummary = `${option.reasonSummary} Model ${Math.round(assessment.modelProb * 100)}% versus a devigged price of ${Math.round(assessment.implied * 100)}%.`;
  }
  return next;
}

export function footballQuote(option, fixture, model, priced) {
  if (!model || !option) return null;
  const three = priced.homeWin > 1 && priced.draw > 1 && priced.awayWin > 1
    ? devig([priced.homeWin, priced.draw, priced.awayWin])
    : null;
  const homePick = String(option.pick || '').startsWith(fixture.homeTeam);
  if (option.market === 'Match result') {
    return quote(homePick ? model.home : model.away, option.odds, null, homePick ? three?.[0] : three?.[2]);
  }
  if (option.market === 'Spread') {
    const modelProb = homePick ? model.home + model.draw : model.away + model.draw;
    const other = homePick ? priced.spreadAway?.odds : priced.spreadHome?.odds;
    return quote(modelProb, option.odds, other, null);
  }
  if (option.market === 'Total goals' && String(option.pick).startsWith('Over')) {
    return quote(model.over(priced.totalOver?.lineValue), option.odds, priced.totalUnder?.odds, null);
  }
  if (option.market === 'Total goals') {
    return quote(model.under(priced.totalUnder?.lineValue), option.odds, priced.totalOver?.odds, null);
  }
  return null;
}

export function basketballQuote(option, fixture, rates, priced) {
  if (!rates || !option) return null;
  const homePick = String(option.pick || '').startsWith(fixture.homeTeam);
  if (option.market === 'Spread') {
    const line = homePick ? priced.spreadHome?.lineValue : priced.spreadAway?.lineValue;
    if (line == null) return null;
    const modelProb = homePick
      ? normalAbove(rates.margin, -line, 12)
      : normalCdf((line - rates.margin) / 12);
    const other = homePick ? priced.spreadAway?.odds : priced.spreadHome?.odds;
    return quote(modelProb, option.odds, other, null);
  }
  if (option.market === 'Total points' && String(option.pick).startsWith('Over')) {
    return quote(normalAbove(rates.total, priced.totalOver?.lineValue, 13), option.odds, priced.totalUnder?.odds, null);
  }
  if (option.market === 'Total points') {
    const under = 1 - normalAbove(rates.total, priced.totalUnder?.lineValue, 13);
    return quote(under, option.odds, priced.totalOver?.odds, null);
  }
  if (option.market === 'Moneyline') {
    const homeCover = normalAbove(rates.margin, 0, 12);
    return quote(homePick ? homeCover : 1 - homeCover, option.odds, homePick ? priced.awayWin : priced.homeWin, null);
  }
  return null;
}

function teamProfile(rows) {
  const home = rows.filter((row) => row.venue === 'home');
  const away = rows.filter((row) => row.venue === 'away');
  const avg = (list, key) => (list.length ? list.reduce((sum, row) => sum + row[key], 0) / list.length : null);
  return {
    rows: rows.length,
    avgFor: avg(rows, 'goalsFor'),
    avgAgainst: avg(rows, 'goalsAgainst'),
    homeFor: avg(home, 'goalsFor'),
    homeAgainst: avg(home, 'goalsAgainst'),
    awayFor: avg(away, 'goalsFor'),
    awayAgainst: avg(away, 'goalsAgainst')
  };
}

export function backtestGoalModel(samples) {
  const ordered = (samples || [])
    .filter((sample) => sample?.homeGoals != null && sample?.awayGoals != null && sample.homeTeamId && sample.awayTeamId)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.eventId).localeCompare(String(b.eventId)));
  const history = new Map();
  let modelHits = 0;
  let baselineHits = 0;
  let scored = 0;
  let brier = 0;
  for (const match of ordered) {
    const homeRows = history.get(match.homeTeamId) || [];
    const awayRows = history.get(match.awayTeamId) || [];
    if (homeRows.length >= 4 && awayRows.length >= 4) {
      const model = footballModel(teamProfile(homeRows), teamProfile(awayRows));
      const homeWon = match.homeGoals > match.awayGoals;
      const awayWon = match.awayGoals > match.homeGoals;
      if (model && (homeWon || awayWon)) {
        scored += 1;
        const pickHome = model.home >= model.away;
        if (pickHome === homeWon) modelHits += 1;
        const baselineHome = (teamProfile(homeRows).avgFor || 0) >= (teamProfile(awayRows).avgFor || 0);
        if (baselineHome === homeWon) baselineHits += 1;
        brier += (1 - (homeWon ? model.home : model.away)) ** 2;
      }
    }
    const homeList = history.get(match.homeTeamId) || [];
    homeList.push({ venue: 'home', goalsFor: match.homeGoals, goalsAgainst: match.awayGoals });
    history.set(match.homeTeamId, homeList);
    const awayList = history.get(match.awayTeamId) || [];
    awayList.push({ venue: 'away', goalsFor: match.awayGoals, goalsAgainst: match.homeGoals });
    history.set(match.awayTeamId, awayList);
  }
  return {
    strategy: 'history-plus-shrunk-poisson',
    matches: scored,
    modelHitRate: scored ? round2(modelHits / scored) : null,
    baselineHitRate: scored ? round2(baselineHits / scored) : null,
    brier: scored ? round2(brier / scored) : null,
    corners: backtestCorners(ordered)
  };
}

function backtestCorners(ordered) {
  const history = new Map();
  let bets = 0;
  let hits = 0;
  let historyOnlyBets = 0;
  let historyOnlyHits = 0;
  for (const match of ordered) {
    if (match.totalCorners == null) continue;
    const homeRows = history.get(match.homeTeamId) || [];
    const awayRows = history.get(match.awayTeamId) || [];
    if (homeRows.length >= 4 && awayRows.length >= 4) {
      const avg = (rows, key) => rows.reduce((sum, row) => sum + row[key], 0) / rows.length;
      const homeFor = avg(homeRows, 'cornersWon');
      const homeAgainst = avg(homeRows, 'cornersAgainst');
      const awayFor = avg(awayRows, 'cornersWon');
      const awayAgainst = avg(awayRows, 'cornersAgainst');
      const expected = (homeFor + awayAgainst + awayFor + homeAgainst) / 2;
      const lambdaHome = shrunkRate(homeFor, awayAgainst, Math.min(homeRows.length, awayRows.length), 4.8);
      const lambdaAway = shrunkRate(awayFor, homeAgainst, Math.min(homeRows.length, awayRows.length), 4.2);
      const line = 8.5;
      const historyRate = [...homeRows, ...awayRows].filter((row) => row.totalCorners > line).length / (homeRows.length + awayRows.length);
      const modelProb = lambdaHome != null && lambdaAway != null ? sumOver(lambdaHome, lambdaAway, line) : 0;
      const actual = match.totalCorners > line;
      if (expected >= line + 0.45 && historyRate >= 0.55) {
        historyOnlyBets += 1;
        if (actual) historyOnlyHits += 1;
        if (modelProb >= CORNER_MODEL_MIN) {
          bets += 1;
          if (actual) hits += 1;
        }
      }
    }
    const homeList = history.get(match.homeTeamId) || [];
    homeList.push({ cornersWon: match.homeCorners, cornersAgainst: match.awayCorners, totalCorners: match.totalCorners });
    history.set(match.homeTeamId, homeList);
    const awayList = history.get(match.awayTeamId) || [];
    awayList.push({ cornersWon: match.awayCorners, cornersAgainst: match.homeCorners, totalCorners: match.totalCorners });
    history.set(match.awayTeamId, awayList);
  }
  return {
    line: 8.5,
    historyOnly: { bets: historyOnlyBets, hitRate: historyOnlyBets ? round2(historyOnlyHits / historyOnlyBets) : null },
    merged: { bets, hitRate: bets ? round2(hits / bets) : null }
  };
}
