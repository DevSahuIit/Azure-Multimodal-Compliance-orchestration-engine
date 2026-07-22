import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#05080E] text-slate-400">
      <div className="mx-auto max-w-7xl px-6 py-16">
        
        {/* Top Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/5">
          
          {/* Brand Info Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs">
                Δ
              </div>
              <span className="text-lg font-semibold text-white">
                Azure Compliance Engine
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              Empowering enterprise cloud architecture with automated multi-modal compliance checking, security policy verification, and real-time audit orchestration.
            </p>
            <div className="pt-2 text-xs text-emerald-400 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Engine Online & Systems Operational
            </div>
          </div>

          {/* Nav Column 1 */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Orchestration</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Multi-Modal Parsing</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Document OCR & NLP</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Policy Mapping</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Rule Validation</a></li>
            </ul>
          </div>

          {/* Nav Column 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Azure Security Benchmarks</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">HIPAA & SOC 2 Audits</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Evidence Logging</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Audit Trail Exports</a></li>
            </ul>
          </div>

          {/* Nav Column 3 */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white tracking-wider uppercase">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="https://github.com/DevSahuIit/Azure-Multimodal-Compliance-orchestration-engine" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">GitHub Repository</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Architecture Diagrams</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Release Notes</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Azure Multimodal Compliance Engine. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-400 transition-colors">Security</a>
          </div>
        </div>

      </div>
    </footer>
  );
}