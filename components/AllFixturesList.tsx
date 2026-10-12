import React, { useState, useMemo } from 'react';
import { MatchFixture, OddsFormat, SportType } from '../lib/types';
import { formatOdds } from '../lib/sportsEngine';
import { Search, Filter, Plus, CheckCircle, ArrowRight, Flag, ShieldAlert } from 'lucide-react';

interface AllFixturesListProps {
  fixtures: MatchFixture[];
  oddsFormat: OddsFormat;
  onSelectMatchDetail: (matchId: string) => void;
  onAddToSlip: (fixture: MatchFixture) => void;
  slipMatchIds: string[];
}

export const AllFixturesList: React.FC<AllFixturesListProps> = ({
  fixtures,
  oddsFormat,
  onSelectMatchDetail,
  onAddToSlip,
  slipMatchIds
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState<'ALL' | 'Football' | 'Basketball'>('ALL');
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState<string>('ALL');

  // Unique leagues
  const leagues = useMemo(() => {
    const list = Array.from(new Set(fixtures.map(f => f.league)));
    return ['ALL', ...list];
  }, [fixtures]);

  // Filtered list
  const filtered = useMemo(() => {
    return fixtures.filter(f => {
      if (selectedSportFilter !== 'ALL' && f.sport !== selectedSportFilter) return false;
      if (selectedLeagueFilter !== 'ALL' && f.league !== selectedLeagueFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${f.homeTeam} ${f.awayTeam} ${f.league} ${f.country}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [fixtures, selectedSportFilter, selectedLeagueFilter, searchQuery]);

  return (
    <div className="bg-[#08261b] border border-emerald-700/70 rounded-2xl shadow-xl overflow-hidden font-sans space-y-4 p-4 sm:p-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-emerald-400/80 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams, leagues (e.g. Arsenal, Real Madrid, NBA, Al Ahly)..."
            className="w-full bg-[#051c13] border border-emerald-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-emerald-400/50 focus:outline-none focus:border-amber-400 font-sans transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar font-mono text-xs">
          {/* Sport filter */}
          <div className="flex items-center bg-[#051c13] rounded-xl p-0.5 border border-emerald-800">
            {(['ALL', 'Football', 'Basketball'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSelectedSportFilter(s)}
                className={`px-2.5 py-1.5 rounded-lg transition-colors font-semibold ${
                  selectedSportFilter === s
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-300/70 hover:text-white'
                }`}
              >
                {s === 'ALL' ? 'All Sports' : s}
              </button>
            ))}
          </div>

          {/* League dropdown */}
          <select
            value={selectedLeagueFilter}
            onChange={(e) => setSelectedLeagueFilter(e.target.value)}
            className="bg-[#051c13] text-emerald-200 border border-emerald-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400 font-mono"
          >
            {leagues.map(l => (
              <option key={l} value={l} className="bg-[#051c13] text-white">
                {l === 'ALL' ? 'All Leagues' : l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Fixtures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(fix => {
          const inSlip = slipMatchIds.includes(fix.id);
          return (
            <div
              key={fix.id}
              onClick={() => onSelectMatchDetail(fix.id)}
              className="bg-[#051c13] border border-emerald-900/90 hover:border-emerald-700/80 rounded-xl p-3.5 sm:p-4 transition-all hover:bg-[#072418] cursor-pointer group flex flex-col justify-between gap-3"
            >
              <div>
                {/* League & Kickoff Time */}
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400/80 mb-2">
                  <span className="font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                    {fix.league}
                  </span>
                  <span>{fix.date} · {fix.kickoffTime}</span>
                </div>

                {/* Match Teams */}
                <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                  <span>{fix.homeTeam} vs {fix.awayTeam}</span>
                  <ArrowRight className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>

                {/* Badges for Corners & Cards if modeled */}
                <div className="flex items-center gap-2 mt-2 text-[10px] font-mono">
                  {fix.corners && (
                    <span className="px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60 flex items-center gap-1">
                      <Flag className="w-3 h-3" /> {fix.corners.totalProjection}
                    </span>
                  )}
                  {fix.bookings && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> {fix.bookings.totalCardProjection}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom selection and odds */}
              <div className="pt-2 border-t border-emerald-900/80 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-emerald-400 block font-mono">Quant Pick:</span>
                  <span className="text-xs font-bold text-amber-300">
                    {fix.recommendedSelection.pick}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-amber-400 text-sm">
                    {formatOdds(fix.recommendedSelection.odds, oddsFormat)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToSlip(fix);
                    }}
                    disabled={inSlip}
                    className={`p-1.5 rounded-lg transition-all ${
                      inSlip
                        ? 'bg-emerald-900 text-emerald-400 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm active:scale-95'
                    }`}
                    title={inSlip ? "Already in accumulator" : "Add to accumulator slip"}
                  >
                    {inSlip ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
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
