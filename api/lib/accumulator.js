import { round2, utcDate } from './util.js';
import { MAX_ODDS, MIN_CONFIDENCE, MIN_ODDS } from './select.js';

const MAX_SELECTIONS = 7;

function eligibleFixtures(fixtures, sport) {
  const seen = new Set();
  return (fixtures || []).filter((fixture) => {
    if (seen.has(fixture.id)) return false;
    if (fixture.status && fixture.status !== 'UPCOMING') return false;
    if (sport === 'FOOTBALL' && fixture.sport !== 'Football') return false;
    if (sport === 'BASKETBALL' && fixture.sport !== 'Basketball') return false;
    const pick = fixture.recommendedSelection;
    if (!pick || pick.confidenceScore < MIN_CONFIDENCE) return false;
    if (!(pick.odds >= MIN_ODDS && pick.odds <= MAX_ODDS)) return false;
    if (typeof pick.edge === 'number' && pick.edge <= -0.08) return false;
    if (!pick.market || pick.market === 'Fixture only') return false;
    seen.add(fixture.id);
    return true;
  }).sort((a, b) => {
    const edgeA = a.recommendedSelection.edge;
    const edgeB = b.recommendedSelection.edge;
    if (typeof edgeA === 'number' && typeof edgeB === 'number' && edgeA !== edgeB) return edgeB - edgeA;
    return b.recommendedSelection.confidenceScore - a.recommendedSelection.confidenceScore;
  });
}

function combinations(pool, size) {
  const found = [];
  const index = Array.from({ length: size }, (_, i) => i);
  const n = pool.length;
  if (!size || size > n) return found;
  while (true) {
    found.push(index.map((i) => pool[i]));
    let cursor = size - 1;
    while (cursor >= 0 && index[cursor] === n - size + cursor) cursor -= 1;
    if (cursor < 0) break;
    index[cursor] += 1;
    for (let next = cursor + 1; next < size; next += 1) index[next] = index[next - 1] + 1;
  }
  return found;
}

function referenceCode(ids) {
  let hash = 0;
  for (const char of ids.join('|')) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return `AEE-${hash.toString(36).toUpperCase().padStart(4, '0').slice(0, 4)}-${String(hash % 10000).padStart(4, '0')}`;
}

function toSelection(fixture, index) {
  const pick = fixture.recommendedSelection;
  return {
    id: `sel-${fixture.id}-${index}`,
    matchId: fixture.id,
    match: `${fixture.homeTeam} vs ${fixture.awayTeam}`,
    sport: fixture.sport,
    league: fixture.league,
    prediction: pick.pick,
    market: pick.market,
    odds: pick.odds,
    confidenceScore: pick.confidenceScore,
    dataQuality: fixture.corners?.dataQuality || fixture.bookings?.dataQuality || 'Moderate',
    date: fixture.date
  };
}

