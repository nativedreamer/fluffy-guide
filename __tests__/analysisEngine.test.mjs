import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { americanToDecimal, parseEspnOdds } from '../api/lib/odds.js';
import { parseSummary } from '../api/lib/samples.js';
import { projectBookings, projectCorners } from '../api/lib/project.js';
import { buildAccumulator } from '../api/lib/accumulator.js';
import { selectFootball } from '../api/lib/select.js';
import { devig, footballModel, stampEdge, footballQuote } from '../api/lib/edge.js';

function sample(id, homeId, awayId, cornersHome, cornersAway, cardsHome, cardsAway, goals = [2, 1]) {
  return {
    eventId: id,
    date: `2026-09-${String(10 + Number(id.replace(/\D/g, '').slice(-2) || 1)).padStart(2, '0')}`.slice(0, 10),
    homeTeamId: homeId,
    awayTeamId: awayId,
    homeTeam: 'Home',
    awayTeam: 'Away',
    homeGoals: goals[0],
    awayGoals: goals[1],
    homeCorners: cornersHome,
    awayCorners: cornersAway,
    totalCorners: cornersHome + cornersAway,
    homeYellow: cardsHome,
    awayYellow: cardsAway,
    homeRed: 0,
    awayRed: 0,
    homeFouls: 12,
    awayFouls: 13,
    totalCards: cardsHome + cardsAway,
    totalYellow: cardsHome + cardsAway,
    totalRed: 0,
    firstHalfCards: 2,
    secondHalfCards: cardsHome + cardsAway - 2,
    referee: 'Alex Referee',
    source: 'ESPN summary boxscore'
  };
}

describe('odds', () => {
  test('converts American prices and ignores OFF', () => {
    assert.equal(americanToDecimal('+150'), 2.5);
    assert.equal(americanToDecimal('-160'), 1.63);
    assert.equal(americanToDecimal('OFF'), null);
    assert.equal(americanToDecimal('EVEN'), 2);
  });

  test('reads only published moneyline and total prices', () => {
    const parsed = parseEspnOdds({
      provider: { name: 'DraftKings' },
      moneyline: { home: { close: { odds: '+120' } }, away: { close: { odds: '-140' } }, draw: { close: { odds: '+240' } } },
      total: { over: { close: { line: 'o2.5', odds: '-110' } }, under: { close: { line: 'u2.5', odds: '-110' } } },
      pointSpread: { home: { close: { line: '+0.5', odds: '-130' } }, away: { close: { line: '-0.5', odds: '+105' } } }
    });
    assert.equal(parsed.homeWin, 2.2);
    assert.equal(parsed.draw, 3.4);
    assert.equal(parsed.totalOver.lineValue, 2.5);
    assert.equal(parsed.spreadHome.lineValue, 0.5);
  });
});

describe('summary samples', () => {
  test('parses boxscore corners and key-event cards', () => {
    const parsed = parseSummary({
      header: { competitions: [{ id: '99', date: '2026-09-01T15:00Z', status: { type: { state: 'post' } }, competitors: [
        { homeAway: 'home', score: '2' },
        { homeAway: 'away', score: '0' }
      ] }] },
      boxscore: { teams: [
        { homeAway: 'home', team: { id: '1', displayName: 'Alpha' }, statistics: [
          { name: 'wonCorners', displayValue: '7' },
          { name: 'yellowCards', displayValue: '2' },
          { name: 'redCards', displayValue: '0' },
          { name: 'foulsCommitted', displayValue: '11' }
        ] },
        { homeAway: 'away', team: { id: '2', displayName: 'Beta' }, statistics: [
          { name: 'wonCorners', displayValue: '4' },
          { name: 'yellowCards', displayValue: '3' },
          { name: 'redCards', displayValue: '1' },
          { name: 'foulsCommitted', displayValue: '14' }
        ] }
      ] },
      keyEvents: [
        { type: { text: 'Yellow Card' }, period: { number: 1 } },
        { type: { text: 'Yellow Card' }, period: { number: 2 } },
        { type: { text: 'Red Card' }, period: { number: 2 } }
      ],
      gameInfo: { officials: [{ displayName: 'Casey Official', position: { name: 'Referee' } }] }
    });
    assert.equal(parsed.totalCorners, 11);
    assert.equal(parsed.totalCards, 6);
    assert.equal(parsed.firstHalfCards, 1);
    assert.equal(parsed.secondHalfCards, 2);
    assert.equal(parsed.referee, 'Casey Official');
  });

  test('does not invent a sample when corners are missing', () => {
    const parsed = parseSummary({
      boxscore: { teams: [
        { homeAway: 'home', team: { id: '1' }, statistics: [{ name: 'foulsCommitted', displayValue: '10' }] },
        { homeAway: 'away', team: { id: '2' }, statistics: [{ name: 'foulsCommitted', displayValue: '10' }] }
      ] }
    });
    assert.equal(parsed, null);
  });
});

