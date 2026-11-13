import React from 'react';
import { OddsFormat, SportType } from '../lib/types';
import { Download, WifiOff, CalendarDays, Radio, Sparkles, ChevronDown } from 'lucide-react';

interface HeaderProps {
  oddsFormat: OddsFormat;
  onSelectOddsFormat: (fmt: OddsFormat) => void;
  onTriggerLetsGo: () => void;
  onOpenInstallPrompt?: () => void;
  isInstallable: boolean;
  isOffline: boolean;
  selectedSport: SportType;
  onSelectSport: (sport: SportType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  oddsFormat, onSelectOddsFormat, onTriggerLetsGo, onOpenInstallPrompt, isInstallable, isOffline, selectedSport, onSelectSport
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const sports: Array<{ id: SportType; label: string }> = [
    { id: 'FOOTBALL', label: 'Football' },
    { id: 'BASKETBALL', label: 'Basketball' },
    { id: 'BOTH', label: 'Both' }
  ];

  return (
    <header className="glass-chrome sticky top-0 z-40 border-b shadow-[0_12px_40px_rgba(0,0,0,.16)]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-7 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-emerald-100/20 bg-emerald-100/10 text-emerald-100 shadow-inner shadow-white/5">
            <span className="absolute h-2 w-2 rounded-full bg-[#b9f6d0] live-pulse" />
            <Radio className="h-5 w-5 opacity-0" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[15px] font-semibold tracking-[-0.02em] text-white sm:text-[17px]">fluffy / guide</h1>
              <span className="hidden rounded-full border border-emerald-100/15 bg-emerald-100/8 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#b9f6d0] sm:inline">Live radar</span>
            </div>
            <p className="hidden text-[11px] text-[#9bb3a8] sm:block">Evidence-led matchday decisions</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-[11px] text-[#9bb3a8] lg:flex">
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#b9f6d0]" />{currentDate}</span>
          <span className="h-1 w-1 rounded-full bg-emerald-100/30" />
          {isOffline ? <span className="flex items-center gap-1.5 text-[#ffd38a]"><WifiOff className="h-3.5 w-3.5" />Cached mode</span> : <span className="flex items-center gap-1.5 text-[#b9f6d0]"><span className="h-1.5 w-1.5 rounded-full bg-[#67e69a]" />Feed verified</span>}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden rounded-full border border-white/10 bg-black/15 p-1 sm:flex" aria-label="Choose sport">
            {sports.map((sport) => <button key={sport.id} onClick={() => onSelectSport(sport.id)} className={`pressable rounded-full px-3 py-1.5 text-[11px] font-medium ${selectedSport === sport.id ? 'bg-[#b9f6d0] text-[#0b1715]' : 'text-[#9bb3a8] hover:text-white'}`}>{sport.label}</button>)}
          </div>
          <label className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/15 px-3 py-2 text-[11px] text-[#9bb3a8] md:flex">Odds <select value={oddsFormat} onChange={(e) => onSelectOddsFormat(e.target.value as OddsFormat)} className="bg-transparent font-semibold text-white outline-none"><option value="DECIMAL">Decimal</option><option value="FRACTIONAL">Fractional</option><option value="AMERICAN">US</option></select><ChevronDown className="h-3 w-3" /></label>
          {isInstallable && onOpenInstallPrompt && <button onClick={onOpenInstallPrompt} className="pressable hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[11px] text-[#b9f6d0] hover:bg-white/5 sm:flex"><Download className="h-3.5 w-3.5" /> Install</button>}
          <button onClick={onTriggerLetsGo} className="pressable flex items-center gap-2 rounded-full bg-[#b9f6d0] px-4 py-2.5 text-xs font-bold text-[#0b1715] shadow-[0_8px_24px_rgba(103,230,154,.16)] hover:bg-white"><Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Analyze slate</span><span className="sm:hidden">Analyze</span></button>
        </div>
      </div>
    </header>
  );
};
