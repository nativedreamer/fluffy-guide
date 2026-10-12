import React, { useState } from 'react';
import { Download, X, Smartphone, WifiOff, Check } from 'lucide-react';

interface PwaInstallBannerProps {
  isInstallable: boolean;
  onInstall: () => void;
  isOffline: boolean;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({
  isInstallable,
  onInstall,
  isOffline
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  if (isOffline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#072418] border border-amber-500/60 rounded-xl p-3.5 shadow-2xl flex items-center justify-between gap-3 font-sans animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Offline Mode Active</span>
            <p className="text-[11px] text-emerald-200/80 font-mono">
              Displaying cached fixtures & quantitative statistics.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded text-emerald-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-gradient-to-r from-[#072418] to-[#0a3523] border border-emerald-600/70 rounded-xl p-3.5 shadow-2xl flex items-center justify-between gap-3 font-sans animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <span className="text-xs font-bold text-white block">Install AEE Tips PWA</span>
          <p className="text-[11px] text-emerald-200/80 font-mono">
            Fast offline access · 10+ Odds alerts · Home screen app
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onInstall}
          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-sm active:scale-95"
        >
          Install
        </button>
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded text-emerald-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
