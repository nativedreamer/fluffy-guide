import { buildAccumulator } from '../api/lib/accumulator.js';
import { AccumulatorSlip, MatchFixture, OddsFormat, SportType } from './types';

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
 * Quantitative accumulator.
 * Uses the same server rules: published prices only, confidence filter,
 * maximum 7 selections, combined odds at or above the target when the
 * evidence supports it.
 */
export function generateAccumulatorSlip(
  sport: SportType = 'FOOTBALL',
  targetOdds: number = 10.0,
  fixtures: MatchFixture[] = []
): AccumulatorSlip {
  return buildAccumulator(fixtures, sport, targetOdds) as AccumulatorSlip;
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
  text += `| #   | Match            | Prediction | Odds | Confidence |\n`;
  text += `| --- | ---------------- | ---------- | ---- | ---------- |\n`;

  slip.selections.forEach((sel, i) => {
    const num = `${i + 1}`.padEnd(3, ' ');
    const match = sel.match.padEnd(16, ' ');
    const pred = sel.prediction.padEnd(10, ' ');
    const odds = sel.odds.toFixed(2);
    text += `| ${num} | ${match} | ${pred} | ${odds} | ${sel.confidenceScore}% |\n`;
  });

  text += `\nTotal Selections: ${slip.totalSelections}/7\n`;
  text += `Combined Odds: ${slip.combinedOdds.toFixed(2)}\n\n`;
  if (slip.meetsTarget === false) {
    text += `${slip.riskNote}\n`;
    text += `The rows above are the strongest supported selections only. They are not a recommended 10+ accumulator.\n\n`;
  }
  text += `Risk Note: No sports prediction is guaranteed. Odds and match information can change before kickoff.\n\n`;
  text += `Aee football group \nprompt by mr. Wolf`;

  return text;
}
