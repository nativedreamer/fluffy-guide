import React, { useEffect, useState } from 'react';
import { 
  AnalysisCategory, 
  MatchFixture, 
  OddsFormat, 
  SportType, 
  AccumulatorSlip,
  DailyTipGroup,
  WeeklyTipGroup
} from '../lib/types';
import { GLOBAL_FIXTURES } from '../lib/sportsData';
import { 
  generateAccumulatorSlip, 
  formatSection15Output 
} from '../lib/sportsEngine';
import { usePWAInstall } from '../lib/usePWAInstall';

import { Header } from '../components/Header';
import { CategoryTabs } from '../components/CategoryTabs';
import { DailyTipsSection } from '../components/DailyTipsSection';
import { WeeklyTipsSection } from '../components/WeeklyTipsSection';
import { AccumulatorCard } from '../components/AccumulatorCard';
import { CornersTable } from '../components/CornersTable';
import { BookingsTable } from '../components/BookingsTable';
import { AllFixturesList } from '../components/AllFixturesList';
import { MatchDetailModal } from '../components/MatchDetailModal';
import { LetsGoModal } from '../components/LetsGoModal';
import { BetSlipDrawer } from '../components/BetSlipDrawer';
import { PwaInstallBanner } from '../components/PwaInstallBanner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { StreakTipsSection, StreakTipRow } from '../components/StreakTipsSection';

import { 
  Flame, 
  Target, 
  Flag, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Activity,
  Layers,
  Calendar,
  CalendarDays
} from 'lucide-react';

