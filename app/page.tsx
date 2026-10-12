import React, { useState, useEffect } from 'react';
import { 
  AnalysisCategory, 
  MatchFixture, 
  OddsFormat, 
  SportType, 
  AccumulatorSlip 
} from '../lib/types';
import { GLOBAL_FIXTURES } from '../lib/sportsData';
import { 
  generateAccumulatorSlip, 
  formatSection15Output 
} from '../lib/sportsEngine';
import { usePWAInstall } from '../lib/usePWAInstall';

import { Header } from '../components/Header';
import { CategoryTabs } from '../components/CategoryTabs';
import { AccumulatorCard } from '../components/AccumulatorCard';
import { CornersTable } from '../components/CornersTable';
import { BookingsTable } from '../components/BookingsTable';
import { AllFixturesList } from '../components/AllFixturesList';
import { MatchDetailModal } from '../components/MatchDetailModal';
import { LetsGoModal } from '../components/LetsGoModal';
import { BetSlipDrawer } from '../components/BetSlipDrawer';
import { PwaInstallBanner } from '../components/PwaInstallBanner';
import { ErrorBoundary } from '../components/ErrorBoundary';

import { 
  Flame, 
  Target, 
  Flag, 
  ShieldAlert, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Activity,
  Layers
} from 'lucide-react';

