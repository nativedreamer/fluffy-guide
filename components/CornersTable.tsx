import React, { useState } from 'react';
import { MatchFixture } from '../lib/types';
import { Flag, ChevronDown, ChevronUp, ShieldCheck, Activity, Info, Sparkles } from 'lucide-react';

interface CornersTableProps {
  fixtures: MatchFixture[];
  onSelectMatchDetail?: (matchId: string) => void;
}

export const CornersTable: React.FC<CornersTableProps> = ({
  fixtures,
  onSelectMatchDetail
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter fixtures that have corner analysis data and sort by confidence score
  const cornerCandidates = fixtures
    .filter((f) => f.corners !== undefined)
    .sort((a, b) => (b.corners?.confidenceScore || 0) - (a.corners?.confidenceScore || 0));

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-[#08261b] border border-emerald-700/70 rounded-2xl shadow-xl overflow-hidden font-sans">
      {/* Section 8 Header Format */}
      <div className="bg-gradient-to-r from-[#051c13] via-[#092e1f] to-[#051c13] px-4 sm:px-6 py-4 border-b border-emerald-800/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/50 flex items-center justify-center">
              <Flag className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest block">
                AEE FOOTBALL GROUP — GLOBAL CORNERS ANALYSIS
              </span>
              <h3 className="text-base sm:text-lg font-black text-white font-sans">
                Over 7.5+ High-Probability Statistical Projections
              </h3>
            </div>
          </div>

          <div className="text-right text-xs font-mono text-emerald-300/80">
            <div>Analysis Date: <strong className="text-white">{currentDate}</strong></div>
            <div className="text-[11px] text-emerald-400/70">Coverage: Global Premier, Continental & Domestic Leagues</div>
          </div>
        </div>
      </div>

      {/* Corners Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-[#061d14] border-b border-emerald-900/80 text-[11px] font-mono uppercase text-emerald-300/80">
              <th className="py-2.5 px-3 sm:px-4 w-12 text-center">Rank</th>
              <th className="py-2.5 px-3 sm:px-4">Match</th>
              <th className="py-2.5 px-3 sm:px-4">Competition</th>
              <th className="py-2.5 px-3 sm:px-4">Total-Corner Projection</th>
              <th className="py-2.5 px-3 sm:px-4 text-center">Historical Over 7.5 Freq</th>
              <th className="py-2.5 px-3 sm:px-4 text-center">Confidence</th>
              <th className="py-2.5 px-3 sm:px-4 text-center">Data Quality</th>
              <th className="py-2.5 px-3 sm:px-4 w-12 text-center">Breakdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-900/40">
            {cornerCandidates.map((fix, idx) => {
              const c = fix.corners!;
              const isExpanded = expandedId === fix.id;
              return (
                <React.Fragment key={fix.id}>
                  <tr
                    onClick={() => onSelectMatchDetail && onSelectMatchDetail(fix.id)}
                    className="hover:bg-[#0b3324] transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 sm:px-4 font-mono font-bold text-center text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Match */}
                    <td className="py-3.5 px-3 sm:px-4">
                      <div className="font-bold text-white text-xs sm:text-sm group-hover:text-amber-300 transition-colors">
                        {fix.homeTeam} vs {fix.awayTeam}
                      </div>
                      <span className="text-[10px] text-emerald-400/70 font-mono">
                        {fix.date} · {fix.kickoffTime}
                      </span>
                    </td>

                    {/* Competition */}
                    <td className="py-3.5 px-3 sm:px-4 font-mono text-xs">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 text-emerald-200">
                        {fix.league}
                      </span>
                    </td>

                    {/* Corner Projection */}
                    <td className="py-3.5 px-3 sm:px-4">
                      <span className="font-black text-teal-300 block text-xs sm:text-sm">
                        {c.totalProjection}
                      </span>
                      <span className="text-[10px] text-emerald-400/80 font-mono">
                        Avg: {c.combinedCornerAvg} corners/game
                      </span>
                    </td>

                    {/* Historical Over 7.5 Freq */}
                    <td className="py-3.5 px-3 sm:px-4 text-center font-mono font-bold text-white text-xs">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
                        {c.historicalOver75Freq}
                      </span>
                    </td>

                    {/* Confidence Score */}
                    <td className="py-3.5 px-3 sm:px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/80 text-emerald-300 font-mono text-xs font-bold">
                        {c.confidenceScore}%
                      </span>
                    </td>

                    {/* Data Quality */}
                    <td className="py-3.5 px-3 sm:px-4 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        c.dataQuality === 'High'
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600/40'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-600/40'
                      }`}>
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        {c.dataQuality}
                      </span>
                    </td>

                    {/* Expand toggle */}
                    <td className="py-3.5 px-3 sm:px-4 text-center">
                      <button
                        onClick={(e) => toggleExpand(fix.id, e)}
                        className="p-1 rounded hover:bg-emerald-800 text-emerald-300"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* Section 8 Detail Breakdown Accordion */}
                  {isExpanded && (
                    <tr className="bg-[#051c13] border-b border-emerald-900">
                      <td colSpan={8} className="p-4 sm:p-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                          {/* Halves Breakdown */}
                          <div className="bg-[#08291d] p-3 rounded-xl border border-emerald-800/80 space-y-1.5">
                            <h4 className="font-bold text-amber-300 text-[11px] uppercase tracking-wider flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5" /> Halves Projections
                            </h4>
                            <p className="text-slate-200">
                              Full Match: <strong className="text-white">{c.totalProjection}</strong>
                            </p>
                            <p className="text-slate-300">
                              First Half: <strong className="text-teal-300">{c.firstHalfProj || 'Data Pending'}</strong>
                            </p>
                            <p className="text-slate-300">
                              Second Half: <strong className="text-teal-300">{c.secondHalfProj || 'Data Pending'}</strong>
                            </p>
                          </div>

                          {/* Home vs Away Corner Metrics */}
                          <div className="bg-[#08291d] p-3 rounded-xl border border-emerald-800/80 space-y-1.5">
                            <h4 className="font-bold text-amber-300 text-[11px] uppercase tracking-wider flex items-center gap-1">
                              <Flag className="w-3.5 h-3.5" /> Home vs Away Splits
                            </h4>
                            <p className="text-slate-300">
                              {fix.homeTeam} (Home): <strong>{c.homeAvgCornersWon} won</strong> / {c.homeAvgCornersConceded} conceded
                            </p>
                            <p className="text-slate-300">
                              {fix.awayTeam} (Away): <strong>{c.awayAvgCornersWon} won</strong> / {c.awayAvgCornersConceded} conceded
                            </p>
                            <p className="text-slate-400 text-[11px]">
                              Historical Sample: {c.sampleMatches} matches analyzed
                            </p>
                          </div>

                          {/* Tactical Factors */}
                          <div className="bg-[#08291d] p-3 rounded-xl border border-emerald-800/80 space-y-1.5">
                            <h4 className="font-bold text-amber-300 text-[11px] uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" /> Tactical Confluence
                            </h4>
                            <p className="text-slate-300 text-[11px] leading-relaxed">
                              {c.tacticalNotes}
                            </p>
                            <div className="flex items-center gap-3 pt-1 text-[10px] text-emerald-400">
                              <span>Width Rating: {c.attackingWidthRating}/10</span>
                              <span>Shot Volume: {c.shotVolumeRating}/10</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer stamp per specification */}
      <div className="bg-[#03130d] px-4 sm:px-6 py-3 border-t border-emerald-950 flex flex-col sm:flex-row items-center justify-between text-xs font-mono">
        <span className="text-emerald-300/80">
          Ranked by evidence strength and historical threshold consistency. No outcome is guaranteed.
        </span>
        <span className="text-amber-400/90 font-bold uppercase tracking-wider mt-1 sm:mt-0">
          AEE FOOTBALL GROUP
        </span>
      </div>
    </div>
  );
};