export function buildAccumulator(fixtures, sport = 'FOOTBALL', targetOdds = 10, { minSelections = 1 } = {}) {
  const pool = eligibleFixtures(fixtures, sport).slice(0, 12);
  let best = null;
  for (let size = Math.max(1, minSelections); size <= Math.min(MAX_SELECTIONS, pool.length); size += 1) {
    for (const group of combinations(pool, size)) {
      const odds = group.reduce((product, fixture) => product * fixture.recommendedSelection.odds, 1);
      if (odds + 1e-9 < targetOdds) continue;
      const minConfidence = Math.min(...group.map((fixture) => fixture.recommendedSelection.confidenceScore));
      const edgeValues = group.map((fixture) => fixture.recommendedSelection.edge).filter((edge) => typeof edge === 'number');
      const minEdge = edgeValues.length === group.length ? Math.min(...edgeValues) : null;
      const betterEdge = minEdge != null && (best?.minEdge == null || minEdge > best.minEdge);
      const sameEdge = (minEdge == null && best?.minEdge == null) || (minEdge != null && best?.minEdge != null && Math.abs(minEdge - best.minEdge) < 1e-9);
      if (!best || betterEdge || (sameEdge && (minConfidence > best.minConfidence || (minConfidence === best.minConfidence && odds < best.odds)))) {
        best = { group, odds, minConfidence, minEdge };
      }
    }
    if (best) break;
  }

  const meetsTarget = Boolean(best);
  const chosen = best ? best.group : pool.slice(0, Math.min(MAX_SELECTIONS, pool.length));
  const combined = chosen.reduce((product, fixture) => product * fixture.recommendedSelection.odds, chosen.length ? 1 : 1);
  const selections = chosen.map(toSelection);
  return {
    id: `slip-${sport}-${targetOdds}`,
    createdAt: utcDate(),
    sport,
    targetOdds,
    combinedOdds: round2(chosen.length ? combined : 1),
    totalSelections: selections.length,
    selections,
    meetsTarget,
    maxSelections: MAX_SELECTIONS,
    riskNote: meetsTarget
      ? 'No sports prediction is guaranteed. Odds and match information can change before kickoff.'
      : 'I couldn\'t identify enough sufficiently supported selections to construct a 10+ odds accumulator within the 7-selection limit.',
    bookingCode: referenceCode(selections.map((selection) => selection.matchId))
  };
}

export function buildDailyTips(fixtures, sport = 'BOTH') {
  const today = utcDate();
  const todays = (fixtures || []).filter((fixture) => fixture.date === today);
  const tips = [];
  const slip2 = buildAccumulator(todays, sport, 2.4, { minSelections: 2 });
  if (slip2.meetsTarget && slip2.totalSelections >= 2 && slip2.totalSelections <= 3) {
    tips.push({
      id: 'daily-double',
      title: 'Daily double',
      subtitle: 'Two or three upcoming fixtures that clear the evidence filter',
      badge: 'DAILY DOUBLE',
      riskType: 'BANKER_DOUBLE',
      combinedOdds: slip2.combinedOdds,
      selections: slip2.selections,
      bookingCode: slip2.bookingCode,
      confidenceScore: Math.min(...slip2.selections.map((selection) => selection.confidenceScore)),
      rationale: 'Only published prices and the evidence filter. This is not a guaranteed outcome.'
    });
  }
  const slip10 = buildAccumulator(todays, sport, 10);
  if (slip10.meetsTarget) {
    tips.push({
      id: 'daily-acca',
      title: 'Daily 10+ target',
      subtitle: 'Today only, maximum 7 selections',
      badge: '10.00+ TARGET',
      riskType: 'DAILY_10_ODDS',
      combinedOdds: slip10.combinedOdds,
      selections: slip10.selections,
      bookingCode: slip10.bookingCode,
      confidenceScore: Math.min(...slip10.selections.map((selection) => selection.confidenceScore)),
      rationale: 'Built from today\'s upcoming fixtures only. Odds can move before kickoff.'
    });
  }
  return tips.slice(0, 3);
}

export function buildWeeklyTips(fixtures, sport = 'BOTH') {
  const today = utcDate();
  const upcoming = (fixtures || []).filter((fixture) => fixture.date > today);
  const slip = buildAccumulator(upcoming, sport, 10);
  if (!slip.meetsTarget) return [];
  return [{
    id: 'weekly-target',
    title: 'Upcoming 10+ slate',
    subtitle: 'Later fixtures only, maximum 7 selections',
    badge: 'WEEKLY TARGET',
    riskType: 'HYBRID_WEEKEND',
    combinedOdds: slip.combinedOdds,
    selections: slip.selections,
    bookingCode: slip.bookingCode,
    confidenceScore: Math.min(...slip.selections.map((selection) => selection.confidenceScore)),
    daysCovered: [...new Set(slip.selections.map((selection) => selection.date))].join(', '),
    rationale: 'Separate from today\'s slate. No selection was added only to chase the odds target.'
  }];
}
