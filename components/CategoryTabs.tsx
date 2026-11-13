import React from 'react';
import { AnalysisCategory } from '../lib/types';
import { Target, Calendar, CalendarDays, Flag, ShieldAlert, Sparkles, LayoutList } from 'lucide-react';

interface CategoryTabsProps { activeTab: AnalysisCategory | 'ALL_FIXTURES'; onSelectTab: (tab: AnalysisCategory | 'ALL_FIXTURES') => void; accumulatorCount?: number; }

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ activeTab, onSelectTab, accumulatorCount = 0 }) => {
  const tabs = [
    { id: 'ALL_FIXTURES' as const, label: 'Live slate', short: 'Slate', icon: LayoutList, badge: 'Now' },
    { id: 'DAILY_TIPS' as const, label: 'Today', short: 'Today', icon: Calendar, badge: 'Live' },
    { id: 'WEEKLY_TIPS' as const, label: 'Weekend view', short: 'Weekend', icon: CalendarDays, badge: 'Next' },
    { id: 'ACCUMULATOR' as const, label: 'Accumulator', short: 'Acca', icon: Target, badge: accumulatorCount ? `${accumulatorCount}` : 'Ready' },
    { id: 'CORNERS' as const, label: 'Corners', short: 'Corners', icon: Flag, badge: '7.5+' },
    { id: 'BOOKINGS' as const, label: 'Bookings', short: 'Cards', icon: ShieldAlert, badge: 'Modelled' },
    { id: 'BOTH_CORNERS_BOOKINGS' as const, label: 'Dual analysis', short: 'Dual', icon: Sparkles, badge: 'Both' }
  ];
  return <nav className="glass-chrome sticky top-[65px] z-30 border-b" aria-label="Analysis sections"><div className="mx-auto max-w-[1400px] overflow-x-auto px-3 py-2.5 no-scrollbar sm:px-7 lg:px-10"><div className="flex min-w-max items-center gap-1.5">{tabs.map(({ id, label, short, icon: Icon, badge }) => { const active = activeTab === id; return <button key={id} onClick={() => onSelectTab(id)} aria-current={active ? 'page' : undefined} className={`pressable flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs whitespace-nowrap ${active ? 'border-[#b9f6d0]/30 bg-[#b9f6d0] text-[#0b1715] shadow-[0_8px_20px_rgba(103,230,154,.13)]' : 'border-white/8 bg-white/[.025] text-[#9bb3a8] hover:border-white/15 hover:text-white'}`}><Icon className="h-3.5 w-3.5" /><span className="sm:hidden">{short}</span><span className="hidden sm:inline">{label}</span><span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${active ? 'bg-black/10' : 'bg-white/8 text-[#b9f6d0]'}`}>{badge}</span></button>; })}</div></div></nav>;
};