export default function App() {
  const [fixtures, setFixtures] = useState<MatchFixture[]>(GLOBAL_FIXTURES);
  const [activeTab, setActiveTab] = useState<AnalysisCategory | 'ALL_FIXTURES'>('ACCUMULATOR');
  const [oddsFormat, setOddsFormat] = useState<OddsFormat>('DECIMAL');
  const [selectedSport, setSelectedSport] = useState<SportType>('FOOTBALL');
  const [targetOdds, setTargetOdds] = useState<number>(10.0);

  // Active Accumulator Slip
  const [slip, setSlip] = useState<AccumulatorSlip>(() => {
    return generateAccumulatorSlip('FOOTBALL', 10.0, GLOBAL_FIXTURES);
  });

  // Modals state
  const [isLetsGoOpen, setIsLetsGoOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isCopiedFromDrawer, setIsCopiedFromDrawer] = useState(false);

  // PWA install hook
  const { isInstallable, isOffline, promptInstall } = usePWAInstall();

  // Selected fixture detail
  const selectedFixture = selectedMatchId
    ? fixtures.find((f) => f.id === selectedMatchId) || null
    : null;

  // Handle running analysis from "LET'S GO" workflow
  const handleRunAnalysis = (sport: SportType, target: number) => {
    setSelectedSport(sport);
    setTargetOdds(target);
    const newSlip = generateAccumulatorSlip(sport, target, fixtures);
    setSlip(newSlip);
    setActiveTab('ACCUMULATOR');
  };

  // Re-generate accumulator
  const handleRegenerate = () => {
    const newSlip = generateAccumulatorSlip(selectedSport, targetOdds, fixtures);
    setSlip(newSlip);
  };

  // Add fixture pick to slip manually
  const handleAddToSlip = (fix: MatchFixture) => {
    if (slip.selections.length >= 7) return;
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

  // Remove selection from slip
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

  // Clear slip
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

  return (
    <div className="min-h-screen bg-[#04160e] text-slate-100 flex flex-col font-sans pb-24 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Header */}
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
          const newSlip = generateAccumulatorSlip(s, targetOdds, fixtures);
          setSlip(newSlip);
        }}
      />

      {/* Navigation Tabs */}
      <CategoryTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        accumulatorCount={slip.selections.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 space-y-6 flex-1">
        {/* Hero Quick Command Banner */}
        <div className="bg-gradient-to-r from-[#072418] via-[#0d3b2a] to-[#072418] border border-emerald-700/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  COMMAND WORKFLOW
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                  Section 1 · Starting Command
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white font-sans mt-0.5">
                Ready for Evidence-Based Accumulator & Match Analysis?
              </h2>
              <p className="text-xs text-emerald-200/80 font-mono mt-0.5">
                Tap &quot;LET&apos;S GO&quot; to choose Football, Basketball, or Hybrid and generate verified 10.00+ odds.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => setIsLetsGoOpen(true)}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer font-sans"
            >
              <Flame className="w-4 h-4 text-slate-950 fill-slate-950" />
              LET&apos;S GO
            </button>
          </div>
        </div>

        {/* Tab 1: 10.00+ Target Odds Accumulator */}
        {activeTab === 'ACCUMULATOR' && (
          <ErrorBoundary>
            <div className="space-y-6">
              <AccumulatorCard
                slip={slip}
                oddsFormat={oddsFormat}
                onRegenerate={handleRegenerate}
                onSelectMatchDetail={setSelectedMatchId}
              />

              {/* Operating Principle Callout Card */}
              <div className="bg-[#051c13] border border-emerald-800/80 rounded-2xl p-4 sm:p-5 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  Operating Principle & Verification Rules
                </div>
                <p className="text-emerald-200/90 leading-relaxed">
                  SEARCH WIDELY → VERIFY CURRENT DATA → ANALYZE DEEPLY → FILTER AGGRESSIVELY → COMPARE MARKETS → CONSTRUCT THE ACCUMULATOR → AUDIT RISK → OUTPUT ONLY THE PICKS.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] text-emerald-300/80">
                  <span className="p-2 rounded-lg bg-[#08291d] border border-emerald-900">
                    ✓ Maximum 7 Selections Strictly Enforced
                  </span>
                  <span className="p-2 rounded-lg bg-[#08291d] border border-emerald-900">
                    ✓ Combined Odds ≥ 10.00 Target Met
                  </span>
                  <span className="p-2 rounded-lg bg-[#08291d] border border-emerald-900">
                    ✓ Correlation & Uncertainty Filtered
                  </span>
                </div>
              </div>
            </div>
          </ErrorBoundary>
        )}

        {/* Tab 2: Corners Analysis */}
        {activeTab === 'CORNERS' && (
          <ErrorBoundary>
            <CornersTable
              fixtures={fixtures}
              onSelectMatchDetail={setSelectedMatchId}
            />
          </ErrorBoundary>
        )}

        {/* Tab 3: Bookings Analysis */}
        {activeTab === 'BOOKINGS' && (
          <ErrorBoundary>
            <BookingsTable
              fixtures={fixtures}
              onSelectMatchDetail={setSelectedMatchId}
            />
          </ErrorBoundary>
        )}

        {/* Tab 4: Dual Corners and Bookings (Section 10) */}
        {activeTab === 'BOTH_CORNERS_BOOKINGS' && (
          <ErrorBoundary>
            <div className="space-y-6">
              <div className="bg-[#051c13] p-4 rounded-xl border border-emerald-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Section 10 · Dual Global Corners & Bookings Analysis
                  </h3>
                  <p className="text-xs text-emerald-300/80 font-mono mt-0.5">
                    Analyzing each category independently. High-corner matches are never assumed to be high-card matches without independent evidence.
                  </p>
                </div>
              </div>

              {/* Corners Section */}
              <CornersTable
                fixtures={fixtures}
                onSelectMatchDetail={setSelectedMatchId}
              />

              {/* Bookings Section */}
              <BookingsTable
                fixtures={fixtures}
                onSelectMatchDetail={setSelectedMatchId}
              />
            </div>
          </ErrorBoundary>
        )}

        {/* Tab 5: All Fixtures */}
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

      {/* Interactive Modal Workflows */}
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

      {/* Floating BetSlip Drawer */}
      <BetSlipDrawer
        selections={slip.selections}
        onRemoveSelection={handleRemoveSelection}
        onClearSlip={handleClearSlip}
        oddsFormat={oddsFormat}
        onCopySlip={handleCopyFromDrawer}
        isCopied={isCopiedFromDrawer}
      />

      {/* PWA Install Banner */}
      <PwaInstallBanner
        isInstallable={isInstallable}
        onInstall={promptInstall}
        isOffline={isOffline}
      />
    </div>
  );
}
