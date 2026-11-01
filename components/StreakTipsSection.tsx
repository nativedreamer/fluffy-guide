import React from 'react';
import { Activity, Flame, ArrowRight } from 'lucide-react';

export interface StreakTipRow {
  id: string;
  matchId?: string;
  timeCAT: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeForm: string;
  awayForm: string;
  streakType: string;
  advantage: string;
  tip: string;
  counterTip?: string;
}

interface StreakTipsSectionProps {
  tips: StreakTipRow[];
  onSelectMatchDetail?: (matchId: string) => void;
}

export const StreakTipsSection: React.FC<StreakTipsSectionProps> = ({
  tips,
  onSelectMatchDetail
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-[#051c13] via-[#0a2f1c] to-[#051c13] p-4 sm:p-5 rounded-2xl border border-amber-700/50 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                One-sided form streaks · CAT today
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono">
                4/5 · 5/5 · WVL · leagues only
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
              Streak radar (00:00–23:59 CAT)
            </h2>
            <p className="text-xs text-emerald-200/80 font-mono mt-0.5">
              League games only — no cups, women, or youth. Form from ESPN last-five marks.
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-emerald-300/90 bg-[#04160e] px-3 py-2 rounded-xl border border-emerald-900 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          {tips.length} tip{tips.length === 1 ? '' : 's'}
        </div>
      </div>

      {tips.length === 0 && (
        <div className="bg-[#241b05] border border-amber-800/80 rounded-2xl p-4 text-sm text-amber-100">
          No remaining today-CAT league fixtures currently show a 4/5 or 5/5 win or loss streak (or WVL).
          <span className="block mt-2 text-xs text-amber-200/80 font-mono">
            Window is kickoff in CAT calendar today. Later UTC Americas kickoffs can fall on the next CAT date.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((row) => (
          <div
            key={row.id}
            className="bg-[#08261b] border border-emerald-700/70 hover:border-amber-500/50 rounded-2xl p-4 space-y-3 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono text-emerald-400/90 flex flex-wrap gap-x-2 gap-y-1">
                  <span className="text-amber-400 font-bold">{row.timeCAT}</span>
                  <span>{row.league}</span>
                </div>
                <button
                  type="button"
                  onClick={() => row.matchId && onSelectMatchDetail?.(row.matchId)}
                  className="text-sm font-bold text-white mt-1 text-left hover:text-amber-300 transition-colors flex items-center gap-1"
                >
                  {row.homeTeam} vs {row.awayTeam}
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-800 text-amber-300 shrink-0">
                {row.advantage}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-[#051c13] rounded-lg border border-emerald-900 p-2">
                <span className="text-emerald-500 block">Home form</span>
                <span className="text-white font-bold tracking-wider">{row.homeForm || '-----'}</span>
              </div>
              <div className="bg-[#051c13] rounded-lg border border-emerald-900 p-2">
                <span className="text-emerald-500 block">Away form</span>
                <span className="text-white font-bold tracking-wider">{row.awayForm || '-----'}</span>
              </div>
            </div>

            <div className="text-xs">
              <span className="font-mono text-amber-400 font-bold">{row.streakType}</span>
              <p className="text-emerald-100/90 mt-1 leading-relaxed">{row.tip}</p>
              {row.counterTip && (
                <p className="mt-2 text-[11px] text-amber-200/90 bg-[#241b05] border border-amber-900/60 rounded-lg p-2 font-mono">
                  {row.counterTip}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
