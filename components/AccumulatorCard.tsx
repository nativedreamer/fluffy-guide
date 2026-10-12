import React, { useState } from 'react';
import { AccumulatorSlip, OddsFormat } from '../lib/types';
import { formatOdds, formatSection15Output } from '../lib/sportsEngine';
import { 
  Copy, 
  Check, 
  Printer, 
  RotateCw, 
  ShieldCheck, 
  DollarSign, 
  Sparkles, 
  AlertCircle, 
  Trophy,
  Share2,
  Share,
  Flame,
  ArrowUpRight
} from 'lucide-react';

interface AccumulatorCardProps {
  slip: AccumulatorSlip;
  oddsFormat: OddsFormat;
  onRegenerate: () => void;
  onSelectMatchDetail?: (matchId: string) => void;
}

export const AccumulatorCard: React.FC<AccumulatorCardProps> = ({
  slip,
  oddsFormat,
  onRegenerate,
  onSelectMatchDetail
}) => {
  const [stake, setStake] = useState<number>(20);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  const potentialReturn = +(stake * slip.combinedOdds).toFixed(2);
  const profit = +(potentialReturn - stake).toFixed(2);

  const handleCopySlip = () => {
    const text = formatSection15Output(slip);
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setShowToast(true);
      setTimeout(() => {
        setIsCopied(false);
        setShowToast(false);
      }, 3500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-[#08261b] border border-emerald-700/70 rounded-2xl shadow-xl overflow-hidden font-sans">
      {/* Top Banner: Sports Brand Header */}
      <div className="bg-gradient-to-r from-[#051c13] via-[#092e1f] to-[#051c13] px-4 sm:px-6 py-4 border-b border-emerald-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                AEE FOOTBALL GROUP
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                Booking Code: {slip.bookingCode}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white font-sans flex items-center gap-2">
              10.00+ Target Odds Accumulator
            </h2>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySlip}
            className="px-3 py-1.5 rounded-lg bg-emerald-800/70 hover:bg-emerald-700 border border-emerald-600/60 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Copy exact Section 15 formatted text to clipboard"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied!' : 'Copy Section 15'}</span>
          </button>

          <button
            onClick={onRegenerate}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Re-run quantitative algorithm to generate new combination"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Re-Audit</span>
          </button>
        </div>
      </div>

      {/* Copy notification toast */}
      {showToast && (
        <div className="bg-emerald-950 border-b border-emerald-700 px-4 py-2 flex items-center justify-between text-xs text-emerald-300 font-mono animate-in fade-in">
          <span className="flex items-center gap-1.5">
            <Check className="w-4 h-4 text-amber-400" />
            Slip formatted strictly per Section 15 copied to clipboard with &quot;prompt by mr. Wolf&quot;!
          </span>
          <button onClick={() => setShowToast(false)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Accumulator Metadata Summary Bar */}
      <div className="bg-[#051910] px-4 sm:px-6 py-3 border-b border-emerald-900/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div>
          <span className="text-[10px] text-emerald-400/80 block uppercase">Sport Scope</span>
          <span className="font-bold text-white text-sm">
            {slip.sport === 'FOOTBALL' ? 'Football' : slip.sport === 'BASKETBALL' ? 'Basketball' : 'Football + Basketball'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-emerald-400/80 block uppercase">Verified Date</span>
          <span className="font-bold text-white text-sm">{slip.createdAt}</span>
        </div>

        <div>
          <span className="text-[10px] text-emerald-400/80 block uppercase">Selection Count</span>
          <span className="font-bold text-white text-sm flex items-center gap-1">
            {slip.totalSelections} Selections
            <span className="text-[10px] text-emerald-400">(Evidence-filtered)</span>
          </span>
        </div>

        <div>
          <span className="text-[10px] text-emerald-400/80 block uppercase">Combined Odds</span>
          <span className="font-black text-amber-400 text-base sm:text-lg flex items-center gap-1">
            {formatOdds(slip.combinedOdds, oddsFormat)}
            <span className="text-[10px] px-1 py-0.5 rounded bg-amber-400/20 text-amber-300 font-normal">
              {slip.combinedOdds >= 10.0 ? '≥ 10.00 Target Met' : 'Under 10.00'}
            </span>
          </span>
        </div>
      </div>

      {/* Main Section 15 Table Representation */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-[#061d14] border-b border-emerald-900/80 text-[11px] font-mono uppercase text-emerald-300/80">
              <th className="py-2.5 px-3 sm:px-4 w-12 text-center">#</th>
              <th className="py-2.5 px-3 sm:px-4">Match</th>
              <th className="py-2.5 px-3 sm:px-4">League</th>
              <th className="py-2.5 px-3 sm:px-4">Prediction</th>
              <th className="py-2.5 px-3 sm:px-4 text-center">Confidence</th>
              <th className="py-2.5 px-3 sm:px-4 text-right">Odds</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-900/40">
            {slip.selections.map((sel, idx) => (
              <tr 
                key={sel.id}
                onClick={() => onSelectMatchDetail && onSelectMatchDetail(sel.matchId)}
                className="hover:bg-[#0b3324] transition-colors cursor-pointer group"
              >
                {/* Index */}
                <td className="py-3 px-3 sm:px-4 font-mono font-bold text-slate-400 text-center text-xs">
                  {idx + 1}
                </td>

                {/* Match */}
                <td className="py-3 px-3 sm:px-4">
                  <div className="font-bold text-white text-xs sm:text-sm group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                    {sel.match}
                    <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-[11px] text-emerald-300/60 font-mono">
                    {sel.sport} · {sel.date}
                  </span>
                </td>

                {/* League */}
                <td className="py-3 px-3 sm:px-4 font-mono text-xs text-emerald-200/80">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/60">
                    {sel.league}
                  </span>
                </td>

                {/* Prediction */}
                <td className="py-3 px-3 sm:px-4">
                  <span className="font-bold text-amber-300 block text-xs sm:text-sm">
                    {sel.prediction}
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    Market: {sel.market}
                  </span>
                </td>

                {/* Confidence Score (Prompt requirement: "always add a confidence score too") */}
                <td className="py-3 px-3 sm:px-4 text-center">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 font-mono text-xs font-bold text-emerald-300">
                    <span>{sel.confidenceScore}%</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </td>

                {/* Odds */}
                <td className="py-3 px-3 sm:px-4 text-right font-mono font-bold text-sm sm:text-base text-amber-400">
                  {formatOdds(sel.odds, oddsFormat)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stake Calculator & Financial Modeling */}
      <div className="bg-[#051c13] px-4 sm:px-6 py-4 border-t border-emerald-900/80 flex flex-wrap items-center justify-between gap-4">
        {/* Stake adjuster */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <span>Simulated Stake:</span>
          </div>
          <div className="flex items-center gap-1 bg-[#03130d] p-1 rounded-xl border border-emerald-800/80">
            {[10, 20, 50, 100].map((val) => (
              <button
                key={val}
                onClick={() => setStake(val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  stake === val
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        {/* Potential Return Display */}
        <div className="flex items-center gap-4 text-right font-mono">
          <div>
            <span className="text-[10px] text-emerald-400/70 block uppercase">Est. Payout</span>
            <span className="text-base sm:text-lg font-black text-amber-400">
              ${potentialReturn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="pl-3 border-l border-emerald-900">
            <span className="text-[10px] text-emerald-400/70 block uppercase">Net Profit</span>
            <span className="text-base sm:text-lg font-black text-emerald-400">
              +${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Mandatory Risk Note & Author Stamp per Section 15 & 21 */}
      <div className="bg-[#03130d] px-4 sm:px-6 py-3 border-t border-emerald-950 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
        <p className="text-emerald-300/80 flex items-center gap-1.5 text-center sm:text-left">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span><strong>Risk Note:</strong> {slip.riskNote}</span>
        </p>
        <div className="text-amber-400/90 font-bold tracking-wider text-center sm:text-right uppercase">
          AEE FOOTBALL GROUP · prompt by mr. Wolf
        </div>
      </div>
    </div>
  );
};
