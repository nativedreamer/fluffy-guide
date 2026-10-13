import React from 'react';
import { MatchFixture } from '../lib/types';
import { Flag, Info } from 'lucide-react';

interface CornersTableProps {
  fixtures: MatchFixture[];
  onSelectMatchDetail?: (matchId: string) => void;
  coverage?: string;
}

export const CornersTable: React.FC<CornersTableProps> = ({ fixtures, onSelectMatchDetail, coverage }) => {
  const football = fixtures.filter((fixture) => fixture.sport === 'Football' && fixture.status === 'UPCOMING');
  const ranked = football
    .filter((fixture) => fixture.corners && fixture.corners.dataQuality !== 'Low')
    .sort((a, b) => (b.corners?.confidenceScore || 0) - (a.corners?.confidenceScore || 0))
    .slice(0, 20);
  const excluded = football.length - ranked.length;
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-[#08261b] border border-emerald-700/70 rounded-2xl shadow-xl overflow-hidden font-sans">
      <div className="bg-gradient-to-r from-[#051c13] via-[#092e1f] to-[#051c13] px-4 sm:px-6 py-4 border-b border-emerald-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/50 flex items-center justify-center"><Flag className="w-5 h-5 text-teal-400" /></div>
          <div>
            <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">AEE FOOTBALL GROUP — GLOBAL CORNERS ANALYSIS</span>
            <h3 className="text-base sm:text-lg font-black text-white">Corner projections from ESPN boxscores</h3>
          </div>
        </div>
        <div className="text-right text-xs font-mono text-emerald-300/80">
          <div>Analysis Date: <strong className="text-white">{currentDate}</strong></div>
          <div className="text-[11px] text-emerald-400/70 max-w-xs">Coverage: {coverage || 'ESPN competitions with verified samples'}</div>
        </div>
      </div>
      <div className="flex gap-2 items-start px-4 sm:px-6 py-3 bg-amber-950/30 border-b border-amber-900/60 text-xs text-amber-200">
        <Info className="w-4 h-4 shrink-0 text-amber-400" />
        <span>
          Totals use corners won by both teams in recent ESPN boxscores. First-half and second-half corner splits are marked Data unavailable because ESPN key events do not list corners. {excluded} fixture{excluded === 1 ? '' : 's'} excluded for a short or unsupported sample.
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead><tr className="bg-[#061d14] border-b border-emerald-900/80 text-[11px] font-mono uppercase text-emerald-300/80">
            <th className="py-2.5 px-3 sm:px-4">#</th>
            <th className="py-2.5 px-3 sm:px-4">Match</th>
            <th className="py-2.5 px-3 sm:px-4">Competition</th>
            <th className="py-2.5 px-3 sm:px-4">Full match</th>
            <th className="py-2.5 px-3 sm:px-4">Over 7.5 history</th>
            <th className="py-2.5 px-3 sm:px-4">1H / 2H</th>
            <th className="py-2.5 px-3 sm:px-4">Home / Away splits</th>
            <th className="py-2.5 px-3 sm:px-4">Sample</th>
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
                <td className="py-3 px-3 sm:px-4 text-amber-300 font-semibold">{fixture.corners?.totalProjection}</td>
                <td className="py-3 px-3 sm:px-4 text-slate-200">{fixture.corners?.historicalOver75Freq}</td>
                <td className="py-3 px-3 sm:px-4 text-slate-400">Data unavailable</td>
                <td className="py-3 px-3 sm:px-4 text-slate-300">
                  {fixture.corners?.homeAvgCornersWon}/{fixture.corners?.homeAvgCornersConceded} · {fixture.corners?.awayAvgCornersWon}/{fixture.corners?.awayAvgCornersConceded}
                </td>
                <td className="py-3 px-3 sm:px-4 text-slate-300">{fixture.corners?.sampleMatches} boxscores</td>
                <td className="py-3 px-3 sm:px-4 text-emerald-300">{fixture.corners?.dataQuality}</td>
                <td className="py-3 px-3 sm:px-4 text-amber-300 font-mono">{fixture.corners?.confidenceScore}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ranked.length === 0 && <div className="p-6 text-center text-sm text-emerald-300">No upcoming match has enough verified corner boxscores to project Over 7.5 or higher.</div>}
      <div className="bg-[#03130d] px-4 sm:px-6 py-3 border-t border-emerald-950 flex justify-between text-xs font-mono">
        <span className="text-emerald-300/80">Historical frequency is the sample rate, not a guaranteed probability.</span>
        <span className="text-amber-400/90 font-bold">AEE FOOTBALL GROUP</span>
      </div>
    </div>
  );
};
