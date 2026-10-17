import { avg, clamp, round2 } from './util.js';
import { perspective } from './samples.js';
import { CARD_MODEL_MIN, CORNER_MODEL_MIN, shrink, shrunkRate, sumOver } from './edge.js';

function freq(rows, predicate) {
  if (!rows.length) return null;
  const hits = rows.filter(predicate).length;
  return {
    hits,
    n: rows.length,
    pct: hits / rows.length,
    label: `${hits}/${rows.length} (${Math.round((100 * hits) / rows.length)}%)`
  };
}

function rowsFor(samples, teamId) {
  return samples
    .filter((sample) => sample.homeTeamId === String(teamId) || sample.awayTeamId === String(teamId))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 10)
    .map((sample) => perspective(sample, teamId))
    .filter((row) => row.totalCorners != null);
}

function qualityFor(homeRows, awayRows, homeVenue, awayVenue) {
  if (homeRows.length < 4 || awayRows.length < 4) return 'Low';
  if (homeRows.length >= 6 && awayRows.length >= 6 && homeVenue.length >= 3 && awayVenue.length >= 3) return 'High';
  return 'Moderate';
}

function chooseLine(expected, pooled, lines, cushion, minimumRate, modelAt) {
  for (const line of lines) {
    const history = freq(pooled, (row) => row.totalCorners > line);
    const modelProb = modelAt ? modelAt(line) : 1;
    if (expected >= line + cushion && history && history.pct >= minimumRate && history.n >= 8 && modelProb >= CORNER_MODEL_MIN) {
      return { line, history, modelProb };
    }
  }
  return null;
}

export function projectCorners(samples, homeTeamId, awayTeamId) {
  const homeRows = rowsFor(samples, homeTeamId);
  const awayRows = rowsFor(samples, awayTeamId);
  const homeVenue = homeRows.filter((row) => row.venue === 'home');
  const awayVenue = awayRows.filter((row) => row.venue === 'away');
  const dataQuality = qualityFor(homeRows, awayRows, homeVenue, awayVenue);
  if (dataQuality === 'Low') {
    return {
      excluded: true,
      dataQuality,
      sampleMatches: homeRows.length + awayRows.length,
      warning: 'Fewer than 4 verified boxscores for at least one team.'
    };
  }

  const homeBase = homeVenue.length >= 3 ? homeVenue : homeRows;
  const awayBase = awayVenue.length >= 3 ? awayVenue : awayRows;
  const homeFor = avg(homeBase, (row) => row.cornersWon);
  const homeAgainst = avg(homeBase, (row) => row.cornersAgainst);
  const awayFor = avg(awayBase, (row) => row.cornersWon);
  const awayAgainst = avg(awayBase, (row) => row.cornersAgainst);
  if ([homeFor, homeAgainst, awayFor, awayAgainst].some((value) => value == null)) {
    return { excluded: true, dataQuality: 'Low', warning: 'Corner counts missing inside the sample.' };
  }

  const expected = (homeFor + awayAgainst + awayFor + homeAgainst) / 2;
  const sampleN = Math.min(homeBase.length, awayBase.length);
  const lambdaHome = shrunkRate(homeFor, awayAgainst, sampleN, 4.8);
  const lambdaAway = shrunkRate(awayFor, homeAgainst, sampleN, 4.2);
  const modelAt = (line) => (lambdaHome != null && lambdaAway != null ? sumOver(lambdaHome, lambdaAway, line) : 0);
  const pooled = [...homeRows, ...awayRows];
  const supported = chooseLine(expected, pooled, [11.5, 10.5, 9.5, 8.5, 7.5], 0.45, 0.55, modelAt)
    || (() => {
      const history = freq(pooled, (row) => row.totalCorners > 7.5);
      const modelProb = modelAt(7.5);
      if (expected >= 8.3 && history && history.pct >= 0.62 && modelProb >= CORNER_MODEL_MIN) return { line: 7.5, history, modelProb };
      return null;
    })();

  const over75 = freq(pooled, (row) => row.totalCorners > 7.5);
  const over85 = freq(pooled, (row) => row.totalCorners > 8.5);
  const over95 = freq(pooled, (row) => row.totalCorners > 9.5);
  if (!supported) {
    return {
      excluded: true,
      dataQuality,
      sampleMatches: homeRows.length + awayRows.length,
      combinedCornerAvg: round2(expected),
      historicalOver75Freq: over75?.label || 'Data unavailable',
      warning: 'History and the shrunk corner model do not both support Over 7.5 or higher.'
    };
  }

  let confidence = 64;
  confidence += dataQuality === 'High' ? 8 : 3;
  confidence += Math.round(clamp((homeRows.length + awayRows.length - 8) * 0.6, 0, 8));
  confidence += Math.round(clamp((expected - supported.line) * 4, 0, 8));
  confidence += supported.history.pct >= 0.7 ? 6 : 0;
  if (supported.modelProb >= 0.7) confidence += 4;
  confidence = clamp(Math.round(confidence), 55, 90);

  return {
    excluded: false,
    totalProjection: `Over ${supported.line}`,
    supportedThreshold: supported.line,
    historicalOver75Freq: over75?.label || 'Data unavailable',
    historicalOver85Freq: over85?.label || 'Data unavailable',
    historicalOver95Freq: over95?.label || 'Data unavailable',
    homeAvgCornersWon: round2(homeFor),
    homeAvgCornersConceded: round2(homeAgainst),
    awayAvgCornersWon: round2(awayFor),
    awayAvgCornersConceded: round2(awayAgainst),
    combinedCornerAvg: round2(expected),
    modelProbability: round2(supported.modelProb),
    sampleMatches: homeRows.length + awayRows.length,
    tacticalNotes: `Expected corners ${round2(expected)} from venue-weighted won/conceded splits. History and the shrunk Poisson model both clear Over ${supported.line} (${Math.round(supported.modelProb * 100)}%). First-half corners: Data unavailable. Second-half corners: Data unavailable.`,
    attackingWidthRating: clamp(Math.round((avg(homeBase, (row) => row.shotsFor) || 0) / 2), 1, 10),
    shotVolumeRating: clamp(Math.round(((avg(homeBase, (row) => row.shotsFor) || 0) + (avg(awayBase, (row) => row.shotsFor) || 0)) / 4), 1, 10),
    dataQuality,
    confidenceScore: confidence,
    warning: homeVenue.length < 3 || awayVenue.length < 3
      ? 'Venue split is smaller than 3 matches, so the overall recent sample is used for that team.'
      : ''
  };
}

