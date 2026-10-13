import { clamp, round2 } from './util.js';
import { goalProfile } from './project.js';

export const MIN_CONFIDENCE = 74;
export const MIN_ODDS = 1.45;
export const MAX_ODDS = 3.0;

function noPick(reason) {
  return {
    market: 'Fixture only',
    pick: 'No pick — evidence or price filter not met',
    odds: 1,
    confidenceScore: 0,
    evidenceGrade: 'B+',
    reasonSummary: reason
  };
}

function parseForm(form) {
  const seq = String(form || '').toUpperCase().replace(/[^WDL]/g, '').slice(-8);
  const pts = [...seq].reduce((sum, mark) => sum + (mark === 'W' ? 3 : mark === 'D' ? 1 : 0), 0);
  return { seq, pts, played: seq.length, ppg: seq.length ? pts / seq.length : null };
}

function recordRate(summary, sport) {
  const parts = String(summary || '').split('-').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return null;
  if (sport === 'Basketball' && parts.length >= 2) {
    const [wins, losses] = parts;
    const played = wins + losses;
    if (!played) return null;
    return { played, rate: wins / played, ppg: (wins / played) * 3 };
  }
  if (parts.length >= 3) {
    const [wins, draws, losses] = parts;
    const played = wins + draws + losses;
    if (!played) return null;
    return { played, rate: wins / played, ppg: (wins * 3 + draws) / played };
  }
  return null;
}

function grade(confidence) {
  if (confidence >= 82) return 'A+';
  if (confidence >= 78) return 'A';
  return 'B+';
}

function priceOk(odds) {
  return typeof odds === 'number' && odds >= MIN_ODDS && odds <= MAX_ODDS;
}

function candidate(market, pick, odds, confidence, summary) {
  const confidenceScore = clamp(Math.round(confidence), 0, 86);
  return { market, pick, odds: round2(odds), confidenceScore, evidenceGrade: grade(confidenceScore), reasonSummary: summary };
}

