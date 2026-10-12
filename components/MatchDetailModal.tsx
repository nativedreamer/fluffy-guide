import React from 'react';
import { MatchFixture, OddsFormat } from '../lib/types';
import { formatOdds } from '../lib/sportsEngine';
import { 
  X, 
  Trophy, 
  Calendar, 
  MapPin, 
  Flag, 
  ShieldAlert, 
  Activity, 
  CheckCircle, 
  Plus, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface MatchDetailModalProps {
  fixture: MatchFixture | null;
  onClose: () => void;
  oddsFormat: OddsFormat;
  onAddToSlip?: (fixture: MatchFixture) => void;
  isAlreadyInSlip?: boolean;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  fixture,
  onClose,
  oddsFormat,
  onAddToSlip,
  isAlreadyInSlip = false
}) => {
  if (!fixture) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#08261b] border border-emerald-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden font-sans max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#051c13] border-b border-emerald-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono text-xs">
              {fixture.league}
            </span>
            <span className="text-emerald-400 font-mono text-xs">·</span>
            <span className="text-emerald-400 font-mono text-xs flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {fixture.date} {fixture.kickoffTime}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300/60 hover:text-white hover:bg-emerald-900/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Match Scoreboard Title */}
          <div className="bg-gradient-to-r from-[#04160e] via-[#092e1f] to-[#04160e] p-5 rounded-2xl border border-emerald-800/80 text-center">
            <div className="flex items-center justify-around gap-4">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <h3 className="text-base sm:text-lg font-black text-white">{fixture.homeTeam}</h3>
                <span className="text-[11px] text-emerald-300 font-mono">Home</span>
                {/* Form badges */}
                <div className="flex items-center justify-center gap-1 mt-1.5">
                  {fixture.homeForm.map((res, i) => (
                    <span
                      key={i}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-white ${
                        res === 'W' ? 'bg-emerald-600' : res === 'D' ? 'bg-amber-600' : 'bg-rose-600'
                      }`}
                    >
                      {res}
                    </span>
                  ))}
                </div>
              </div>

              {/* VS badge */}
              <div className="px-3 py-1 rounded-full bg-emerald-950 border border-amber-400/40 text-amber-400 font-mono font-bold text-xs">
                VS
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center">
                <h3 className="text-base sm:text-lg font-black text-white">{fixture.awayTeam}</h3>
                <span className="text-[11px] text-emerald-300 font-mono">Away</span>
                {/* Form badges */}
                <div className="flex items-center justify-center gap-1 mt-1.5">
                  {fixture.awayForm.map((res, i) => (
                    <span
                      key={i}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-white ${
                        res === 'W' ? 'bg-emerald-600' : res === 'D' ? 'bg-amber-600' : 'bg-rose-600'
                      }`}
                    >
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-900/60 flex items-center justify-center gap-2 text-xs text-emerald-300/80 font-mono">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{fixture.venue}</span>
            </div>
          </div>

          {/* Recommended Value Pick */}
          <div className="bg-[#051c13] p-4 rounded-xl border border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                Quant Recommended Selection
              </span>
              <span className="text-base font-bold text-white block">
                {fixture.recommendedSelection.pick}
              </span>
              <p className="text-xs text-emerald-300/80 mt-1">
                {fixture.recommendedSelection.reasonSummary}
              </p>
            </div>
            <div className="text-right font-mono">
              <span className="text-xl font-black text-amber-400 block">
                {formatOdds(fixture.recommendedSelection.odds, oddsFormat)}
              </span>
              <span className="text-[11px] text-emerald-400">
                Confidence: {fixture.recommendedSelection.confidenceScore}%
              </span>
            </div>
          </div>

          {/* Head to Head Summary */}
          <div className="bg-[#051a11] p-3.5 rounded-xl border border-emerald-900/80 text-xs font-mono">
            <h4 className="font-bold text-slate-300 mb-1 uppercase tracking-wider text-[11px]">
              Head-to-Head & Context:
            </h4>
            <p className="text-emerald-200/90 leading-relaxed">
              {fixture.h2hSummary}
            </p>
          </div>

          {/* Available Match Markets Grid */}
          <div className="space-y-2 font-mono text-xs">
            <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
              Main Market Odds:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-[#061e15] p-2.5 rounded-lg border border-emerald-900 text-center">
                <span className="text-[10px] text-slate-400 block">1 (Home Win)</span>
                <span className="font-bold text-amber-400 text-sm">
                  {formatOdds(fixture.odds.homeWin, oddsFormat)}
                </span>
              </div>
              {fixture.odds.draw && (
                <div className="bg-[#061e15] p-2.5 rounded-lg border border-emerald-900 text-center">
                  <span className="text-[10px] text-slate-400 block">X (Draw)</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {formatOdds(fixture.odds.draw, oddsFormat)}
                  </span>
                </div>
              )}
              <div className="bg-[#061e15] p-2.5 rounded-lg border border-emerald-900 text-center">
                <span className="text-[10px] text-slate-400 block">2 (Away Win)</span>
                <span className="font-bold text-amber-400 text-sm">
                  {formatOdds(fixture.odds.awayWin, oddsFormat)}
                </span>
              </div>
              {fixture.odds.doubleChance1X && (
                <div className="bg-[#061e15] p-2.5 rounded-lg border border-emerald-900 text-center">
                  <span className="text-[10px] text-slate-400 block">1X (Double Chance)</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {formatOdds(fixture.odds.doubleChance1X, oddsFormat)}
                  </span>
                </div>
              )}
              {fixture.odds.over15 && (
                <div className="bg-[#061e15] p-2.5 rounded-lg border border-emerald-900 text-center">
                  <span className="text-[10px] text-slate-400 block">Over 1.5 Goals</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {formatOdds(fixture.odds.over15, oddsFormat)}
                  </span>
                </div>
              )}
              {fixture.odds.bttsYes && (
                <div className="bg-[#061e15] p-2.5 rounded-lg border border-emerald-900 text-center">
                  <span className="text-[10px] text-slate-400 block">BTTS (Yes)</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {formatOdds(fixture.odds.bttsYes, oddsFormat)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Corners & Bookings previews if available */}
          {fixture.corners && (
            <div className="bg-[#061e15] p-3.5 rounded-xl border border-teal-800/60 font-mono text-xs">
              <div className="flex items-center justify-between text-teal-300 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-teal-400" />
                  Corner Model: {fixture.corners.totalProjection}
                </span>
                <span>{fixture.corners.historicalOver75Freq}</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                {fixture.corners.tacticalNotes}
              </p>
            </div>
          )}

          {fixture.bookings && (
            <div className="bg-[#061e15] p-3.5 rounded-xl border border-amber-800/60 font-mono text-xs">
              <div className="flex items-center justify-between text-amber-300 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Disciplinary Model: {fixture.bookings.totalCardProjection}
                </span>
                <span>Referee: {fixture.bookings.referee?.name || 'Assigned'}</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                {fixture.bookings.tacticalNotes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-[#051c13] border-t border-emerald-900/80 flex items-center justify-between shrink-0">
          <span className="text-xs font-mono text-emerald-400/80">
            AEE Verification: High Evidence Sample
          </span>
          {onAddToSlip && (
            <button
              onClick={() => onAddToSlip(fixture)}
              disabled={isAlreadyInSlip}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition-all ${
                isAlreadyInSlip
                  ? 'bg-emerald-900 text-emerald-300 cursor-not-allowed border border-emerald-700'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
              }`}
            >
              {isAlreadyInSlip ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Already in Accumulator
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add Pick to Accumulator
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
