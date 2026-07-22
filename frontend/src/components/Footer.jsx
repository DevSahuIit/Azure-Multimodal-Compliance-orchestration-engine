import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-[#0B1120] text-slate-400">
      <div className="mx-auto max-w-7xl px-6 py-14">
        
        {/* Top Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-800/60">
          
          {/* Brand Info Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold">
                <ShieldCheck className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Lunaw Compliance Engine
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
              Empowering enterprise cloud architecture with automated multi-modal compliance verification, security policy reasoning, and audit log generation.
            </p>
            <div className="pt-2 text-xs text-amber-400 flex items-center gap-2 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              Engine Active & Systems Operational
            </div>
          </div>

          {/* Nav Column 1 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase">Orchestration</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-amber-400 transition-colors">Multi-Modal Parsing</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Vision OCR & NLP</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Policy Verification</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Rule Engine</a></li>
            </ul>
          </div>

          {/* Nav Column 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase">Compliance</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-amber-400 transition-colors">Azure Benchmarks</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">HIPAA & SOC 2 Checks</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Evidence Logging</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Export Findings</a></li>
            </ul>
          </div>

          {/* Nav Column 3 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 tracking-wider uppercase">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="https://github.com/DevSahuIit/Azure-Multimodal-Compliance-orchestration-engine" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">GitHub Repository</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">API Specs</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">System Architecture</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Lunaw Compliance Engine. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Security</a>
          </div>
        </div>

      </div>
    </footer>
  );
}