export function selectFootball(fixture, samples) {
  if (fixture.lowStakes) return noPick('Exhibition or non-competitive fixture excluded.');
  const homeForm = parseForm((fixture.homeForm || []).join(''));
  const awayForm = parseForm((fixture.awayForm || []).join(''));
  const homeRecord = recordRate(fixture.homeRecord, 'Football');
  const awayRecord = recordRate(fixture.awayRecord, 'Football');
  const homeGoals = fixture.homeTeamId ? goalProfile(samples, fixture.homeTeamId) : null;
  const awayGoals = fixture.awayTeamId ? goalProfile(samples, fixture.awayTeamId) : null;
  const priced = fixture.pricedOdds || {};
  const options = [];

  const formGap = (homeForm.ppg ?? homeRecord?.ppg ?? 0) - (awayForm.ppg ?? awayRecord?.ppg ?? 0);
  const played = Math.min(homeForm.played || homeRecord?.played || 0, awayForm.played || awayRecord?.played || 0);
  const goalSample = (homeGoals?.rows || 0) >= 4 && (awayGoals?.rows || 0) >= 4;
  const expHome = goalSample
    ? ((homeGoals.homeFor ?? homeGoals.avgFor) + (awayGoals.awayAgainst ?? awayGoals.avgAgainst)) / 2
    : null;
  const expAway = goalSample
    ? ((awayGoals.awayFor ?? awayGoals.avgFor) + (homeGoals.homeAgainst ?? homeGoals.avgAgainst)) / 2
    : null;
  const expTotal = expHome != null && expAway != null ? expHome + expAway : null;

  if (priceOk(priced.homeWin) && played >= 4 && (formGap >= 0.8 || (expHome != null && expAway != null && expHome >= expAway + 0.45))) {
    let confidence = 66 + Math.min(10, formGap * 4) + (goalSample ? 6 : -4);
    if (homeForm.seq.slice(-5).split('W').length - 1 < 2 && formGap < 1.2) confidence -= 8;
    options.push(candidate('Match result', `${fixture.homeTeam} win`, priced.homeWin, confidence, `Home form ${homeForm.seq || 'n/a'} vs away ${awayForm.seq || 'n/a'}. Published moneyline only.`));
  }

  if (priceOk(priced.awayWin) && played >= 4 && ((-formGap) >= 0.8 || (expAway != null && expHome != null && expAway >= expHome + 0.45))) {
    let confidence = 66 + Math.min(10, -formGap * 4) + (goalSample ? 6 : -4);
    options.push(candidate('Match result', `${fixture.awayTeam} win`, priced.awayWin, confidence, `Away form ${awayForm.seq || 'n/a'} vs home ${homeForm.seq || 'n/a'}. Published moneyline only.`));
  }

  const homeSpread = priced.spreadHome;
  if (homeSpread && priceOk(homeSpread.odds) && homeSpread.lineValue === 0.5 && played >= 4 && formGap >= -0.15) {
    const confidence = 68 + Math.min(8, formGap * 3) + (goalSample ? 4 : -3);
    options.push(candidate('Spread', `${fixture.homeTeam} ${homeSpread.line}`, homeSpread.odds, confidence, `Published ${homeSpread.line} line. Not a calculated double-chance price.`));
  }
  const awaySpread = priced.spreadAway;
  if (awaySpread && priceOk(awaySpread.odds) && awaySpread.lineValue === 0.5 && played >= 4 && -formGap >= -0.15) {
    const confidence = 68 + Math.min(8, -formGap * 3) + (goalSample ? 4 : -3);
    options.push(candidate('Spread', `${fixture.awayTeam} ${awaySpread.line}`, awaySpread.odds, confidence, `Published ${awaySpread.line} line. Not a calculated double-chance price.`));
  }

  if (expTotal != null && priced.totalOver?.lineValue != null && priceOk(priced.totalOver.odds)) {
    const line = priced.totalOver.lineValue;
    if (expTotal >= line + 0.28 && line <= 3.5) {
      const confidence = 67 + Math.min(10, (expTotal - line) * 6);
      options.push(candidate('Total goals', `Over ${line} goals`, priced.totalOver.odds, confidence, `Recent boxscore goals imply about ${round2(expTotal)} in this matchup. Line is the published total.`));
    }
  }
  if (expTotal != null && priced.totalUnder?.lineValue != null && priceOk(priced.totalUnder.odds)) {
    const line = priced.totalUnder.lineValue;
    if (expTotal <= line - 0.4) {
      const confidence = 67 + Math.min(8, (line - expTotal) * 5);
      options.push(candidate('Total goals', `Under ${line} goals`, priced.totalUnder.odds, confidence, `Recent boxscore goals imply about ${round2(expTotal)} in this matchup. Line is the published total.`));
    }
  }

  const viable = options.filter((option) => option.confidenceScore >= MIN_CONFIDENCE && priceOk(option.odds));
  if (!viable.length) {
    return noPick(priced.homeWin
      ? 'Published odds are on the fixture, but form and boxscore samples do not clear the evidence filter.'
      : 'No verified odds are published for this fixture.');
  }
  viable.sort((a, b) => b.confidenceScore - a.confidenceScore || a.odds - b.odds);
  return viable[0];
}

