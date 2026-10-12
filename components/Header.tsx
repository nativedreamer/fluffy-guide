import React from 'react';
import { OddsFormat, SportType } from '../lib/types';
import { 
  Trophy, 
  Download, 
  Sparkles, 
  WifiOff, 
  CheckCircle, 
  Calendar,
  Globe2,
  ShieldCheck,
  Flame
} from 'lucide-react';

interface HeaderProps {
  oddsFormat: OddsFormat;
  onSelectOddsFormat: (fmt: OddsFormat) => void;
  onTriggerLetsGo: () => void;
  onOpenInstallPrompt?: () => void;
  isInstallable: boolean;
  isOffline: boolean;
  selectedSport: SportType;
  onSelectSport: (sport: SportType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  oddsFormat,
  onSelectOddsFormat,
  onTriggerLetsGo,
  onOpenInstallPrompt,
  isInstallable,
  isOffline,
  selectedSport,
  onSelectSport
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-40 bg-[#072418] border-b border-emerald-900/60 shadow-xl backdrop-blur-md">
      {/* Top micro bar for global verification & offline status */}
      <div className="bg-[#051c13] px-3 sm:px-6 py-1 border-b border-emerald-950 flex items-center justify-between text-[11px] font-mono text-emerald-300/80">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            AEE QUANTITATIVE SYSTEM
          </span>
          <span className="hidden md:inline text-emerald-600">|</span>
          <span className="hidden md:flex items-center gap-1 text-slate-300">
            <Globe2 className="w-3 h-3 text-emerald-400" />
            Global Worldwide Coverage
          </span>
          <span className="hidden lg:inline text-emerald-600">|</span>
          <span className="hidden lg:inline text-slate-400">
            Algorithm: 10.00+ Target Odds (Unlimited Evidence-Filtered Selections)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isOffline ? (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40 text-[10px] animate-pulse">
              <WifiOff className="w-3 h-3" /> OFFLINE MODE (Cached Data)
            </span>
          ) : (
            <span className="hidden sm:flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Models Verified
            </span>
          )}
          <span className="flex items-center gap-1 text-slate-300">
            <Calendar className="w-3 h-3 text-emerald-400" />
            {currentDate}
          </span>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 p-0.5 shadow-lg shadow-emerald-950 flex items-center justify-center">
            <div className="w-full h-full bg-[#082b1d] rounded-[10px] flex items-center justify-center border border-amber-400/40">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white font-sans flex items-center gap-1.5">
                AEE FOOTBALL GROUP
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                10+ ODDS
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/70 font-mono tracking-wide">
              Quantitative Match Research · <span className="text-amber-400 font-semibold">prompt by mr. Wolf</span>
            </p>
          </div>
        </div>

        {/* Action controls & LET'S GO primary command */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Odds Format Selector */}
          <div className="flex items-center bg-[#051a11] rounded-lg p-0.5 border border-emerald-800/80 font-mono text-[11px]">
            {(['DECIMAL', 'FRACTIONAL', 'AMERICAN'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => onSelectOddsFormat(fmt)}
                className={`px-2 py-1 rounded transition-colors font-semibold ${
                  oddsFormat === fmt
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                {fmt === 'DECIMAL' ? 'Dec' : fmt === 'FRACTIONAL' ? 'Frac' : 'US'}
              </button>
            ))}
          </div>

          {/* Install PWA Button (if available) */}
          {isInstallable && onOpenInstallPrompt && (
            <button
              onClick={onOpenInstallPrompt}
              className="px-3 py-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Install app to your home screen"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Install PWA</span>
            </button>
          )}

          {/* Primary "LET'S GO" Interactive Activation Button */}
          <button
            onClick={onTriggerLetsGo}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer font-sans"
            title="Start Quantitative Accumulator Selection (Section 1 Workflow)"
          >
            <Flame className="w-4 h-4 text-slate-950 fill-slate-950 animate-pulse" />
            LET'S GO
          </button>
        </div>
      </div>
    </header>
  );
};