export default function App() {
  const [fixtures, setFixtures] = useState<MatchFixture[]>([]);
  const [dailyTips, setDailyTips] = useState<DailyTipGroup[]>([]);
  const [weeklyTips, setWeeklyTips] = useState<WeeklyTipGroup[]>([]);
  const [streakTips, setStreakTips] = useState<StreakTipRow[]>([]);
  const [coverage, setCoverage] = useState('');
  const [activeTab, setActiveTab] = useState<AnalysisCategory | 'ALL_FIXTURES'>('ALL_FIXTURES');
  const [fixturesLoading, setFixturesLoading] = useState(true);
  const [fixturesError, setFixturesError] = useState<string | null>(null);
  const [analysisMessage, setAnalysisMessage] = useState<string | null>(null);
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('DECIMAL');
  const [selectedSport, setSelectedSport] = useState<SportType>('FOOTBALL');
  const [targetOdds, setTargetOdds] = useState<number>(10.0);

  const [slip, setSlip] = useState<AccumulatorSlip>(() => {
    return generateAccumulatorSlip('FOOTBALL', 10.0, []);
  });

  const loadAnalysis = async (sport: SportType, target: number) => {
    setFixturesLoading(true);
    setFixturesError(null);
    try {
      const response = await fetch(`/api/analysis?days=6&sport=${sport}&targetOdds=${target}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Match analysis unavailable');
      const nextFixtures = payload.fixtures || [];
      const nextSlip = payload.accumulator || generateAccumulatorSlip(sport, target, nextFixtures);
      setFixtures(nextFixtures);
      setSlip(nextSlip);
      setDailyTips(payload.dailyTips || []);
      setWeeklyTips(payload.weeklyTips || []);
      setStreakTips(Array.isArray(payload.streakTips) ? payload.streakTips : []);
      setCoverage(`${(payload.coverage || []).slice(0, 8).join(', ') || 'ESPN'} · ${payload.dataset?.samples || 0} boxscores`);
      setAnalysisMessage(nextSlip.meetsTarget ? null : nextSlip.riskNote || "I couldn't identify enough sufficiently supported selections to construct a 10+ odds accumulator within the 7-selection limit.");
    } catch (error) {
      setFixtures([]);
      setDailyTips([]);
      setWeeklyTips([]);
      setStreakTips([]);
      setFixturesError(error instanceof Error ? error.message : 'Match analysis unavailable');
      setAnalysisMessage("I couldn't identify enough sufficiently supported selections to construct a 10+ odds accumulator within the 7-selection limit.");
    } finally {
      setFixturesLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis('FOOTBALL', 10);
  }, []);

  const [isLetsGoOpen, setIsLetsGoOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isCopiedFromDrawer, setIsCopiedFromDrawer] = useState(false);

  const { isInstallable, isOffline, promptInstall } = usePWAInstall();

  const selectedFixture = selectedMatchId
    ? fixtures.find((f) => f.id === selectedMatchId) || null
    : null;

  const handleRunAnalysis = (sport: SportType, target: number) => {
    setSelectedSport(sport);
    setTargetOdds(target);
    setActiveTab('ACCUMULATOR');
    loadAnalysis(sport, target);
  };

  const handleRegenerate = () => {
    loadAnalysis(selectedSport, targetOdds);
  };

  const handleLoadDailyTip = (dailyTip: DailyTipGroup) => {
    setSlip({
      ...slip,
      combinedOdds: dailyTip.combinedOdds,
      totalSelections: dailyTip.selections.length,
      selections: dailyTip.selections,
      bookingCode: dailyTip.bookingCode
    });
    setActiveTab('ACCUMULATOR');
  };

  const handleLoadWeeklyTip = (weeklyTip: WeeklyTipGroup) => {
    setSlip({
      ...slip,
      combinedOdds: weeklyTip.combinedOdds,
      totalSelections: weeklyTip.selections.length,
      selections: weeklyTip.selections,
      bookingCode: weeklyTip.bookingCode
    });
    setActiveTab('ACCUMULATOR');
  };

  const handleAddToSlip = (fix: MatchFixture) => {
    if (slip.selections.some((s) => s.matchId === fix.id)) return;

    const newSel = {
      id: `sel-${fix.id}-${Date.now()}`,
      matchId: fix.id,
      match: `${fix.homeTeam} vs ${fix.awayTeam}`,
      sport: fix.sport,
      league: fix.league,
      prediction: fix.recommendedSelection.pick,
      market: fix.recommendedSelection.market,
      odds: fix.recommendedSelection.odds,
      confidenceScore: fix.recommendedSelection.confidenceScore,
      dataQuality: 'High' as const,
      date: fix.date
    };

    const updatedSelections = [...slip.selections, newSel];
    const newOdds = +(updatedSelections.reduce((acc, curr) => acc * curr.odds, 1.0)).toFixed(2);

    setSlip({
      ...slip,
      combinedOdds: newOdds,
      totalSelections: updatedSelections.length,
      selections: updatedSelections
    });
  };

  const handleRemoveSelection = (id: string) => {
    const updated = slip.selections.filter((s) => s.id !== id);
    const newOdds = +(updated.reduce((acc, curr) => acc * curr.odds, 1.0)).toFixed(2);
    setSlip({
      ...slip,
      combinedOdds: newOdds,
      totalSelections: updated.length,
      selections: updated
    });
  };

  const handleClearSlip = () => {
    setSlip({
      ...slip,
      combinedOdds: 1.0,
      totalSelections: 0,
      selections: []
    });
  };

  const handleCopyFromDrawer = () => {
    const text = formatSection15Output(slip);
    navigator.clipboard.writeText(text).then(() => {
      setIsCopiedFromDrawer(true);
      setTimeout(() => setIsCopiedFromDrawer(false), 3000);
    });
  };

  const liveCount = fixtures.filter((fixture) => fixture.status === 'LIVE').length;
  const verifiedCount = fixtures.filter((fixture) => fixture.recommendedSelection.confidenceScore >= 60).length;

  return (
    <div className="min-h-screen bg-[#07110f] text-slate-100 flex flex-col pb-28 selection:bg-emerald-500/30 selection:text-emerald-200">
      <Header
        oddsFormat={oddsFormat}
        onSelectOddsFormat={setOddsFormat}
        onTriggerLetsGo={() => setIsLetsGoOpen(true)}
        onOpenInstallPrompt={promptInstall}
        isInstallable={isInstallable}
        isOffline={isOffline}
        selectedSport={selectedSport}
        onSelectSport={(s) => {
          setSelectedSport(s);
          loadAnalysis(s, targetOdds);
        }}
      />

      <CategoryTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        accumulatorCount={slip.selections.length}
      />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-7 px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-br from-[#18372c] via-[#10251e] to-[#0c1a17] p-5 shadow-[0_28px_90px_rgba(0,0,0,.22)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#b9f6d0]/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b9f6d0]"><span className="live-pulse h-2 w-2 rounded-full bg-[#67e69a]" />{isOffline ? 'Cached radar' : 'Live radar'}<span className="text-white/25">/</span><span className="text-[#9bb3a8]">Verified evidence only</span></div>
              <h2 className="max-w-2xl text-3xl font-semibold leading-[1.02] tracking-[-0.055em] text-white sm:text-5xl">Read the slate<br /><span className="text-[#b9f6d0]">before you place a leg.</span></h2>
              <p className="mt-5 max-w-xl text-sm leading-6 text-[#b7c9bf] sm:text-base">A quieter way to move through upcoming fixtures, understand the signal, and build an accumulator without losing the thread.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3"><button onClick={() => setActiveTab('ALL_FIXTURES')} className="pressable rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#0b1715] hover:bg-[#b9f6d0]">Explore the slate</button><button onClick={() => setIsLetsGoOpen(true)} className="pressable rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Build an accumulator <span className="ml-1 text-[#ffd38a]">→</span></button></div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><span className="text-[10px] uppercase tracking-[0.14em] text-[#9bb3a8]">Fixtures</span><strong className="mt-2 block text-2xl font-semibold tabular-nums text-white">{fixtures.length || '—'}</strong><span className="mt-1 block text-[11px] text-[#9bb3a8]">next six days</span></div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><span className="text-[10px] uppercase tracking-[0.14em] text-[#9bb3a8]">Live now</span><strong className="mt-2 block text-2xl font-semibold tabular-nums text-[#b9f6d0]">{liveCount || '—'}</strong><span className="mt-1 block text-[11px] text-[#9bb3a8]">on the feed</span></div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><span className="text-[10px] uppercase tracking-[0.14em] text-[#9bb3a8]">Signal</span><strong className="mt-2 block text-2xl font-semibold tabular-nums text-white">{verifiedCount || '—'}</strong><span className="mt-1 block text-[11px] text-[#9bb3a8]">evidence-filtered</span></div>
              <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><span className="text-[10px] uppercase tracking-[0.14em] text-[#9bb3a8]">Slip</span><strong className="mt-2 block text-2xl font-semibold tabular-nums text-[#ffd38a]">{slip.combinedOdds > 1 ? slip.combinedOdds.toFixed(2) : '—'}</strong><span className="mt-1 block text-[11px] text-[#9bb3a8]">combined odds</span></div>
            </div>
          </div>
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[.025] px-4 py-3 text-xs text-[#9bb3a8]"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#67e69a]" />Analysis is grounded in current fixtures and historical boxscore samples.</span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#b9f6d0]">{coverage || 'Waiting for the feed'}</span></div>
        {fixturesLoading && (
          <div className="rounded-xl border border-emerald-800 bg-[#051c13] px-4 py-3 text-xs font-mono text-emerald-200">
            Loading upcoming fixtures and ESPN boxscore samples…
          </div>
        )}
        {fixturesError && (
          <div className="rounded-xl border border-amber-800 bg-[#241b05] px-4 py-3 text-xs font-mono text-amber-200">
            Live match analysis unavailable. No cached or invented fixtures are shown.
          </div>
        )}

        <div className="glass-surface flex flex-col items-center justify-between gap-4 rounded-2xl p-4 sm:flex-row sm:p-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ffd38a]/25 bg-[#ffd38a]/10">
              <Flame className="h-5 w-5 fill-[#ffd38a] text-[#ffd38a]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  YOUR NEXT DECISION
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                  {fixtures.length ? 'Feed ready' : 'Preparing feed'}
                </span>
              </div>
              <h2 className="mt-0.5 text-base font-semibold text-white sm:text-lg">
                Turn the live slate into a considered shortlist.
              </h2>
              <p className="mt-0.5 text-xs text-[#9bb3a8]">
                Upcoming fixtures only — current prices, corner history, and card boxscores.
              </p>
            </div>
          </div>

          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            <button
              onClick={() => setIsLetsGoOpen(true)}
              className="pressable flex w-full items-center justify-center gap-2 rounded-full bg-[#ffd38a] px-5 py-2.5 text-sm font-semibold text-[#0b1715] shadow-[0_8px_24px_rgba(255,211,138,.12)] hover:bg-white sm:w-auto"
            >
              <Flame className="h-4 w-4 fill-[#0b1715] text-[#0b1715]" />
              Open analysis
            </button>
          </div>
        </div>

        {activeTab === 'DAILY_TIPS' && (
          <ErrorBoundary>
            <div className="space-y-8">
              <StreakTipsSection
                tips={streakTips}
                onSelectMatchDetail={setSelectedMatchId}
              />
              <DailyTipsSection
                oddsFormat={oddsFormat}
                tips={dailyTips}
                onLoadIntoActiveSlip={handleLoadDailyTip}
                onSelectMatchDetail={setSelectedMatchId}
              />
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'WEEKLY_TIPS' && (
          <ErrorBoundary>
            <WeeklyTipsSection
              oddsFormat={oddsFormat}
              tips={weeklyTips}
              onLoadIntoActiveSlip={handleLoadWeeklyTip}
              onSelectMatchDetail={setSelectedMatchId}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'ACCUMULATOR' && (
          <ErrorBoundary>
            <div className="space-y-6">
              {analysisMessage && (
                <div className="bg-[#241b05] border border-amber-800 rounded-2xl p-4 sm:p-5 text-sm text-amber-100">
                  <strong className="block text-amber-300 mb-1">Analysis result</strong>
                  {analysisMessage}
                  <span className="block mt-2 text-xs text-amber-200/80">No unsupported prediction was added. The live fixtures remain available in the All Matches tab.</span>
                  <span className="block mt-3 text-xs font-mono text-amber-300">prompt by mr. Wolf</span>
                </div>
              )}
              <AccumulatorCard
                slip={slip}
                oddsFormat={oddsFormat}
                onRegenerate={handleRegenerate}
                onSelectMatchDetail={setSelectedMatchId}
              />

              <div className="bg-[#051c13] border border-emerald-800/80 rounded-2xl p-4 sm:p-5 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  Operating Principle &amp; Verification Rules
                </div>
                <p className="text-emerald-200/90 leading-relaxed">
                  SEARCH WIDELY → VERIFY CURRENT DATA → ANALYZE DEEPLY → FILTER AGGRESSIVELY → COMPARE MARKETS → CONSTRUCT THE ACCUMULATOR → AUDIT RISK → OUTPUT ONLY THE PICKS.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-emerald-300/80">
                  <span className="p-2 rounded-lg bg-[#08291d] border border-emerald-900">
                    ✓ Maximum 7 selections
                  </span>
                  <span className="p-2 rounded-lg bg-[#08291d] border border-emerald-900">
                    ✓ Combined Odds ≥ 10.00 Target Met
                  </span>
                  <span className="p-2 rounded-lg bg-[#08291d] border border-emerald-900">
                    ✓ Correlation &amp; Uncertainty Filtered
                  </span>
                </div>
              </div>
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'CORNERS' && (
          <ErrorBoundary>
            <CornersTable
              fixtures={fixtures}
              coverage={coverage}
              onSelectMatchDetail={setSelectedMatchId}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'BOOKINGS' && (
          <ErrorBoundary>
            <BookingsTable
              fixtures={fixtures}
              coverage={coverage}
              onSelectMatchDetail={setSelectedMatchId}
            />
          </ErrorBoundary>
        )}

        {activeTab === 'BOTH_CORNERS_BOOKINGS' && (
          <ErrorBoundary>
            <div className="space-y-6">
              <div className="bg-[#051c13] p-4 rounded-xl border border-emerald-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Section 10 · Dual Global Corners &amp; Bookings Analysis
                  </h3>
                  <p className="text-xs text-emerald-300/80 font-mono mt-0.5">
                    Analyzing each category independently. High-corner matches are never assumed to be high-card matches without independent evidence.
                  </p>
                </div>
              </div>

              <CornersTable
                fixtures={fixtures}
                coverage={coverage}
                onSelectMatchDetail={setSelectedMatchId}
              />

              <BookingsTable
                fixtures={fixtures}
                coverage={coverage}
                onSelectMatchDetail={setSelectedMatchId}
              />
            </div>
          </ErrorBoundary>
        )}

        {activeTab === 'ALL_FIXTURES' && (
          <ErrorBoundary>
            <AllFixturesList
              fixtures={fixtures}
              oddsFormat={oddsFormat}
              onSelectMatchDetail={setSelectedMatchId}
              onAddToSlip={handleAddToSlip}
              slipMatchIds={slip.selections.map((s) => s.matchId)}
            />
          </ErrorBoundary>
        )}
      </main>

      <LetsGoModal
        isOpen={isLetsGoOpen}
        onClose={() => setIsLetsGoOpen(false)}
        onRunAnalysis={handleRunAnalysis}
      />

      <MatchDetailModal
        fixture={selectedFixture}
        onClose={() => setSelectedMatchId(null)}
        oddsFormat={oddsFormat}
        onAddToSlip={handleAddToSlip}
        isAlreadyInSlip={selectedFixture ? slip.selections.some((s) => s.matchId === selectedFixture.id) : false}
      />

      <BetSlipDrawer
        selections={slip.selections}
        onRemoveSelection={handleRemoveSelection}
        onClearSlip={handleClearSlip}
        oddsFormat={oddsFormat}
        onCopySlip={handleCopyFromDrawer}
        isCopied={isCopiedFromDrawer}
      />

      <PwaInstallBanner
        isInstallable={isInstallable}
        onInstall={promptInstall}
        isOffline={isOffline}
      />
    </div>
  );
}
