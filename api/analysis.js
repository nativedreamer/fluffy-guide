import { getMatchAnalysis } from './lib/pipeline.js';
import { readQuery, sendJson } from './lib/util.js';

export default async function handler(req, res) {
  const query = readQuery(req);
  const sport = String(query.sport || 'FOOTBALL').toUpperCase();
  const allowed = sport === 'BASKETBALL' || sport === 'BOTH' ? sport : 'FOOTBALL';
  try {
    const payload = await getMatchAnalysis({
      days: query.days,
      sport: allowed,
      targetOdds: query.targetOdds || query.target || 10,
      refresh: query.refresh === '1' || query.refresh === 'true'
    });
    return sendJson(res, 200, payload, 120);
  } catch (error) {
    console.error('Analysis feed error:', error);
    return sendJson(res, 502, {
      fixtures: [],
      corners: [],
      bookings: [],
      dailyTips: [],
      weeklyTips: [],
      error: 'Match analysis unavailable',
      fetchedAt: new Date().toISOString()
    }, 15);
  }
}
