import React from 'react';
import { MatchFixture } from '../lib/types';
import { ShieldAlert, Info } from 'lucide-react';

interface BookingsTableProps {
  fixtures: MatchFixture[];
  onSelectMatchDetail?: (matchId: string) => void;
  coverage?: string;
}

export const BookingsTable: React.FC<BookingsTableProps> = ({ fixtures, onSelectMatchDetail, coverage }) => {
  const football = fixtures.filter((fixture) => fixture.status === 'UPCOMING' && fixture.sport === 'Football');
  const ranked = football
    .filter((fixture) => fixture.bookings && fixture.bookings.dataQuality !== 'Low')
    .sort((a, b) => (b.bookings?.confidenceScore || 0) - (a.bookings?.confidenceScore || 0))
    .slice(0, 20);
  const excluded = football.length - ranked.length;
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-[#08261b] border border-emerald-700/70 rounded-2xl shadow-xl overflow-hidden font-sans">
      <div className="bg-gradient-to-r from-[#051c13] via-[#092e1f] to-[#051c13] px-4 sm:px-6 py-4 border-b border-emerald-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center"><ShieldAlert className="w-5 h-5 text-amber-400" /></div>
          <div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">MR. WOLF — GLOBAL BOOKINGS ANALYSIS</span>
            <h3 className="text-base sm:text-lg font-black text-white">Card projections from ESPN boxscores</h3>
          </div>
        </div>
        <div className="text-right text-xs font-mono text-emerald-300/80">
          <div>Analysis Date: <strong className="text-white">{currentDate}</strong></div>
          <div className="text-[11px] text-emerald-400/70 max-w-xs">Coverage: {coverage || 'ESPN football competitions with verified samples'}</div>
        </div>
      </div>
      <div className="flex gap-2 items-start px-4 sm:px-6 py-3 bg-amber-950/30 border-b border-amber-900/60 text-xs text-amber-200">
        <Info className="w-4 h-4 shrink-0 text-amber-400" />
        <span>
          Total cards means yellow cards plus red cards, not booking points. A referee average is shown only after at least five sampled matches with that official. {excluded} fixture{excluded === 1 ? '' : 's'} excluded.
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead><tr className="bg-[#061d14] border-b border-emerald-900/80 text-[11px] font-mono uppercase text-emerald-300/80">
            <th className="py-2.5 px-3 sm:px-4">#</th>
            <th className="py-2.5 px-3 sm:px-4">Match</th>
            <th className="py-2.5 px-3 sm:px-4">Competition</th>
            <th className="py-2.5 px-3 sm:px-4">Full match</th>
            <th className="py-2.5 px-3 sm:px-4">History</th>
            <th className="py-2.5 px-3 sm:px-4">1H / 2H</th>
            <th className="py-2.5 px-3 sm:px-4">Referee</th>
            <th className="py-2.5 px-3 sm:px-4">Team cards / fouls</th>
            <th className="py-2.5 px-3 sm:px-4">Quality</th>
            <th className="py-2.5 px-3 sm:px-4">Confidence</th>
          </tr></thead>
          <tbody className="divide-y divide-emerald-900/40">
            {ranked.map((fixture, index) => (
              <tr key={fixture.id} onClick={() => onSelectMatchDetail?.(fixture.id)} className="hover:bg-[#0b3324] transition-colors cursor-pointer">
                <td className="py-3 px-3 sm:px-4 font-mono text-slate-400">{index + 1}</td>
                <td className="py-3 px-3 sm:px-4">
                  <strong className="text-white block">{fixture.homeTeam} vs {fixture.awayTeam}</strong>
                  <span className="text-[10px] text-emerald-400/70 font-mono">{fixture.date} · {fixture.kickoffTime}</span>
                </td>
                <td className="py-3 px-3 sm:px-4 text-emerald-200">{fixture.league}</td>
                <td className="py-3 px-3 sm:px-4 text-amber-300 font-semibold">{fixture.bookings?.totalCardProjection}</td>
                <td className="py-3 px-3 sm:px-4 text-slate-200">{fixture.bookings?.historicalThresholdFreq}</td>
                <td className="py-3 px-3 sm:px-4 text-slate-300">
                  {fixture.bookings?.firstHalfCardProj || 'Data unavailable'} / {fixture.bookings?.secondHalfCardProj || 'Data unavailable'}
                </td>
                <td className="py-3 px-3 sm:px-4 text-slate-300">
                  {fixture.bookings?.referee
                    ? `${fixture.bookings.referee.name} · ${fixture.bookings.referee.totalCardsPerMatch}/match`
                    : 'Not confirmed'}
                </td>
                <td className="py-3 px-3 sm:px-4 text-slate-300">
                  {fixture.bookings?.homeAvgCards}/{fixture.bookings?.homeAvgFouls} · {fixture.bookings?.awayAvgCards}/{fixture.bookings?.awayAvgFouls}
                </td>
                <td className="py-3 px-3 sm:px-4 text-emerald-300">{fixture.bookings?.dataQuality}</td>
                <td className="py-3 px-3 sm:px-4 text-amber-300 font-mono">{fixture.bookings?.confidenceScore}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ranked.length === 0 && <div className="p-6 text-center text-sm text-emerald-300">No upcoming match has enough verified card boxscores for a total-card projection.</div>}
      <div className="bg-[#03130d] px-4 sm:px-6 py-3 border-t border-emerald-950 flex justify-between gap-3 text-xs font-mono">
        <span className="text-emerald-300/80">A referee average is not a prediction for the next match.</span>
        <span className="text-amber-400/90 font-bold shrink-0">AEE FOOTBALL GROUP · prompt by mr. Wolf</span>
      </div>
    </div>
  );
};
