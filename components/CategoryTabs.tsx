import React from 'react';
import { AnalysisCategory } from '../lib/types';
import { 
  Target, 
  Calendar, 
  CalendarDays, 
  Flag, 
  ShieldAlert, 
  Sparkles, 
  LayoutList 
} from 'lucide-react';

interface CategoryTabsProps {
  activeTab: AnalysisCategory | 'ALL_FIXTURES';
  onSelectTab: (tab: AnalysisCategory | 'ALL_FIXTURES') => void;
  accumulatorCount?: number;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeTab,
  onSelectTab,
  accumulatorCount = 0
}) => {
  const tabs = [
    {
      id: 'DAILY_TIPS' as const,
      label: 'Daily Tips & Bankers',
      shortLabel: 'Daily Tips',
      icon: Calendar,
      tag: 'Today',
      badge: 'Today Live'
    },
    {
      id: 'WEEKLY_TIPS' as const,
      label: 'Weekly & Weekend Slates',
      shortLabel: 'Weekly Tips',
      icon: CalendarDays,
      tag: 'Weekend',
      badge: 'PL Clashes'
    },
    {
      id: 'ACCUMULATOR' as const,
      label: '10.00+ Target Accumulator',
      shortLabel: '10+ Acca',
      icon: Target,
      tag: 'Section 15',
      badge: accumulatorCount > 0 ? `${accumulatorCount}/7` : 'Ready'
    },
    {
      id: 'CORNERS' as const,
      label: 'Corners (Over 7.5+)',
      shortLabel: 'Corners',
      icon: Flag,
      tag: 'Over 7.5+',
      badge: 'Up to 20'
    },
    {
      id: 'BOOKINGS' as const,
      label: 'Bookings & Referee Cards',
      shortLabel: 'Bookings',
      icon: ShieldAlert,
      tag: 'Referees',
      badge: 'Verified'
    },
    {
      id: 'BOTH_CORNERS_BOOKINGS' as const,
      label: 'Dual Corners & Bookings',
      shortLabel: 'Dual Mode',
      icon: Sparkles,
      tag: 'Section 10',
      badge: 'Both'
    },
    {
      id: 'ALL_FIXTURES' as const,
      label: 'Real Live Fixtures',
      shortLabel: 'All Matches',
      icon: LayoutList,
      tag: 'Global',
      badge: 'Live Data'
    }
  ];

  return (
    <div className="bg-[#072418] border-b border-emerald-900/60 sticky top-[69px] sm:top-[77px] z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2 sm:py-2.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-700 to-emerald-800 text-white border-amber-400 shadow-md shadow-emerald-950 font-bold'
                    : 'bg-[#051a11] text-emerald-200/80 border-emerald-900/90 hover:bg-[#092e1f] hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="inline md:hidden">{tab.shortLabel}</span>
                
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
