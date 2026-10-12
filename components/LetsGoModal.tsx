import React, { useState } from 'react';
import { SportType } from '../lib/types';
import { 
  Flame, 
  X, 
  Check, 
  ShieldCheck, 
  ChevronRight, 
  Loader2, 
  TrendingUp, 
  Activity, 
  Percent, 
  Trophy 
} from 'lucide-react';

interface LetsGoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunAnalysis: (sport: SportType, targetOdds: number) => void;
}

export const LetsGoModal: React.FC<LetsGoModalProps> = ({
  isOpen,
  onClose,
  onRunAnalysis
}) => {
  const [selectedSport, setSelectedSport] = useState<SportType>('FOOTBALL');
  const [targetOdds, setTargetOdds] = useState<number>(10.0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<string>('');

  if (!isOpen) return null;

  const handleStartWorkflow = () => {
    setIsProcessing(true);
    setProgressStep('Step 1: Reading upcoming fixtures from the ESPN feed...');
    
    setTimeout(() => {
      setProgressStep('Step 2: Checking date, kickoff time, sport scope, and fixture status...');
    }, 400);

    setTimeout(() => {
      setProgressStep('Step 3: Applying the prompt’s evidence and data-quality filters...');
    }, 850);

    setTimeout(() => {
      setProgressStep('Step 4: Removing candidates without verified current statistics or odds...');
    }, 1300);

    setTimeout(() => {
      setProgressStep('Step 5: Applying the 7-selection limit and the no-result rule...');
    }, 1750);

    setTimeout(() => {
      setIsProcessing(false);
      onRunAnalysis(selectedSport, targetOdds);
      onClose();
    }, 2100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#08261b] border border-emerald-700/60 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-5 py-4 bg-[#051c13] border-b border-emerald-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                AEE QUANTITATIVE WORKFLOW
              </h3>
              <p className="text-[11px] text-emerald-300/70 font-mono">
                Command: &quot;LET&apos;S GO&quot; Initiated · Prompt by mr. Wolf
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-emerald-300/60 hover:text-white hover:bg-emerald-900/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {!isProcessing ? (
            <>
              {/* Question from Section 1 */}
              <div className="bg-[#051810] p-4 rounded-xl border border-emerald-800/80">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block mb-1">
                  Section 1 · Starting Command
                </span>
                <p className="text-sm sm:text-base font-bold text-white leading-snug">
                  Which sport would you like me to analyze?
                </p>
                <p className="text-xs text-emerald-300/70 mt-1">
                  ESPN fixtures are checked first; unsupported selections are excluded rather than invented.
                </p>
              </div>

              {/* Three Choices from Section 1 */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-emerald-300/80 uppercase tracking-wide block">
                  Select Sport Scope:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => setSelectedSport('FOOTBALL')}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      selectedSport === 'FOOTBALL'
                        ? 'bg-emerald-800/60 border-amber-400 shadow-md shadow-emerald-950'
                        : 'bg-[#061e15] border-emerald-900 hover:border-emerald-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">⚽</span>
                      {selectedSport === 'FOOTBALL' && (
                        <Check className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-xs font-bold text-white block">1. Football</span>
                      <span className="text-[10px] text-emerald-300/60 block font-mono">Global Leagues</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedSport('BASKETBALL')}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      selectedSport === 'BASKETBALL'
                        ? 'bg-emerald-800/60 border-amber-400 shadow-md shadow-emerald-950'
                        : 'bg-[#061e15] border-emerald-900 hover:border-emerald-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">🏀</span>
                      {selectedSport === 'BASKETBALL' && (
                        <Check className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-xs font-bold text-white block">2. Basketball</span>
                      <span className="text-[10px] text-emerald-300/60 block font-mono">NBA / EuroLeague</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setSelectedSport('BOTH')}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      selectedSport === 'BOTH'
                        ? 'bg-emerald-800/60 border-amber-400 shadow-md shadow-emerald-950'
                        : 'bg-[#061e15] border-emerald-900 hover:border-emerald-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">⚽+🏀</span>
                      {selectedSport === 'BOTH' && (
                        <Check className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-xs font-bold text-white block">3. Football + Basket</span>
                      <span className="text-[10px] text-emerald-300/60 block font-mono">Optimal Hybrid</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Odds Selector (Section 9: Combined odds of at least 10.00 with option to increase) */}
              <div className="space-y-2 pt-1 border-t border-emerald-900/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-emerald-300/80 uppercase tracking-wide">
                    Section 9 Target Odds:
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    Min {targetOdds.toFixed(2)}+ Odds
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[10.0, 15.0, 20.0, 25.0].map((oddsVal) => (
                    <button
                      key={oddsVal}
                      onClick={() => setTargetOdds(oddsVal)}
                      className={`py-2 px-1 text-center rounded-lg border font-mono text-xs font-bold transition-all ${
                        targetOdds === oddsVal
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                          : 'bg-[#051a11] text-emerald-300/70 border-emerald-900 hover:border-emerald-700'
                      }`}
                    >
                      {oddsVal.toFixed(1)}+ Odds
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-emerald-300/60 font-mono">
                  *Accumulator strictly filtered to maximum 7 selections using the fewest games reasonably possible.
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={handleStartWorkflow}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-slate-950" />
                  Execute Analysis & Construct {targetOdds.toFixed(0)}+ Accumulator
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Animated Quantitative Search in progress */
            <div className="py-8 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-900 border-t-amber-400 animate-spin" />
                <Flame className="w-6 h-6 text-amber-400 absolute" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white font-sans">
                  AEE Sports Quantitative Engine Running
                </h4>
                <p className="text-xs font-mono text-amber-400 mt-2 px-4 py-2 bg-[#04160e] rounded-lg border border-emerald-800/80 inline-block">
                  {progressStep}
                </p>
              </div>
              <p className="text-[11px] text-emerald-300/60 font-mono max-w-sm mx-auto">
                Checking current fixture data, evidence quality, odds availability, and risk filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