describe('corner and booking projections', () => {
  test('supports a high corner threshold from repeated boxscores', () => {
    const samples = [];
    for (let i = 0; i < 8; i += 1) {
      samples.push(sample(`h${i}`, '10', i % 2 ? '30' : '31', 7, 4, 2, 2));
      samples.push(sample(`a${i}`, i % 2 ? '40' : '41', '20', 3, 6, 2, 3));
    }
    const projection = projectCorners(samples, '10', '20');
    assert.equal(projection.excluded, false);
    assert.ok(projection.supportedThreshold >= 7.5);
    assert.match(projection.historicalOver75Freq, /\/\d+ \(/);
    assert.ok(projection.confidenceScore >= 55 && projection.confidenceScore <= 90);
    assert.equal(projection.firstHalfProj, undefined);
  });

  test('excludes a short sample instead of guessing', () => {
    const projection = projectCorners([
      sample('1', '10', '20', 8, 4, 1, 1),
      sample('2', '10', '21', 6, 3, 1, 1)
    ], '10', '20');
    assert.equal(projection.excluded, true);
    assert.equal(projection.dataQuality, 'Low');
  });

  test('projects total cards and keeps half cards separate', () => {
    const samples = [];
    for (let i = 0; i < 8; i += 1) {
      samples.push(sample(`c${i}`, '10', `${30 + i}`, 5, 4, 3, 2));
      samples.push(sample(`d${i}`, `${40 + i}`, '20', 4, 5, 2, 3));
    }
    const projection = projectBookings(samples, '10', '20', 'Alex Referee');
    assert.equal(projection.excluded, false);
    assert.match(projection.totalCardProjection, /Over \d\.5 cards/);
    assert.equal(projection.referee.verified, true);
    assert.ok(projection.confidenceScore > 0);
  });
});

describe('accumulator filter', () => {
  function fixture(id, odds, confidence, sport = 'Football') {
    return {
      id,
      sport,
      status: 'UPCOMING',
      homeTeam: `Home ${id}`,
      awayTeam: `Away ${id}`,
      league: 'League',
      date: '2026-10-14',
      recommendedSelection: {
        market: 'Match result',
        pick: `Home ${id} win`,
        odds,
        confidenceScore: confidence
      }
    };
  }

  test('reaches 10.00 with the fewest supported selections and never more than 7', () => {
    const fixtures = Array.from({ length: 8 }, (_, index) => fixture(`m${index}`, 1.8, 80));
    const slip = buildAccumulator(fixtures, 'FOOTBALL', 10);
    assert.equal(slip.meetsTarget, true);
    assert.ok(slip.totalSelections <= 7);
    assert.ok(slip.totalSelections >= 3);
    assert.ok(slip.combinedOdds >= 10);
    assert.equal(slip.totalSelections, 4);
  });

  test('does not pad a short-priced pool into a fake 10+ slip', () => {
    const fixtures = Array.from({ length: 7 }, (_, index) => fixture(`s${index}`, 1.3, 85));
    const slip = buildAccumulator(fixtures, 'FOOTBALL', 10);
    assert.equal(slip.meetsTarget, false);
    assert.ok(slip.combinedOdds < 10);
    assert.match(slip.riskNote, /couldn't identify enough/);
  });

  test('drops low-confidence and duplicate matches', () => {
    const fixtures = [
      fixture('a', 2, 90),
      fixture('a', 2, 90),
      fixture('b', 2.1, 60),
      fixture('c', 2.2, 88),
      fixture('d', 2.3, 86)
    ];
    const slip = buildAccumulator(fixtures, 'FOOTBALL', 10);
    assert.equal(slip.meetsTarget, true);
    assert.equal(new Set(slip.selections.map((selection) => selection.matchId)).size, slip.selections.length);
    assert.ok(slip.selections.every((selection) => selection.confidenceScore >= 74));
  });

  test('football selector refuses a pick when the price is unpublished', () => {
    const pick = selectFootball({
      homeTeam: 'Alpha',
      awayTeam: 'Beta',
      homeForm: ['W', 'W', 'W', 'W', 'D'],
      awayForm: ['L', 'L', 'L', 'D', 'L'],
      homeTeamId: '10',
      awayTeamId: '20',
      pricedOdds: {}
    }, []);
    assert.equal(pick.confidenceScore, 0);
    assert.equal(pick.market, 'Fixture only');
  });

  test('drops a form pick when the shrunk model does not beat the price', () => {
    const priced = { homeWin: 1.45, draw: 4.2, awayWin: 6.5 };
    const fair = devig([priced.homeWin, priced.draw, priced.awayWin]);
    const model = footballModel(
      { rows: 8, avgFor: 1.2, avgAgainst: 1.1, homeFor: 1.3, homeAgainst: 1.0, awayFor: 1.0, awayAgainst: 1.2 },
      { rows: 8, avgFor: 1.3, avgAgainst: 1.2, homeFor: 1.4, homeAgainst: 1.0, awayFor: 1.2, awayAgainst: 1.1 }
    );
    const option = {
      market: 'Match result',
      pick: 'Alpha win',
      odds: 1.45,
      confidenceScore: 80,
      evidenceGrade: 'A',
      reasonSummary: 'Form only.'
    };
    const stamped = stampEdge(option, footballQuote(option, { homeTeam: 'Alpha', awayTeam: 'Beta' }, model, priced));
    assert.ok(fair[0] > model.home);
    assert.equal(stamped._drop, true);
    const samples = [];
    for (let i = 0; i < 6; i += 1) {
      samples.push(sample(`e${i}`, '10', `${80 + i}`, 5, 4, 1, 1, [1, 1]));
      samples.push(sample(`f${i}`, `${90 + i}`, '20', 4, 5, 1, 1, [1, 1]));
    }
    const pick = selectFootball({
      homeTeam: 'Alpha',
      awayTeam: 'Beta',
      homeForm: ['W', 'W', 'W', 'W', 'W'],
      awayForm: ['L', 'L', 'L', 'L', 'L'],
      homeRecord: '8-1-1',
      awayRecord: '1-1-8',
      homeTeamId: '10',
      awayTeamId: '20',
      pricedOdds: priced
    }, samples);
    assert.equal(pick.market, 'Fixture only');
    assert.match(pick.reasonSummary, /does not beat the devigged price/);
  });
});
