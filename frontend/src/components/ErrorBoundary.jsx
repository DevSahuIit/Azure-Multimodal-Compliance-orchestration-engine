import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Vigilant Agent Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F172A] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#1E293B] border border-rose-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Something Went Wrong</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Vigilant Agent interface encountered an unexpected runtime exception.
            </p>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-rose-300 overflow-x-auto text-left">
              {this.state.error?.toString() || "Unknown error"}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}