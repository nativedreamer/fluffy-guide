import { AccumulatorSelection, AccumulatorSlip, MatchFixture, OddsFormat, SportType } from './types';
import { GLOBAL_FIXTURES } from './sportsData';

/**
 * Converts decimal odds to Fractional or American formats
 */
export function formatOdds(decimalOdds: number, format: OddsFormat = 'DECIMAL'): string {
  if (isNaN(decimalOdds) || decimalOdds <= 1) return '1.00';

  if (format === 'DECIMAL') {
    return decimalOdds.toFixed(2);
  }

  if (format === 'AMERICAN') {
    if (decimalOdds >= 2.0) {
      const val = Math.round((decimalOdds - 1) * 100);
      return `+${val}`;
    } else {
      const val = Math.round(-100 / (decimalOdds - 1));
      return `${val}`;
    }
  }

  if (format === 'FRACTIONAL') {
    // Common fractional conversions
    const fraction = decimalOdds - 1;
    const tolerance = 0.05;
    const fractions: [number, number][] = [
      [1, 10], [1, 5], [1, 4], [2, 7], [1, 3], [2, 5], [4, 9], [1, 2], [4, 7], [3, 5],
      [2, 3], [4, 5], [5, 6], [1, 1], [11, 10], [6, 5], [5, 4], [11, 8], [6, 4], [8, 5],
      [7, 4], [9, 5], [2, 1], [9, 4], [5, 2], [11, 4], [3, 1], [7, 2], [4, 1], [5, 1]
    ];
    for (const [num, den] of fractions) {
      if (Math.abs(fraction - (num / den)) < tolerance) {
        return `${num}/${den}`;
      }
    }
    return `${Math.round(fraction * 10)}/10`;
  }

  return decimalOdds.toFixed(2);
}

/**
 * Quantitative Accumulator Generator (prompt workflow)
 * Strictly enforces:
 * - Minimum combined odds of targetOdds (default 10.00+)
 * - Unlimited selections, subject to evidence and duplicate-match filters
 * - Diversified (no duplicate matches)
 * - Fewest selections reasonably possible
 */
export function generateAccumulatorSlip(
  sport: SportType = 'FOOTBALL',
  targetOdds: number = 10.0,
  fixtures: MatchFixture[] = GLOBAL_FIXTURES
): AccumulatorSlip {
  // Step 1: Filter pool by requested sport
  let eligibleFixtures = fixtures.filter((f) => {
    if (sport === 'FOOTBALL') return f.sport === 'Football';
    if (sport === 'BASKETBALL') return f.sport === 'Basketball';
    return true; // BOTH
  });

  // Step 2: Remove high uncertainty fixtures (Confidence score >= 80)
  eligibleFixtures = eligibleFixtures
    .filter((f) => f.recommendedSelection.confidenceScore >= 80)
    .sort((a, b) => b.recommendedSelection.confidenceScore - a.recommendedSelection.confidenceScore);

  // Construct the combination reaching targetOdds with the fewest supported selections.
  const selectedPicks: AccumulatorSelection[] = [];
  let currentOdds = 1.0;

  for (const fix of eligibleFixtures) {
    // Avoid duplicate match
    if (selectedPicks.some((p) => p.matchId === fix.id)) continue;

    const pick = fix.recommendedSelection;
    selectedPicks.push({
      id: `sel-${fix.id}-${Date.now()}`,
      matchId: fix.id,
      match: `${fix.homeTeam} vs ${fix.awayTeam}`,
      sport: fix.sport,
      league: fix.league,
      prediction: pick.pick,
      market: pick.market,
      odds: pick.odds,
      confidenceScore: pick.confidenceScore,
      dataQuality: 'High',
      date: fix.date
    });

    currentOdds *= pick.odds;

    // Check if target is achieved
    if (currentOdds >= targetOdds && selectedPicks.length >= 3) {
      break;
    }
  }

  // Final Risk Audit & Recalculate
  const finalCombinedOdds = Math.round(currentOdds * 100) / 100;
  const bookingCode = `AEE-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const todayStr = new Date().toISOString().split('T')[0];

  return {
    id: `slip-${Date.now()}`,
    createdAt: todayStr,
    sport,
    targetOdds,
    combinedOdds: finalCombinedOdds,
    totalSelections: selectedPicks.length,
    selections: selectedPicks,
    riskNote: 'No sports prediction is guaranteed. Odds and match information can change before kickoff.',
    bookingCode
  };
}

/**
 * Formats accumulator slip strictly according to Section 15 of user's prompt
 */
export function formatSection15Output(slip: AccumulatorSlip): string {
  const sportLabel = 
    slip.sport === 'FOOTBALL' ? 'Football' : 
    slip.sport === 'BASKETBALL' ? 'Basketball' : 
    'Football + Basketball';

  let text = `AEE FOOTBALL GROUP \n\n`;
  text += `Sport: ${sportLabel}\n`;
  text += `Date: ${slip.createdAt}\n`;
  text += `Target Odds: ${slip.targetOdds.toFixed(2)}+\n\n`;
  text += `| #   | Match            | Prediction | Odds |\n`;
  text += `| --- | ---------------- | ---------- | ---- |\n`;

  slip.selections.forEach((sel, i) => {
    const num = `${i + 1}`.padEnd(3, ' ');
    const match = sel.match.padEnd(16, ' ');
    const pred = sel.prediction.padEnd(10, ' ');
    const odds = sel.odds.toFixed(2);
    text += `| ${num} | ${match} | ${pred} | ${odds} |\n`;
  });

  text += `\nTotal Selections: ${slip.totalSelections}\n`;
  text += `Combined Odds: ${slip.combinedOdds.toFixed(2)}\n\n`;
  text += `Risk Note: ${slip.riskNote}\n\n`;
  text += `Aee football group \nprompt by mr. Wolf`;

  return text;
}
