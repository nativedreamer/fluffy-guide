export type SportType = 'FOOTBALL' | 'BASKETBALL' | 'BOTH';

export type AnalysisCategory = 
  | 'DAILY_TIPS'
  | 'WEEKLY_TIPS'
  | 'ACCUMULATOR'
  | 'CORNERS'
  | 'BOOKINGS'
  | 'BOTH_CORNERS_BOOKINGS';

export type OddsFormat = 'DECIMAL' | 'FRACTIONAL' | 'AMERICAN';

export type DataQuality = 'High' | 'Moderate' | 'Low';

export type DayCategory = 'TODAY' | 'TOMORROW' | 'WEEKEND';

export type MatchStatus = 'LIVE' | 'UPCOMING' | 'FT';

export interface RefereeInfo {
  name: string;
  country: string;
  matchesSample: number;
  yellowCardsPerMatch: number;
  redCardsPerMatch: number;
  totalCardsPerMatch: number;
  foulsPerMatch: number;
  penaltiesPerMatch: number;
  strictness: 'Strict' | 'Moderate' | 'Lenient';
  verified: boolean;
}

export interface CornersStatistics {
  totalProjection: string; // e.g. "Over 7.5", "Over 8.5", "Over 9.5", "Over 10.5"
  supportedThreshold: number; // 7.5, 8.5, etc.
  historicalOver75Freq: string; // e.g. "8/10 (80%)"
  historicalOver85Freq: string; // e.g. "7/10 (70%)"
  historicalOver95Freq: string; // e.g. "5/10 (50%)"
  firstHalfProj?: string; // e.g. "Over 3.5 First Half"
  secondHalfProj?: string; // e.g. "Over 4.5 Second Half"
  homeAvgCornersWon: number;
  homeAvgCornersConceded: number;
  awayAvgCornersWon: number;
  awayAvgCornersConceded: number;
  combinedCornerAvg: number;
  sampleMatches: number;
  tacticalNotes: string;
  attackingWidthRating: number; // 1-10
  shotVolumeRating: number; // 1-10
  dataQuality: DataQuality;
  confidenceScore: number; // 0-100
}

export interface BookingsStatistics {
  totalCardProjection: string; // e.g. "Over 3.5 Cards", "Over 4.5 Cards"
  supportedThreshold: number; // 3.5, 4.5
  historicalThresholdFreq: string; // e.g. "8/10 (80%)"
  firstHalfCardProj?: string; // e.g. "Over 1.5 Cards 1H"
  secondHalfCardProj?: string; // e.g. "Over 2.5 Cards 2H"
  homeAvgCards: number;
  homeAvgFouls: number;
  awayAvgCards: number;
  awayAvgFouls: number;
  referee?: RefereeInfo;
  rivalryLevel: 'High (Derby/Title)' | 'Moderate' | 'Standard';
  sampleMatches: number;
  tacticalNotes: string;
  dataQuality: DataQuality;
  confidenceScore: number; // 0-100
}

export interface MatchFixture {
  id: string;
  sport: 'Football' | 'Basketball';
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: string;
  kickoffAt?: string;
  date: string; // YYYY-MM-DD
  dayCategory: DayCategory;
  scheduleType: 'DAILY' | 'WEEKLY' | 'BOTH';
  venue: string;
  source?: string;
  sourceUrl?: string;
  status: MatchStatus;
  liveMinute?: string;
  liveScore?: string;
  homeForm: ('W' | 'D' | 'L')[];
  awayForm: ('W' | 'D' | 'L')[];
  h2hSummary: string;
  
  // Available Betting Odds
  odds: {
    homeWin: number;
    draw?: number;
    awayWin: number;
    doubleChance1X?: number;
    doubleChanceX2?: number;
    doubleChance12?: number;
    drawNoBet1?: number;
    drawNoBet2?: number;
    over15?: number;
    over25?: number;
    over35?: number;
    under25?: number;
    under35?: number;
    under45?: number;
    bttsYes?: number;
    bttsNo?: number;
    spread?: { line: string; odds: number };
    totalPoints?: { line: string; overOdds: number; underOdds: number };
  };

  // Recommended Best Value Selection (Probability + Evidence + Value)
  recommendedSelection: {
    market: string;
    pick: string;
    odds: number;
    confidenceScore: number; // 0-100
    evidenceGrade: 'A+' | 'A' | 'B+';
    reasonSummary: string;
  };

  // Detailed Modules
  corners?: CornersStatistics;
  bookings?: BookingsStatistics;
}

export interface AccumulatorSelection {
  id: string;
  matchId: string;
  match: string;
  sport: 'Football' | 'Basketball';
  league: string;
  prediction: string;
  market: string;
  odds: number;
  confidenceScore: number;
  dataQuality: DataQuality;
  date: string;
}

export interface AccumulatorSlip {
  id: string;
  createdAt: string;
  sport: SportType;
  targetOdds: number;
  combinedOdds: number;
  totalSelections: number; // max 7
  selections: AccumulatorSelection[];
  riskNote: string;
  bookingCode: string;
  estimatedReturnWithStake?: number;
}

export interface DailyTipGroup {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  riskType: 'BANKER_DOUBLE' | 'HIGH_VALUE_TREBLE' | 'DAILY_10_ODDS';
  combinedOdds: number;
  selections: AccumulatorSelection[];
  bookingCode: string;
  confidenceScore: number;
  rationale: string;
}

export interface WeeklyTipGroup {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  riskType: 'PREMIER_LEAGUE_SPECIAL' | 'EUROPE_MEGA_ACCA' | 'HYBRID_WEEKEND';
  combinedOdds: number;
  selections: AccumulatorSelection[];
  bookingCode: string;
  confidenceScore: number;
  daysCovered: string;
  rationale: string;
}
