const COMPETITIONS = [
  { sport: 'soccer', league: 'eng.1', label: 'Premier League', country: 'England' },
  { sport: 'soccer', league: 'esp.1', label: 'La Liga', country: 'Spain' },
  { sport: 'soccer', league: 'ita.1', label: 'Serie A', country: 'Italy' },
  { sport: 'soccer', league: 'ger.1', label: 'Bundesliga', country: 'Germany' },
  { sport: 'basketball', league: 'nba', label: 'NBA', country: 'USA' }
];

const DAY_MS = 24 * 60 * 60 * 1000;

function dateKey(date) {
  return date.toISOString().slice(0, 10).replaceAll('-', '');
}

function dayCategory(eventDate, today) {
  const eventDay = new Date(eventDate);
  const diff = Math.round((Date.UTC(eventDay.getUTCFullYear(), eventDay.getUTCMonth(), eventDay.getUTCDate()) - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())) / DAY_MS);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'TOMORROW';
  return 'WEEKEND';
}

function toFixture(event, competition, now, today) {
  const competitors = event.competitions?.[0]?.competitors || [];
  const home = competitors.find((team) => team.homeAway === 'home');
  const away = competitors.find((team) => team.homeAway === 'away');
  if (!home || !away || !event.date) return null;

  const kickoff = new Date(event.date);
  if (Number.isNaN(kickoff.getTime()) || kickoff <= now) return null;

  const status = event.status?.type?.state === 'in' ? 'LIVE' : 'UPCOMING';
  const time = kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false });
  const date = kickoff.toISOString().slice(0, 10);

  return {
    id: `${competition.sport}-${competition.league}-${event.id}`,
    sport: competition.sport === 'basketball' ? 'Basketball' : 'Football',
    league: competition.label,
    country: competition.country,
    homeTeam: home.team?.displayName || home.team?.name || 'Home team',
    awayTeam: away.team?.displayName || away.team?.name || 'Away team',
    kickoffTime: `${time} UTC`,
    kickoffAt: kickoff.toISOString(),
    date,
    dayCategory: dayCategory(event.date, today),
    scheduleType: 'BOTH',
    status,
    venue: event.competitions?.[0]?.venue?.fullName || 'Venue not published',
    source: 'ESPN scoreboard',
    sourceUrl: `https://www.espn.com/${competition.sport}/scoreboard/_/league/${competition.league}`,
    homeForm: [],
    awayForm: [],
    h2hSummary: 'Fixture verified from the live scoreboard feed; no unverified analysis is shown.',
    odds: { homeWin: 1, awayWin: 1 },
    recommendedSelection: {
      market: 'Fixture only',
      pick: 'No pick — live odds unavailable',
      odds: 1,
      confidenceScore: 0,
      evidenceGrade: 'B+',
      reasonSummary: 'No prediction is generated without a verified odds/statistics feed.'
    }
  };
}

export default async function handler(req, res) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const days = Math.min(Math.max(Number(req.query?.days || 7), 1), 14);
  const dates = Array.from({ length: days }, (_, index) => dateKey(new Date(today.getTime() + index * DAY_MS)));

  try {
    const requests = dates.flatMap((date) => COMPETITIONS.map(async (competition) => {
      const url = `https://site.api.espn.com/apis/site/v2/sports/${competition.sport}/${competition.league}/scoreboard?dates=${date}`;
      const response = await fetch(url, { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error(`${competition.label} returned ${response.status}`);
      const payload = await response.json();
      return (payload.events || []).map((event) => toFixture(event, competition, now, today)).filter(Boolean);
    }));

    const fixtures = (await Promise.all(requests)).flat()
      .filter((fixture, index, all) => all.findIndex((item) => item.id === fixture.id) === index)
      .sort((a, b) => new Date(a.kickoffAt) - new Date(b.kickoffAt));

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ fixtures, fetchedAt: now.toISOString(), source: 'ESPN scoreboard', windowDays: days });
  } catch (error) {
    console.error('Fixture feed error:', error);
    return res.status(502).json({ fixtures: [], fetchedAt: now.toISOString(), source: 'ESPN scoreboard', error: 'Live fixture feed unavailable' });
  }
}
