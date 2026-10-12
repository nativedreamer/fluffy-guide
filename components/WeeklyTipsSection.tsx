import React, { useState } from 'react';
import { WeeklyTipGroup, OddsFormat } from '../lib/types';
import { CURATED_WEEKLY_TIPS } from '../lib/sportsData';
import { formatOdds } from '../lib/sportsEngine';
import { 
  CalendarDays, 
  Sparkles, 
  Copy, 
  Check, 
  Trophy, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Flame,
  Globe2
} from 'lucide-react';

interface WeeklyTipsSectionProps {
  oddsFormat: OddsFormat;
  onLoadIntoActiveSlip: (tipGroup: WeeklyTipGroup) => void;
  onSelectMatchDetail?: (matchId: string) => void;
}

export const WeeklyTipsSection: React.FC<WeeklyTipsSectionProps> = ({
  oddsFormat,
  onLoadIntoActiveSlip,
  onSelectMatchDetail
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [stake, setStake] = useState<number>(20);

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
            <CalendarDays className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                WEEKLY &amp; WEEKEND ACCUMULATORS
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                Saturday – Sunday Matchdays
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Weekly Mega Slates &amp; Premier League Specials
            </h2>
            <p className="text-xs text-emerald-200/80 font-mono mt-0.5">
              Featuring accurate upcoming blockbuster fixtures: Liverpool v Chelsea, Bournemouth v Arsenal, Spurs v West Ham.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-300/80 bg-[#04160e] px-3.5 py-2 rounded-xl border border-emerald-900">
          <Globe2 className="w-4 h-4 text-emerald-400" />
          <span>Top 5 Leagues + NBA Opening Slate</span>
        </div>
      </div>

      {/* Grid of Weekly Mega Slips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {CURATED_WEEKLY_TIPS.map((tip) => {
          const estPayout = +(stake * tip.combinedOdds).toFixed(2);
          const isCopied = copiedId === tip.id;

          return (
            <div
              key={tip.id}
              className="bg-[#08261b] border border-emerald-700/80 hover:border-amber-500/60 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between transition-all space-y-4"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-amber-400 font-bold">
                    {tip.badge}
                  </span>
                  <span className="text-xs font-mono text-emerald-300/80 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    {tip.confidenceScore}% Model Confidence
                  </span>
                </div>

                <h3 className="text-lg font-black text-white">{tip.title}</h3>
                <p className="text-xs text-emerald-200/80 font-mono mt-0.5">{tip.subtitle}</p>

                {/* Combined Odds Summary */}
                <div className="mt-3 bg-[#051c13] p-3.5 rounded-xl border border-emerald-900 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-[10px] text-emerald-400 block uppercase">Combined Target Odds</span>
                    <span className="text-2xl font-black text-amber-400">
                      {formatOdds(tip.combinedOdds, oddsFormat)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 block uppercase">Schedule Coverage</span>
                    <span className="text-xs font-bold text-white bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 inline-block">
                      {tip.daysCovered}
                    </span>
                  </div>
                </div>

                {/* Selections List */}
                <div className="mt-4 space-y-2">
                  {tip.selections.map((sel, idx) => (
                    <div
                      key={sel.id}
                      onClick={() => onSelectMatchDetail && onSelectMatchDetail(sel.matchId)}
                      className="bg-[#051810] p-3 rounded-xl border border-emerald-900/80 hover:border-emerald-700 transition-colors cursor-pointer group flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 font-mono text-xs font-bold flex items-center justify-center border border-emerald-800">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {sel.match}
                          </div>
                          <span className="text-[11px] text-amber-300/90 font-mono">
                            {sel.prediction}
                          </span>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs shrink-0">
                        <span className="font-bold text-amber-400 block">
                          {formatOdds(sel.odds, oddsFormat)}
                        </span>
                        <span className="text-[10px] text-emerald-400/80">
                          {sel.league}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quantitative Rationale */}
                <p className="mt-4 text-xs text-emerald-300/80 font-mono leading-relaxed bg-[#051910] p-3 rounded-xl border border-emerald-950">
                  📋 <strong>Model Strategy:</strong> {tip.rationale}
                </p>
              </div>

              {/* Bottom Card Actions */}
              <div className="space-y-3 pt-3 border-t border-emerald-900/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400/80">Est. Payout ($20 Stake):</span>
                  <span className="font-black text-amber-400 text-base">
                    ${estPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadIntoActiveSlip(tip)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <Trophy className="w-4 h-4 text-slate-950" />
                    Load 6-Pick Mega Slip ({formatOdds(tip.combinedOdds, oddsFormat)})
                  </button>

                  <button
                    onClick={() => handleCopyCode(tip.id, tip.bookingCode)}
                    className="py-2.5 px-3.5 rounded-xl bg-[#051c13] hover:bg-[#072418] border border-emerald-800 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                    title="Copy Booking Code"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-amber-400" /> : <Copy className="w-4 h-4" />}
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
