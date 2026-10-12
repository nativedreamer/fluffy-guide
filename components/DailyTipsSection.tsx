import React, { useState } from 'react';
import { DailyTipGroup, OddsFormat, MatchFixture } from '../lib/types';
import { CURATED_DAILY_TIPS } from '../lib/sportsData';
import { formatOdds } from '../lib/sportsEngine';
import { 
  Calendar, 
  Sparkles, 
  Copy, 
  Check, 
  Trophy, 
  ShieldCheck, 
  Activity, 
  DollarSign, 
  Flame,
  ArrowRight
} from 'lucide-react';

interface DailyTipsSectionProps {
  oddsFormat: OddsFormat;
  onLoadIntoActiveSlip: (tipGroup: DailyTipGroup) => void;
  onSelectMatchDetail?: (matchId: string) => void;
}

export const DailyTipsSection: React.FC<DailyTipsSectionProps> = ({
  oddsFormat,
  onLoadIntoActiveSlip,
  onSelectMatchDetail
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stakeMap, setStakeMap] = useState<Record<string, number>>({
    'daily-banker-1': 20,
    'daily-treble-2': 20,
    'daily-acca-3': 20
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 3000);
    });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Editorial Header */}
      <div className="bg-gradient-to-r from-[#051c13] via-[#092e1f] to-[#051c13] p-5 rounded-2xl border border-emerald-700/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                VERIFIED DAILY SLATES
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                {currentDate}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Today&apos;s Quantitative Daily Tips &amp; Bankers
            </h2>
            <p className="text-xs text-emerald-200/80 font-mono mt-0.5">
              Live &amp; upcoming fixtures strictly evaluated for statistical probability and zero high-uncertainty risks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-300/80 bg-[#04160e] px-3.5 py-2 rounded-xl border border-emerald-900">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Odds Movement &amp; Starting Lineups Verified</span>
        </div>
      </div>

      {/* Grid of 3 Daily Tip Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {CURATED_DAILY_TIPS.map((tip) => {
          const stake = stakeMap[tip.id] || 20;
          const estPayout = +(stake * tip.combinedOdds).toFixed(2);
          const isCopied = copiedId === tip.id;

          return (
            <div
              key={tip.id}
              className="bg-[#08261b] border border-emerald-700/80 hover:border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col justify-between transition-all space-y-4"
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-amber-400 font-bold">
                    {tip.badge}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-300/80 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {tip.confidenceScore}% Confidence
                  </span>
                </div>

                <h3 className="text-base font-black text-white">{tip.title}</h3>
                <p className="text-xs text-emerald-200/80 font-mono mt-0.5">{tip.subtitle}</p>

                {/* Combined Odds Callout */}
                <div className="mt-3 bg-[#051c13] p-3 rounded-xl border border-emerald-900 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-emerald-400 block uppercase">Combined Odds</span>
                    <span className="text-xl font-black text-amber-400">
                      {formatOdds(tip.combinedOdds, oddsFormat)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 block uppercase">Selections</span>
                    <span className="text-sm font-bold text-white">
                      {tip.selections.length} Picks
                    </span>
                  </div>
                </div>

                {/* Matches in this tip */}
                <div className="mt-4 space-y-2.5">
                  {tip.selections.map((sel) => (
                    <div
                      key={sel.id}
                      onClick={() => onSelectMatchDetail && onSelectMatchDetail(sel.matchId)}
                      className="bg-[#051810] p-2.5 rounded-xl border border-emerald-900/80 hover:border-emerald-700 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400/80 mb-0.5">
                        <span>{sel.league}</span>
                        <span className="font-bold text-amber-400">{formatOdds(sel.odds, oddsFormat)}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                        <span>{sel.match}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h4>
                      <span className="text-[11px] text-amber-300/90 font-semibold block mt-0.5">
                        Pick: {sel.prediction}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Rationale */}
                <p className="mt-3 text-[11px] text-emerald-300/70 font-mono leading-relaxed bg-[#051910] p-2.5 rounded-lg border border-emerald-950">
                  💡 <strong>Analysis:</strong> {tip.rationale}
                </p>
              </div>

              {/* Bottom Actions & Payout */}
              <div className="space-y-3 pt-3 border-t border-emerald-900/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400/80">Est. Return (${stake} Stake):</span>
                  <span className="font-black text-amber-400 text-sm">
                    ${estPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadIntoActiveSlip(tip)}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Trophy className="w-3.5 h-3.5 text-slate-950" />
                    Load Into Slip
                  </button>

                  <button
                    onClick={() => handleCopyCode(tip.id, tip.bookingCode)}
                    className="py-2 px-3 rounded-xl bg-[#051c13] hover:bg-[#072418] border border-emerald-800 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1 transition-colors"
                    title="Copy Booking Code"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied' : tip.bookingCode.slice(-4)}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
