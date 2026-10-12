import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateAccumulatorSlip, formatOdds, formatSection15Output } from '../lib/sportsEngine.ts';
import { GLOBAL_FIXTURES } from '../lib/sportsData.ts';

describe('AEE Football Group — Sports Quantitative Models', () => {
  test('generateAccumulatorSlip is safe when no verified odds are available', () => {
    const slip = generateAccumulatorSlip('FOOTBALL', 10.0, GLOBAL_FIXTURES);
    assert.strictEqual(slip.combinedOdds, 1);
    assert.ok(slip.totalSelections <= 7, `Expected total selections <= 7, got ${slip.totalSelections}`);
    assert.strictEqual(slip.selections.length, 0);
  });

  test('generateAccumulatorSlip handles hybrid Football + Basketball', () => {
    const slip = generateAccumulatorSlip('BOTH', 10.0, GLOBAL_FIXTURES);
    assert.strictEqual(slip.combinedOdds, 1);
    assert.ok(slip.totalSelections <= 7);
  });

  test('formatOdds converts decimal to Fractional and American', () => {
    assert.strictEqual(formatOdds(1.50, 'DECIMAL'), '1.50');
    assert.strictEqual(formatOdds(1.50, 'FRACTIONAL'), '1/2');
    assert.strictEqual(formatOdds(2.50, 'AMERICAN'), '+150');
  });

  test('formatSection15Output contains mandatory header, table, and author prompt signature', () => {
    const slip = generateAccumulatorSlip('FOOTBALL', 10.0, GLOBAL_FIXTURES);
    const output = formatSection15Output(slip);
    assert.ok(output.includes('AEE FOOTBALL GROUP'));
    assert.ok(output.includes('prompt by mr. Wolf'));
    assert.ok(output.includes('Total Selections:'));
    assert.ok(output.includes('Combined Odds:'));
    assert.ok(output.includes('Risk Note:'));
  });
});
