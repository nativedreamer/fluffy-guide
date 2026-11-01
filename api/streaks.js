import { getMatchAnalysis } from './lib/pipeline.js';
import { readQuery, sendJson } from './lib/util.js';

export default async function handler(req, res) {
  const query = readQuery(req);
  try {
    const payload = await getMatchAnalysis({
      days: query.days || 2,
      sport: 'FOOTBALL',
      refresh: query.refresh === '1' || query.refresh === 'true'
    });
    return sendJson(res, 200, {
      fetchedAt: payload.fetchedAt,
      timezone: 'CAT (Africa/Johannesburg, UTC+2)',
      window: 'Today 00:00–23:59 CAT · league games only (no cups / women / youth)',
      rules: 'Only fixtures where at least one side has 4/5 or 5/5 wins or losses. WVL = strong wins vs strong losses.',
      count: (payload.streakTips || []).length,
      streakTips: payload.streakTips || [],
      signature: payload.signature
    }, 90);
  } catch (error) {
    console.error('Streak feed error:', error);
    return sendJson(res, 502, {
      streakTips: [],
      error: 'Streak tips unavailable',
      fetchedAt: new Date().toISOString()
    }, 15);
  }
}
