import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0F172A]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/10">
              <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-50">
              Lunaw<span className="text-amber-500">.ai</span>
            </span>
          </a>
          <span className="hidden sm:inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-0.5 text-[11px] font-semibold text-amber-400">
            Compliance Engine
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#orchestration" className="hover:text-amber-400 transition-colors">Orchestration</a>
          <a href="#compliance" className="hover:text-amber-400 transition-colors">Compliance Rules</a>
          <a href="#evidence" className="hover:text-amber-400 transition-colors">Evidence Logs</a>
          <a href="#docs" className="hover:text-amber-400 transition-colors">Documentation</a>
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
          <a 
            href="https://github.com/DevSahuIit/Azure-Multimodal-Compliance-orchestration-engine" 
            target="_blank" 
            rel="noreferrer"
            className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:border-amber-500/50 hover:bg-slate-800"
          >
            GitHub Repo
          </a>
          <a 
            href="#portal" 
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 flex items-center gap-1.5"
          >
            Launch Console <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="md:hidden text-slate-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0F172A] px-6 py-4 space-y-3 text-sm">
          <a href="#orchestration" className="block text-slate-300 hover:text-amber-400">Orchestration</a>
          <a href="#compliance" className="block text-slate-300 hover:text-amber-400">Compliance Rules</a>
          <a href="#evidence" className="block text-slate-300 hover:text-amber-400">Evidence Logs</a>
          <a href="#docs" className="block text-slate-300 hover:text-amber-400">Documentation</a>
        </div>
      )}
    </header>
  );
}