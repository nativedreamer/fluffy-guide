import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal, Trophy } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AEE Football Group Uncaught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleHardReset = () => {
    try {
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#04160e] text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-[#08261b] border border-amber-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-white">Temporary Statistical Glitch</h2>
                <p className="text-xs text-emerald-300/80 font-mono">AEE Analytics engine recovered automatically</p>
              </div>
            </div>

            <div className="bg-[#04140d] p-3.5 rounded-xl border border-emerald-900 text-xs mb-5 overflow-auto max-h-40 font-mono">
              <p className="text-amber-300 font-semibold mb-1 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                {this.state.error?.name || 'Runtime Notice'}:
              </p>
              <p className="text-slate-300 break-words">{this.state.error?.message || 'Statistical calculation refresh needed'}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={this.handleRecover}
                className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Resume AEE Analytics
              </button>
              <button
                onClick={this.handleHardReset}
                className="py-2.5 px-4 bg-[#051c13] hover:bg-[#082b1d] text-emerald-300 font-medium text-xs rounded-xl border border-emerald-800 transition-all"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
