import React, { useState } from 'react';
import { AccumulatorSelection, OddsFormat } from '../lib/types';
import { formatOdds } from '../lib/sportsEngine';
import { 
  Trophy, 
  Trash2, 
  Copy, 
  Check, 
  ChevronUp, 
  ChevronDown, 
  Sparkles,
  DollarSign
} from 'lucide-react';

interface BetSlipDrawerProps {
  selections: AccumulatorSelection[];
  onRemoveSelection: (id: string) => void;
  onClearSlip: () => void;
  oddsFormat: OddsFormat;
  onCopySlip: () => void;
  isCopied: boolean;
}

export const BetSlipDrawer: React.FC<BetSlipDrawerProps> = ({
  selections,
  onRemoveSelection,
  onClearSlip,
  oddsFormat,
  onCopySlip,
  isCopied
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stake, setStake] = useState(20);

  const combinedOdds = +(selections.reduce((acc, curr) => acc * curr.odds, 1.0)).toFixed(2);
  const potentialReturn = +(stake * combinedOdds).toFixed(2);

  if (selections.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 left-0 sm:left-auto sm:right-6 sm:w-80 z-40 font-sans shadow-2xl">
      {/* Drawer Header Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#051c13] hover:bg-[#07251a] border-t sm:border-t-0 sm:border border-emerald-700/80 sm:rounded-t-2xl p-3 flex items-center justify-between transition-colors shadow-lg"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xs font-black text-white">
            Active Slip ({selections.length})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono font-black text-amber-400 text-xs">
            {formatOdds(combinedOdds, oddsFormat)} Odds
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronUp className="w-4 h-4 text-emerald-400" />}
        </div>
      </button>

      {/* Expanded Drawer Content */}
      {isOpen && (
        <div className="bg-[#08261b] border-x sm:border border-emerald-700/80 p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {/* Selections List */}
          <div className="space-y-2">
            {selections.map((sel) => (
              <div
                key={sel.id}
                className="bg-[#051810] p-2.5 rounded-xl border border-emerald-900/80 flex items-start justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-white block text-[11px]">{sel.match}</span>
                  <span className="text-amber-300 font-semibold block text-[11px]">{sel.prediction}</span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">
                    {sel.league} · {formatOdds(sel.odds, oddsFormat)}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveSelection(sel.id)}
                  className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 transition-colors"
                  title="Remove from slip"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Quick stake & return */}
          <div className="bg-[#051c13] p-3 rounded-xl border border-emerald-900 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-[11px] text-emerald-300">
              <span>Stake:</span>
              <input
                type="number"
                value={stake}
                onChange={(e) => setStake(Math.max(1, Number(e.target.value)))}
                className="w-16 bg-[#03130d] border border-emerald-800 rounded px-1.5 py-0.5 text-right text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between font-bold text-white pt-1 border-t border-emerald-900">
              <span>Est. Return:</span>
              <span className="text-amber-400 text-sm">
                ${potentialReturn.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onCopySlip}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {isCopied ? 'Copied' : 'Copy Slip'}
            </button>
            <button
              onClick={onClearSlip}
              className="py-2 px-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-rose-400 text-xs font-semibold border border-emerald-800"
              title="Clear all selections"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
