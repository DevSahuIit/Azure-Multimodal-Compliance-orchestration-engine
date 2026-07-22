import React from 'react';
import { X, ShieldCheck, AlertTriangle } from 'lucide-react';
import { COMPLIANCE_RULES } from '../data/complianceRules';

export default function RulesModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700/60 bg-[#1E293B] p-6 shadow-2xl md:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 font-bold text-slate-950">
              <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Active Compliance Audit Rules</h3>
              <p className="text-xs text-slate-400">Rules evaluated by the multi-modal orchestration engine</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-xl border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Rules List */}
        <div className="my-6 max-h-[60vh] space-y-3 overflow-y-auto pr-2">
          {COMPLIANCE_RULES.map((rule) => (
            <div 
              key={rule.id} 
              className="rounded-2xl border border-slate-700/50 bg-[#0F172A] p-4 text-xs transition-all hover:border-slate-600"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono font-semibold text-amber-400">{rule.id}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                  rule.severity === 'Critical' 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                    : rule.severity === 'High' 
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {rule.severity}
                </span>
              </div>
              <h4 className="font-bold text-white">{rule.title}</h4>
              <p className="mt-1 leading-relaxed text-slate-400">{rule.description}</p>
              <div className="mt-2 text-[10px] text-slate-500 font-medium">
                Category: <span className="text-slate-300">{rule.category}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-700/60 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all hover:brightness-110"
          >
            Close Rules View
          </button>
        </div>

      </div>
    </div>
  );
}