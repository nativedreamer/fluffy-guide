import { round2, toNumber } from './util.js';

export function americanToDecimal(odds) {
  if (odds == null) return null;
  const raw = String(odds).trim();
  if (!raw || /^off$/i.test(raw)) return null;
  if (/^even$/i.test(raw)) return 2;
  const n = Number(raw.replace('+', ''));
  if (!Number.isFinite(n) || n === 0) return null;
  const decimal = n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
  return round2(decimal);
}

function closeOdds(side) {
  return side?.close?.odds ?? side?.open?.odds ?? null;
}

function closeLine(side) {
  return side?.close?.line ?? side?.open?.line ?? null;
}

/**
 * Reads only prices ESPN actually published (DraftKings/ESPN BET on the scoreboard).
 * Does not synthesize double chance, BTTS, or Asian lines that are not in the payload.
 */
export function parseEspnOdds(oddsBlock) {
  const block = Array.isArray(oddsBlock) ? oddsBlock[0] : oddsBlock;
  if (!block) {
    return { provider: null, homeWin: null, draw: null, awayWin: null };
  }

  const homeSpreadLine = closeLine(block.pointSpread?.home);
  const awaySpreadLine = closeLine(block.pointSpread?.away);
  const overLine = closeLine(block.total?.over);
  const underLine = closeLine(block.total?.under);

  return {
    provider: block.provider?.displayName || block.provider?.name || null,
    homeWin: americanToDecimal(closeOdds(block.moneyline?.home) ?? block.homeTeamOdds?.moneyLine),
    awayWin: americanToDecimal(closeOdds(block.moneyline?.away) ?? block.awayTeamOdds?.moneyLine),
    draw: americanToDecimal(closeOdds(block.moneyline?.draw) ?? block.drawOdds?.moneyLine),
    spreadHome: homeSpreadLine == null ? null : {
      line: String(homeSpreadLine),
      lineValue: toNumber(homeSpreadLine),
      odds: americanToDecimal(closeOdds(block.pointSpread?.home))
    },
    spreadAway: awaySpreadLine == null ? null : {
      line: String(awaySpreadLine),
      lineValue: toNumber(awaySpreadLine),
      odds: americanToDecimal(closeOdds(block.pointSpread?.away))
    },
    totalOver: overLine == null ? null : {
      line: String(overLine).replace(/^o/i, ''),
      lineValue: toNumber(overLine),
      odds: americanToDecimal(closeOdds(block.total?.over))
    },
    totalUnder: underLine == null ? null : {
      line: String(underLine).replace(/^u/i, ''),
      lineValue: toNumber(underLine),
      odds: americanToDecimal(closeOdds(block.total?.under))
    },
    overUnder: typeof block.overUnder === 'number' ? block.overUnder : toNumber(block.overUnder)
  };
}

export function toFixtureOdds(parsed) {
  const odds = {
    homeWin: parsed.homeWin || 1,
    awayWin: parsed.awayWin || 1
  };
  if (parsed.draw) odds.draw = parsed.draw;
  if (parsed.totalOver?.lineValue != null && parsed.totalOver.odds) {
    if (parsed.totalOver.lineValue <= 1.5) odds.over15 = parsed.totalOver.odds;
    if (parsed.totalOver.lineValue <= 2.5) odds.over25 = parsed.totalOver.odds;
    if (parsed.totalOver.lineValue <= 3.5) odds.over35 = parsed.totalOver.odds;
  }
  if (parsed.totalUnder?.lineValue != null && parsed.totalUnder.odds) {
    if (parsed.totalUnder.lineValue >= 2.5) odds.under25 = parsed.totalUnder.odds;
    if (parsed.totalUnder.lineValue >= 3.5) odds.under35 = parsed.totalUnder.odds;
    if (parsed.totalUnder.lineValue >= 4.5) odds.under45 = parsed.totalUnder.odds;
  }
  if (parsed.spreadHome?.odds) {
    odds.spread = { line: parsed.spreadHome.line, odds: parsed.spreadHome.odds };
  }
  if (parsed.totalOver?.odds && parsed.totalUnder?.odds) {
    odds.totalPoints = {
      line: String(parsed.totalOver.lineValue ?? parsed.overUnder ?? ''),
      overOdds: parsed.totalOver.odds,
      underOdds: parsed.totalUnder.odds
    };
  }
  return odds;
}