export function projectBookings(samples, homeTeamId, awayTeamId, refereeName) {
  const homeRows = rowsFor(samples, homeTeamId).filter((row) => row.cards != null);
  const awayRows = rowsFor(samples, awayTeamId).filter((row) => row.cards != null);
  const homeVenue = homeRows.filter((row) => row.venue === 'home');
  const awayVenue = awayRows.filter((row) => row.venue === 'away');
  const dataQuality = qualityFor(homeRows, awayRows, homeVenue, awayVenue);
  if (dataQuality === 'Low') {
    return {
      excluded: true,
      dataQuality,
      sampleMatches: homeRows.length + awayRows.length,
      warning: 'Fewer than 4 verified card boxscores for at least one team.'
    };
  }

  const homeBase = homeVenue.length >= 3 ? homeVenue : homeRows;
  const awayBase = awayVenue.length >= 3 ? awayVenue : awayRows;
  const homeCards = avg(homeBase, (row) => row.cards);
  const awayCards = avg(awayBase, (row) => row.cards);
  const homeFouls = avg(homeBase, (row) => row.fouls);
  const awayFouls = avg(awayBase, (row) => row.fouls);
  if (homeCards == null || awayCards == null) {
    return { excluded: true, dataQuality: 'Low', warning: 'Card counts missing inside the sample.' };
  }

  const expected = homeCards + awayCards;
  const lambdaHome = Math.max(0.3, shrink(homeCards, homeBase.length, 1.9, 5));
  const lambdaAway = Math.max(0.3, shrink(awayCards, awayBase.length, 1.9, 5));
  const cardModel = (line) => sumOver(lambdaHome, lambdaAway, line);
  const pooled = [...homeRows, ...awayRows];
  const cardLines = [5.5, 4.5, 3.5];
  let supported = null;
  for (const line of cardLines) {
    const history = freq(pooled, (row) => (row.totalCards ?? -1) > line);
    const modelProb = cardModel(line);
    if (expected >= line + 0.35 && history && history.pct >= 0.55 && history.n >= 8 && modelProb >= CARD_MODEL_MIN) {
      supported = { line, history, modelProb };
      break;
    }
  }
  const baseline = freq(pooled, (row) => (row.totalCards ?? -1) > 3.5);
  const baselineModel = cardModel(3.5);
  if (!supported && expected >= 4.2 && baseline && baseline.pct >= 0.6 && baselineModel >= CARD_MODEL_MIN) {
    supported = { line: 3.5, history: baseline, modelProb: baselineModel };
  }
  if (!supported) {
    return {
      excluded: true,
      dataQuality,
      sampleMatches: homeRows.length + awayRows.length,
      warning: 'History and the shrunk card model do not both support a total-card threshold.'
    };
  }

  const halfRows = pooled.filter((row) => row.firstHalfCards != null && row.secondHalfCards != null);
  const halfCoverage = pooled.length ? halfRows.length / pooled.length : 0;
  let firstHalfCardProj;
  let secondHalfCardProj;
  if (halfCoverage >= 0.7 && halfRows.length >= 6) {
    const fh = avg(halfRows, (row) => row.firstHalfCards);
    const sh = avg(halfRows, (row) => row.secondHalfCards);
    const fhFreq = freq(halfRows, (row) => row.firstHalfCards > 1.5);
    const shFreq = freq(halfRows, (row) => row.secondHalfCards > 1.5);
    if (fh != null && fh >= 1.85 && fhFreq && fhFreq.pct >= 0.55) firstHalfCardProj = 'Over 1.5 cards';
    if (sh != null && sh >= 1.85 && shFreq && shFreq.pct >= 0.55) secondHalfCardProj = 'Over 1.5 cards';
  }

  const refereeSamples = refereeName
    ? samples.filter((sample) => sample.referee && sample.referee.toLowerCase() === refereeName.toLowerCase())
    : [];
  const referee = refereeName && refereeSamples.length >= 5
    ? {
        name: refereeName,
        country: 'Not published',
        matchesSample: refereeSamples.length,
        yellowCardsPerMatch: round2(avg(refereeSamples, (sample) => sample.totalYellow) || 0),
        redCardsPerMatch: round2(avg(refereeSamples, (sample) => sample.totalRed) || 0),
        totalCardsPerMatch: round2(avg(refereeSamples, (sample) => sample.totalCards) || 0),
        foulsPerMatch: round2(avg(refereeSamples, (sample) => (sample.homeFouls || 0) + (sample.awayFouls || 0)) || 0),
        penaltiesPerMatch: 0,
        strictness: (avg(refereeSamples, (sample) => sample.totalCards) || 0) >= 5 ? 'Strict' : (avg(refereeSamples, (sample) => sample.totalCards) || 0) >= 3.5 ? 'Moderate' : 'Lenient',
        verified: true
      }
    : null;

  let confidence = 62;
  confidence += dataQuality === 'High' ? 8 : 3;
  confidence += Math.round(clamp((expected - supported.line) * 5, 0, 8));
  confidence += supported.history.pct >= 0.7 ? 6 : 0;
  if (!refereeName) confidence -= 4;
  else if (!referee) confidence -= 2;
  confidence = clamp(Math.round(confidence), 50, 86);

  return {
    excluded: false,
    totalCardProjection: `Over ${supported.line} cards`,
    supportedThreshold: supported.line,
    historicalThresholdFreq: supported.history.label,
    modelProbability: round2(supported.modelProb),
    firstHalfCardProj,
    secondHalfCardProj,
    homeAvgCards: round2(homeCards),
    homeAvgFouls: homeFouls == null ? 0 : round2(homeFouls),
    awayAvgCards: round2(awayCards),
    awayAvgFouls: awayFouls == null ? 0 : round2(awayFouls),
    referee: referee || undefined,
    rivalryLevel: 'Standard',
    sampleMatches: homeRows.length + awayRows.length,
    tacticalNotes: `${refereeName
      ? `Referee ${referee ? `${referee.name} (${referee.matchesSample} sampled matches)` : `${refereeName} appointed, sample under 5`}. `
      : 'Referee not confirmed. '}Cards = yellow + red, not booking points. History and the shrunk card model both clear Over ${supported.line} (${Math.round((supported.modelProb || 0) * 100)}%).`,
    dataQuality,
    confidenceScore: confidence,
    warning: refereeName ? '' : 'Referee appointment is not on the ESPN summary.'
  };
}

export function goalProfile(samples, teamId) {
  const rows = rowsFor(samples, teamId).filter((row) => row.goalsFor != null && row.goalsAgainst != null);
  const venueHome = rows.filter((row) => row.venue === 'home');
  const venueAway = rows.filter((row) => row.venue === 'away');
  return {
    rows: rows.length,
    avgFor: avg(rows, (row) => row.goalsFor),
    avgAgainst: avg(rows, (row) => row.goalsAgainst),
    homeFor: avg(venueHome, (row) => row.goalsFor),
    homeAgainst: avg(venueHome, (row) => row.goalsAgainst),
    awayFor: avg(venueAway, (row) => row.goalsFor),
    awayAgainst: avg(venueAway, (row) => row.goalsAgainst),
    over15: freq(rows, (row) => (row.goalsFor || 0) + (row.goalsAgainst || 0) > 1.5),
    over25: freq(rows, (row) => (row.goalsFor || 0) + (row.goalsAgainst || 0) > 2.5),
    btts: freq(rows.filter((row) => row.bothTeamsScored != null), (row) => row.bothTeamsScored)
  };
}
