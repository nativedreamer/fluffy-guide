import { getMatchAnalysis } from '../api/lib/pipeline.js';

process.env.SAMPLE_FIXTURE_CAP = process.env.SAMPLE_FIXTURE_CAP || '28';
process.env.SAMPLE_EVENT_CAP = process.env.SAMPLE_EVENT_CAP || '140';

const started = Date.now();
const result = await getMatchAnalysis({
  days: Number(process.env.ANALYSIS_DAYS || 5),
  sport: 'BOTH',
  targetOdds: 10,
  refresh: true
});

console.log(JSON.stringify({
  fixtures: result.fixtures.length,
  football: result.fixtures.filter((fixture) => fixture.sport === 'Football').length,
  basketball: result.fixtures.filter((fixture) => fixture.sport === 'Basketball').length,
  corners: result.corners.length,
  bookings: result.bookings.length,
  samples: result.dataset.samples,
  accumulator: {
    meetsTarget: result.accumulator.meetsTarget,
    selections: result.accumulator.totalSelections,
    odds: result.accumulator.combinedOdds
  },
  coverage: result.coverage,
  warnings: result.warnings,
  seconds: Math.round((Date.now() - started) / 1000)
}, null, 2));
