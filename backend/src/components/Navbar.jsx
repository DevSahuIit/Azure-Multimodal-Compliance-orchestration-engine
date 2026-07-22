import React, { useState } from 'react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090D16]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Brand Logo & Tag */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Δ
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">
              Azure Compliance<span className="text-emerald-400">.ai</span>
            </span>
          </a>
          <span className="hidden sm:inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
            Engine v1.0
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <div className="relative group cursor-pointer">
            <span className="hover:text-white transition-colors flex items-center gap-1">
              Architecture
              <svg className="w-4 h-4 opacity-70 group-hover:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </span>
            {/* Dropdown Menu */}
            <div className="absolute left-0 top-full hidden group-hover:block w-48 rounded-xl border border-white/10 bg-[#0F172A] p-2 shadow-xl">
              <a href="#multimodal" className="block rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white">Multi-Modal Parsing</a>
              <a href="#orchestration" className="block rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white">Orchestration Engine</a>
              <a href="#azure" className="block rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white">Azure Infrastructure</a>
            </div>
          </div>

          <a href="#compliance" className="hover:text-white transition-colors">Compliance Tests</a>
          <a href="#evidence" className="hover:text-white transition-colors">Evidence & Logs</a>
          <a href="#docs" className="hover:text-white transition-colors">Documentation</a>
        </nav>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
          <a 
            href="https://github.com/DevSahuIit/Azure-Multimodal-Compliance-orchestration-engine" 
            target="_blank" 
            rel="noreferrer"
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition-all hover:border-emerald-400 hover:bg-emerald-500/10"
          >
            GitHub Repo
          </a>
          <a 
            href="#portal" 
            className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-all hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            Launch Engine
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
        <div className="md:hidden border-b border-white/10 bg-[#090D16] px-6 py-4 space-y-3 text-sm">
          <a href="#architecture" className="block text-slate-300 hover:text-white">Architecture</a>
          <a href="#compliance" className="block text-slate-300 hover:text-white">Compliance Tests</a>
          <a href="#evidence" className="block text-slate-300 hover:text-white">Evidence & Logs</a>
          <a href="#docs" className="block text-slate-300 hover:text-white">Documentation</a>
          <div className="pt-2 flex flex-col gap-2">
            <a href="#portal" className="w-full text-center rounded-lg bg-emerald-500 py-2 text-xs font-semibold text-slate-950">Launch Engine</a>
          </div>
        </div>
      )}
    </header>
  );
}