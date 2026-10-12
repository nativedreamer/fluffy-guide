import { MatchFixture, DailyTipGroup, WeeklyTipGroup } from './types';

/**
 * Fixtures are loaded from /api/fixtures at runtime. Keeping this default empty
 * prevents a stale or invented schedule from ever being rendered offline.
 */
export const GLOBAL_FIXTURES: MatchFixture[] = [];
export const CURATED_DAILY_TIPS: DailyTipGroup[] = [];
export const CURATED_WEEKLY_TIPS: WeeklyTipGroup[] = [];
