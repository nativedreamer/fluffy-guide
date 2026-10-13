import { getFixtures } from './lib/pipeline.js';
import { readQuery, sendJson } from './lib/util.js';

export default async function handler(req, res) {
  const query = readQuery(req);
  try {
    const payload = await getFixtures({ days: query.days });
    return sendJson(res, 200, payload, 180);
  } catch (error) {
    console.error('Fixture feed error:', error);
    return sendJson(res, 502, {
      fixtures: [],
      fetchedAt: new Date().toISOString(),
      source: 'ESPN scoreboard',
      error: 'Live fixture feed unavailable'
    }, 30);
  }
}