export function selectBasketball(fixture) {
  if (fixture.lowStakes) return noPick('Preseason or exhibition game excluded.');
  const homeLog = fixture.basketLog?.home || [];
  const awayLog = fixture.basketLog?.away || [];
  const homeRecord = recordRate(fixture.homeRecord, 'Basketball');
  const awayRecord = recordRate(fixture.awayRecord, 'Basketball');
  if ((homeLog.length < 5 && (homeRecord?.played || 0) < 5) || (awayLog.length < 5 && (awayRecord?.played || 0) < 5)) {
    return noPick('Fewer than 5 recent competitive games for at least one side.');
  }

  const priced = fixture.pricedOdds || {};
  const options = [];
  const homeMargin = homeLog.length >= 4 ? homeLog.slice(0, 8).reduce((sum, row) => sum + row.margin, 0) / Math.min(8, homeLog.length) : null;
  const awayMargin = awayLog.length >= 4 ? awayLog.slice(0, 8).reduce((sum, row) => sum + row.margin, 0) / Math.min(8, awayLog.length) : null;
  const expectedMargin = homeMargin != null && awayMargin != null ? (homeMargin - awayMargin) / 2 : null;
  const homePoints = homeLog.length ? homeLog.slice(0, 8).reduce((sum, row) => sum + row.pointsFor, 0) / Math.min(8, homeLog.length) : null;
  const awayPoints = awayLog.length ? awayLog.slice(0, 8).reduce((sum, row) => sum + row.pointsFor, 0) / Math.min(8, awayLog.length) : null;
  const expectedTotal = homePoints != null && awayPoints != null ? homePoints + awayPoints : null;

  const b2b = (log, fixtureDate) => log.some((row) => {
    const gap = (new Date(`${fixtureDate}T00:00:00Z`) - new Date(`${row.date}T00:00:00Z`)) / 86400000;
    return gap > 0 && gap <= 1;
  });
  const fatigue = b2b(homeLog, fixture.date) || b2b(awayLog, fixture.date);

  if (expectedMargin != null && priced.spreadHome?.lineValue != null && priceOk(priced.spreadHome.odds) && Math.abs(priced.spreadHome.lineValue) < 14) {
    if (expectedMargin >= priced.spreadHome.lineValue + 4) {
      options.push(candidate('Spread', `${fixture.homeTeam} ${priced.spreadHome.line}`, priced.spreadHome.odds, 70 + Math.min(8, (expectedMargin - priced.spreadHome.lineValue) / 2) - (fatigue ? 8 : 0), `Recent scoring margin versus the published spread. Back-to-back: ${fatigue ? 'yes' : 'no'}.`));
    }
  }
  if (expectedMargin != null && priced.spreadAway?.lineValue != null && priceOk(priced.spreadAway.odds) && Math.abs(priced.spreadAway.lineValue) < 14) {
    if (-expectedMargin >= priced.spreadAway.lineValue + 4) {
      options.push(candidate('Spread', `${fixture.awayTeam} ${priced.spreadAway.line}`, priced.spreadAway.odds, 70 + Math.min(8, (-expectedMargin - priced.spreadAway.lineValue) / 2) - (fatigue ? 8 : 0), `Recent scoring margin versus the published spread. Back-to-back: ${fatigue ? 'yes' : 'no'}.`));
    }
  }

  if (expectedTotal != null && priced.totalOver?.lineValue != null && priceOk(priced.totalOver.odds) && expectedTotal >= priced.totalOver.lineValue + 6) {
    options.push(candidate('Total points', `Over ${priced.totalOver.lineValue}`, priced.totalOver.odds, 71 + Math.min(8, (expectedTotal - priced.totalOver.lineValue) / 3) - (fatigue ? 4 : 0), `Recent points scored imply about ${round2(expectedTotal)} against the published total.`));
  }
  if (expectedTotal != null && priced.totalUnder?.lineValue != null && priceOk(priced.totalUnder.odds) && expectedTotal <= priced.totalUnder.lineValue - 6) {
    options.push(candidate('Total points', `Under ${priced.totalUnder.lineValue}`, priced.totalUnder.odds, 71 + Math.min(8, (priced.totalUnder.lineValue - expectedTotal) / 3) - (fatigue ? 4 : 0), `Recent points scored imply about ${round2(expectedTotal)} against the published total.`));
  }

  if (priceOk(priced.homeWin) && (homeRecord?.rate || 0) >= 0.6 && (homeRecord?.rate || 0) - (awayRecord?.rate || 0) >= 0.15) {
    options.push(candidate('Moneyline', `${fixture.homeTeam} moneyline`, priced.homeWin, 68 + Math.round(((homeRecord?.rate || 0) - (awayRecord?.rate || 0)) * 20) - (fatigue ? 6 : 0), 'Published moneyline. Record sample only, no invented price.'));
  }
  if (priceOk(priced.awayWin) && (awayRecord?.rate || 0) >= 0.6 && (awayRecord?.rate || 0) - (homeRecord?.rate || 0) >= 0.15) {
    options.push(candidate('Moneyline', `${fixture.awayTeam} moneyline`, priced.awayWin, 68 + Math.round(((awayRecord?.rate || 0) - (homeRecord?.rate || 0)) * 20) - (fatigue ? 6 : 0), 'Published moneyline. Record sample only, no invented price.'));
  }

  const viable = options.filter((option) => option.confidenceScore >= MIN_CONFIDENCE && priceOk(option.odds));
  if (!viable.length) return noPick('Basketball schedule and published prices do not clear the evidence filter.');
  viable.sort((a, b) => b.confidenceScore - a.confidenceScore);
  return viable[0];
}
