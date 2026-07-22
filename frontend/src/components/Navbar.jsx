import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function Navbar({ onGoHome, onOpenRules, onOpenDocs }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-[#0F172A]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Clickable Brand Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onGoHome} 
            className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 font-bold text-slate-950 shadow-md shadow-amber-500/10 group-hover:brightness-110 transition-all">
              <ShieldCheck className="h-5 w-5 stroke-[2.5] text-slate-950" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-50 group-hover:text-amber-400 transition-colors">
              Vigilant<span className="text-amber-500">Agent</span>
            </span>
          </button>
          <span className="hidden sm:inline-block rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-0.5 text-[11px] font-semibold text-amber-400">
            Agentic Compliance Engine
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
          <button 
            onClick={onOpenRules} 
            className="transition-colors hover:text-amber-400 font-medium text-slate-300 cursor-pointer"
          >
            Compliance Rules
          </button>

          <button 
            onClick={onOpenDocs} 
            className="transition-colors hover:text-amber-400 font-medium text-slate-300 cursor-pointer"
          >
            Documentation
          </button>
        </nav>

        {/* Action Button */}
        <div className="hidden items-center gap-4 md:flex">
          <a 
            href="https://github.com/DevSahuIit/Azure-Multimodal-Compliance-orchestration-engine" 
            target="_blank" 
            rel="noreferrer"
            className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs font-semibold text-slate-200 transition-all hover:border-amber-500/50 hover:bg-slate-800"
          >
            GitHub Repo
          </a>
          <button 
            onClick={onGoHome}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 cursor-pointer"
          >
            Launch Console <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
          className="text-slate-400 hover:text-white md:hidden"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="space-y-3 border-b border-slate-800 bg-[#0F172A] px-6 py-4 text-sm md:hidden">
          <button 
            onClick={() => { onOpenRules(); setMobileMenuOpen(false); }} 
            className="block w-full text-left text-slate-300 hover:text-amber-400"
          >
            Compliance Rules
          </button>
          <button 
            onClick={() => { onOpenDocs(); setMobileMenuOpen(false); }} 
            className="block w-full text-left text-slate-300 hover:text-amber-400"
          >
            Documentation
          </button>
        </div>
      )}
    </header>
  );
}