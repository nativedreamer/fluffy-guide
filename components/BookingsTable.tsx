import React from 'react';
import { MatchFixture } from '../lib/types';
import { ShieldAlert, Info } from 'lucide-react';

interface BookingsTableProps {
  fixtures: MatchFixture[];
  onSelectMatchDetail?: (matchId: string) => void;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({ fixtures, onSelectMatchDetail }) => {
  const candidates = fixtures.filter((fixture) => fixture.status === 'UPCOMING' && fixture.sport === 'Football');
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-[#08261b] border border-emerald-700/70 rounded-2xl shadow-xl overflow-hidden font-sans">
      <div className="bg-gradient-to-r from-[#051c13] via-[#092e1f] to-[#051c13] px-4 sm:px-6 py-4 border-b border-emerald-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-amber-400" /></div>
          <div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">MR. WOLF — GLOBAL BOOKINGS ANALYSIS</span>
            <h3 className="text-base sm:text-lg font-black text-white">Upcoming fixture disciplinary research</h3>
          </div>
        </div>
        <div className="text-right text-xs font-mono text-emerald-300/80">
          <div>Analysis Date: <strong className="text-white">{currentDate}</strong></div>
          <div className="text-[11px] text-emerald-400/70">Coverage: ESPN upcoming football feed</div>
        </div>
      </div>
      <div className="flex gap-2 items-start px-4 sm:px-6 py-3 bg-amber-950/30 border-b border-amber-900/60 text-xs text-amber-200">
        <Info className="w-4 h-4 shrink-0 text-amber-400" />
        <span>ESPN does not currently expose the prompt-required team card samples, foul splits, or verified referee appointments for these fixtures. No card projection is invented.</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead><tr className="bg-[#061d14] border-b border-emerald-900/80 text-[11px] font-mono uppercase text-emerald-300/80">
            <th className="py-2.5 px-3 sm:px-4">#</th><th className="py-2.5 px-3 sm:px-4">Match</th><th className="py-2.5 px-3 sm:px-4">Competition</th><th className="py-2.5 px-3 sm:px-4">Full match</th><th className="py-2.5 px-3 sm:px-4">1H / 2H</th><th className="py-2.5 px-3 sm:px-4">Referee</th><th className="py-2.5 px-3 sm:px-4">Team stats</th><th className="py-2.5 px-3 sm:px-4">Quality</th>
          </tr></thead>
          <tbody className="divide-y divide-emerald-900/40">
            {candidates.map((fixture, index) => <tr key={fixture.id} onClick={() => onSelectMatchDetail?.(fixture.id)} className="hover:bg-[#0b3324] transition-colors cursor-pointer">
              <td className="py-3 px-3 sm:px-4 font-mono text-slate-400">{index + 1}</td>
              <td className="py-3 px-3 sm:px-4"><strong className="text-white block">{fixture.homeTeam} vs {fixture.awayTeam}</strong><span className="text-[10px] text-emerald-400/70 font-mono">{fixture.date} · {fixture.kickoffTime}</span></td>
              <td className="py-3 px-3 sm:px-4 text-emerald-200">{fixture.league}</td>
              <td className="py-3 px-3 sm:px-4 text-amber-300">Data unavailable</td>
              <td className="py-3 px-3 sm:px-4 text-slate-300">Data unavailable</td>
              <td className="py-3 px-3 sm:px-4 text-slate-300">Not confirmed</td>
              <td className="py-3 px-3 sm:px-4 text-slate-300">Data unavailable</td>
              <td className="py-3 px-3 sm:px-4 text-amber-300">Low — exclude</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      {candidates.length === 0 && <div className="p-6 text-center text-sm text-emerald-300">No upcoming ESPN football fixtures are available for bookings analysis.</div>}
      <div className="bg-[#03130d] px-4 sm:px-6 py-3 border-t border-emerald-950 flex justify-between text-xs font-mono"><span className="text-emerald-300/80">Unsupported card projections are excluded.</span><span className="text-amber-400/90 font-bold">AEE FOOTBALL GROUP · prompt by mr. Wolf</span></div>
    </div>
  );
};
