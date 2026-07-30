import React, { useState } from 'react';
import { 
  FileCode, 
  Layers, 
  X, 
  CheckCircle, 
  Cpu, 
  Database, 
  HardDrive, 
  Zap, 
  ShieldCheck,
  Server,
  ArrowRight
} from 'lucide-react';

export default function Footer({ onOpenRules, onOpenDocs }) {
  const [activeModal, setActiveModal] = useState(null); // 'api' | 'blueprint' | null

  return (
    <>
      <footer className="w-full bg-[#0F172A] border-t border-slate-800 text-slate-400 text-xs py-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-sm text-white">Vigilant Agent</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Autonomous multi-modal compliance verification and brand policy enforcement platform.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-200 tracking-wider">Quick Links</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button onClick={onOpenDocs} className="hover:text-amber-400 transition cursor-pointer">
                  System Documentation
                </button>
              </li>
              <li>
                <button onClick={onOpenRules} className="hover:text-amber-400 transition cursor-pointer">
                  Compliance Rule Engine
                </button>
              </li>
            </ul>
          </div>

          {/* Resources Col */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-200 tracking-wider">Resources</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button 
                  onClick={() => setActiveModal('api')} 
                  className="hover:text-amber-400 transition flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-500" /> API Specs
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveModal('blueprint')} 
                  className="hover:text-amber-400 transition flex items-center gap-1.5 cursor-pointer text-slate-300 font-medium"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-500" /> Architecture Blueprint
                </button>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-800/80 mt-8 pt-4 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Vigilant Agent. All rights reserved.</p>
          <p className="font-mono">Engine: FastEmbed + Groq Llama-3.3-70B</p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL 1: API SPECS */}
      {/* ========================================================================= */}
      {activeModal === 'api' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-700/80 flex items-center justify-between bg-[#0F172A]">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Vigilant Agent — OpenAPI Endpoints</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 font-sans">
              
              {/* Endpoint 1 */}
              <div className="bg-[#0F172A] border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                    POST
                  </span>
                  <span className="font-mono text-amber-400 font-semibold">/audit</span>
                  <span className="text-[10px] text-slate-400 ml-auto">Multipart Form Data</span>
                </div>
                <p className="text-slate-400">Triggers multi-modal extraction (audio/video/ocr) and runs RAG compliance reasoning via ChatGroq.</p>
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
                  <div className="text-slate-400">// Form Parameters</div>
                  <div><span className="text-amber-400">email</span>: string (User email)</div>
                  <div><span className="text-amber-400">file</span>: Binary (MP4, MOV, MKV &lt; 300MB)</div>
                </div>
              </div>

              {/* Endpoint 2 */}
              <div className="bg-[#0F172A] border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                    GET
                  </span>
                  <span className="font-mono text-amber-400 font-semibold">/sessions?email=&#123;email&#125;</span>
                </div>
                <p className="text-slate-400">Retrieves historical audit sessions, compliance scores, and breach logs for the authenticated account.</p>
              </div>

              {/* Endpoint 3 */}
              <div className="bg-[#0F172A] border border-slate-700/60 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                    POST
                  </span>
                  <span className="font-mono text-amber-400 font-semibold">/auth/login</span>
                </div>
                <p className="text-slate-400">Authenticates user credentials and yields session token context.</p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-700/80 bg-[#0F172A] text-right">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ARCHITECTURE BLUEPRINT */}
      {/* ========================================================================= */}
      {activeModal === 'blueprint' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-700/80 flex items-center justify-between bg-[#0F172A]">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">System Architecture & Pipeline Blueprint</h3>
              </div>
              <button 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 font-sans">
              
              {/* Visual Flow Diagram */}
              <div className="bg-[#0F172A] border border-slate-700/60 rounded-xl p-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Dataflow Diagram (Zero-PyTorch Lightweight Engine)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
                  
                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1.5 flex flex-col items-center justify-center">
                    <Server className="w-5 h-5 text-amber-400" />
                    <span className="font-bold text-slate-200 block text-[11px]">1. Ingestion</span>
                    <span className="text-[10px] text-slate-400">FastAPI File Upload & FFmpeg Stream Extraction</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1.5 flex flex-col items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-slate-200 block text-[11px]">2. FastEmbed ONNX</span>
                    <span className="text-[10px] text-slate-400">Lightweight C++ ONNX Embeddings (~50MB RAM)</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1.5 flex flex-col items-center justify-center">
                    <Database className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-slate-200 block text-[11px]">3. Azure Search</span>
                    <span className="text-[10px] text-slate-400">Vector Similarity Search (Top-K Knowledge Retrieval)</span>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl space-y-1.5 flex flex-col items-center justify-center">
                    <Cpu className="w-5 h-5 text-orange-400" />
                    <span className="font-bold text-slate-200 block text-[11px]">4. Groq Reasoning</span>
                    <span className="text-[10px] text-slate-400">Llama-3.3-70B Structured Output Evaluation</span>
                  </div>

                </div>
              </div>

              {/* Architectural Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-[#0F172A] border border-slate-700/60 p-4 rounded-xl space-y-2">
                  <h5 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-amber-500" /> Ultra-Light Container Optimization
                  </h5>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    By migrating from PyTorch (`sentence-transformers`) to <strong>FastEmbed (ONNX execution engine)</strong>, cold start container memory dropped from 700MB+ to under ~50MB, completely eliminating Render OOM silent kills.
                  </p>
                </div>

                <div className="bg-[#0F172A] border border-slate-700/60 p-4 rounded-xl space-y-2">
                  <h5 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Agentic RAG Pipeline
                  </h5>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Transcripts and metadata are queried against indexed Azure Search policy documents. Retrieved context is passed to Groq’s high-throughput Llama 3.3 model to enforce structured compliance outputs.
                  </p>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-700/80 bg-[#0F172A] text-right">
              <button 
                onClick={() => setActiveModal(null)} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}