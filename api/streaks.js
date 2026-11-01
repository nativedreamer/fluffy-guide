// Removed: dedicated serverless function exceeded Vercel Hobby limit (max 12).
// Streak tips are served via existing GET /api/analysis → payload.streakTips
// Logic lives in api/lib/streaks.js (imported by pipeline, not a function entrypoint).
export default async function handler(_req, res) {
  res.statusCode = 410;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({
    error: 'Endpoint retired to stay under serverless function limit',
    use: 'GET /api/analysis and read streakTips',
    fetchedAt: new Date().toISOString()
  }));
}
