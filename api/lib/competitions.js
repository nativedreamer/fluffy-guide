/** ESPN league codes verified against the public scoreboard (invalid codes omitted). */
export const FOOTBALL_COMPETITIONS = [
  { sport: 'soccer', league: 'eng.1', label: 'Premier League', country: 'England' },
  { sport: 'soccer', league: 'eng.2', label: 'Championship', country: 'England' },
  { sport: 'soccer', league: 'eng.3', label: 'League One', country: 'England' },
  { sport: 'soccer', league: 'esp.1', label: 'La Liga', country: 'Spain' },
  { sport: 'soccer', league: 'esp.2', label: 'La Liga 2', country: 'Spain' },
  { sport: 'soccer', league: 'ger.1', label: 'Bundesliga', country: 'Germany' },
  { sport: 'soccer', league: 'ger.2', label: '2. Bundesliga', country: 'Germany' },
  { sport: 'soccer', league: 'ita.1', label: 'Serie A', country: 'Italy' },
  { sport: 'soccer', league: 'ita.2', label: 'Serie B', country: 'Italy' },
  { sport: 'soccer', league: 'fra.1', label: 'Ligue 1', country: 'France' },
  { sport: 'soccer', league: 'fra.2', label: 'Ligue 2', country: 'France' },
  { sport: 'soccer', league: 'ned.1', label: 'Eredivisie', country: 'Netherlands' },
  { sport: 'soccer', league: 'por.1', label: 'Primeira Liga', country: 'Portugal' },
  { sport: 'soccer', league: 'bel.1', label: 'Belgian Pro League', country: 'Belgium' },
  { sport: 'soccer', league: 'sco.1', label: 'Scottish Premiership', country: 'Scotland' },
  { sport: 'soccer', league: 'tur.1', label: 'Super Lig', country: 'Turkey' },
  { sport: 'soccer', league: 'gre.1', label: 'Greek Super League', country: 'Greece' },
  { sport: 'soccer', league: 'den.1', label: 'Danish Superliga', country: 'Denmark' },
  { sport: 'soccer', league: 'nor.1', label: 'Eliteserien', country: 'Norway' },
  { sport: 'soccer', league: 'swe.1', label: 'Allsvenskan', country: 'Sweden' },
  { sport: 'soccer', league: 'aut.1', label: 'Austrian Bundesliga', country: 'Austria' },
  { sport: 'soccer', league: 'sui.1', label: 'Swiss Super League', country: 'Switzerland' },
  { sport: 'soccer', league: 'usa.1', label: 'MLS', country: 'USA' },
  { sport: 'soccer', league: 'mex.1', label: 'Liga MX', country: 'Mexico' },
  { sport: 'soccer', league: 'bra.1', label: 'Brasileirao', country: 'Brazil' },
  { sport: 'soccer', league: 'arg.1', label: 'Liga Profesional', country: 'Argentina' },
  { sport: 'soccer', league: 'col.1', label: 'Primera A', country: 'Colombia' },
  { sport: 'soccer', league: 'chi.1', label: 'Chilean Primera', country: 'Chile' },
  { sport: 'soccer', league: 'uru.1', label: 'Liga AUF', country: 'Uruguay' },
  { sport: 'soccer', league: 'jpn.1', label: 'J1 League', country: 'Japan' },
  { sport: 'soccer', league: 'chn.1', label: 'Chinese Super League', country: 'China' },
  { sport: 'soccer', league: 'aus.1', label: 'A-League Men', country: 'Australia' },
  { sport: 'soccer', league: 'ksa.1', label: 'Saudi Pro League', country: 'Saudi Arabia' },
  { sport: 'soccer', league: 'rsa.1', label: 'South African Premiership', country: 'South Africa' },
  { sport: 'soccer', league: 'nga.1', label: 'Nigerian Professional League', country: 'Nigeria' },
  { sport: 'soccer', league: 'gha.1', label: 'Ghanaian Premier League', country: 'Ghana' },
  { sport: 'soccer', league: 'uefa.champions', label: 'UEFA Champions League', country: 'Europe' },
  { sport: 'soccer', league: 'uefa.europa', label: 'UEFA Europa League', country: 'Europe' },
  { sport: 'soccer', league: 'uefa.europa.conf', label: 'UEFA Conference League', country: 'Europe' }
];

export const BASKETBALL_COMPETITIONS = [
  { sport: 'basketball', league: 'nba', label: 'NBA', country: 'USA' },
  { sport: 'basketball', league: 'wnba', label: 'WNBA', country: 'USA' },
  { sport: 'basketball', league: 'mens-college-basketball', label: 'NCAA', country: 'USA' },
  { sport: 'basketball', league: 'euroleague', label: 'EuroLeague', country: 'Europe' },
  { sport: 'basketball', league: 'nbl', label: 'NBL', country: 'Australia' },
  { sport: 'basketball', league: 'acb', label: 'Liga ACB', country: 'Spain' }
];

export const ALL_COMPETITIONS = [...FOOTBALL_COMPETITIONS, ...BASKETBALL_COMPETITIONS];
