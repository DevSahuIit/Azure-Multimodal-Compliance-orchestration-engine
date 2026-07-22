import React, { useState } from 'react';
import { 
  BookOpen, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  Key, 
  Layers, 
  CheckCircle2, 
  ExternalLink,
  Bot,
  Video,
  FileCode
} from 'lucide-react';

export default function DocumentationPage({ onBackToApp }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full max-w-7xl mx-auto my-6 p-4">
      <div className="bg-[#1E293B] border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl min-h-[700px] flex flex-col md:flex-row">
        
        {/* Left Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-[#0F172A] border-b md:border-b-0 md:border-r border-slate-700/60 p-6 flex flex-col justify-between flex-shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold">
                <BookOpen className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">Docs & Guides</span>
            </div>

            {/* Doc Navigation Tabs */}
            <nav className="space-y-1.5 text-xs font-medium">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'overview' 
                    ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Cpu className="w-4 h-4" /> System Overview
              </button>

              <button
                onClick={() => setActiveTab('agentic')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'agentic' 
                    ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Bot className="w-4 h-4" /> Agentic AI Architecture
              </button>

              <button
                onClick={() => setActiveTab('multimodal')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'multimodal' 
                    ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Video className="w-4 h-4" /> Multimodal Pipeline
              </button>

              <button
                onClick={() => setActiveTab('api')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'api' 
                    ? 'bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Terminal className="w-4 h-4" /> API Reference
              </button>
            </nav>
          </div>

          <button
            onClick={onBackToApp}
            className="mt-8 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            ← Back to Console
          </button>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 p-8 md:p-10 overflow-y-auto max-h-[800px]">
          
          {/* TAB 1: SYSTEM OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Architecture Documentation</span>
                <h1 className="text-3xl font-extrabold text-white mt-1">Vigilant Agent Overview</h1>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Vigilant Agent is an enterprise compliance orchestration engine built to automate brand, legal, and security verification across digital media assets using Agentic AI reasoning loops.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/60 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Automated Compliance</h3>
                  <p className="text-xs text-slate-400">Replaces manual video reviews with instant policy reasoning and structured audit findings.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/60 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Azure & Groq Infrastructure</h3>
                  <p className="text-xs text-slate-400">Leverages ultra-fast Groq LLM inference combined with Azure multi-modal storage and processing.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700/60 space-y-3">
                <h3 className="text-sm font-bold text-white">Core Technology Stack</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">FastAPI</span>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">Groq Llama-3</span>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">Whisper Audio Transcription</span>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">Azure AI Services</span>
                  <span className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">React + Tailwind CSS</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AGENTIC AI ARCHITECTURE */}
          {activeTab === 'agentic' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Autonomous Reasoning</span>
                <h1 className="text-3xl font-extrabold text-white mt-1">Agentic AI Decision Loops</h1>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Unlike traditional static keyword analyzers, Vigilant Agent employs an autonomous agentic loop to inspect, cross-reference, and evaluate policy compliance.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/60 space-y-2">
                  <span className="text-[10px] font-mono text-amber-400 font-bold">STAGE 01 — MULTIMODAL INGESTION</span>
                  <h4 className="text-sm font-bold text-white">Parallel Data Extraction</h4>
                  <p className="text-xs text-slate-400">Extracts audio transcripts via Whisper, video OCR frames via vision models, and metadata into a unified temporal timeline.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/60 space-y-2">
                  <span className="text-[10px] font-mono text-amber-400 font-bold">STAGE 02 — POLICY EVALUATION</span>
                  <h4 className="text-sm font-bold text-white">Groq LLM Reasoning Engine</h4>
                  <p className="text-xs text-slate-400">The agent systematically compares detected logos, claims, and disclaimers against the compliance rule database.</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/60 space-y-2">
                  <span className="text-[10px] font-mono text-amber-400 font-bold">STAGE 03 — REPORT GENERATION</span>
                  <h4 className="text-sm font-bold text-white">Audit Logging & Evidence Export</h4>
                  <p className="text-xs text-slate-400">Generates structured JSON & Markdown reports containing violation timestamps, severity ratings, and remediation recommendations.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MULTIMODAL PIPELINE */}
          {activeTab === 'multimodal' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Media Processing</span>
                <h1 className="text-3xl font-extrabold text-white mt-1">Multimodal Vision & Audio</h1>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Detailed breakdown of how media assets pass through vision and acoustic extraction pipelines.
                </p>
              </div>

              <div className="bg-[#0F172A] border border-slate-700/60 rounded-2xl p-5 space-y-3 font-mono text-xs text-slate-300">
                <p className="text-amber-400 font-bold">// Video Audit Workflow Blueprint</p>
                <p>1. [User Input] → YouTube Media URL</p>
                <p>2. [Downloader Module] → Extract MP4 stream & Audio WAV</p>
                <p>3. [Vision OCR Pipeline] → Keyframe Sampling (Every 1.0s) → Text Detection</p>
                <p>4. [Acoustic Pipeline] → Speech-to-Text → Timestamped Transcripts</p>
                <p>5. [Groq Agent Sync] → Policy Matrix Mapping → Findings Report</p>
              </div>
            </div>
          )}

          {/* TAB 4: API REFERENCE */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Developer Docs</span>
                <h1 className="text-3xl font-extrabold text-white mt-1">Backend API Endpoints</h1>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  Connect your applications directly to the Vigilant Agent REST API.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold">POST</span>
                    <span className="font-mono text-xs font-bold text-white">/audit</span>
                  </div>
                  <p className="text-xs text-slate-400">Triggers an agentic multimodal compliance audit for a given video URL.</p>
                  <pre className="bg-slate-950 p-3 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto">
{`{
  "email": "user@company.com",
  "video_url": "https://www.youtube.com/watch?v=..."
}`}
                  </pre>
                </div>

                <div className="p-4 rounded-2xl bg-[#0F172A] border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-mono text-[10px] font-bold">GET</span>
                    <span className="font-mono text-xs font-bold text-white">/sessions?email={`{user_email}`}</span>
                  </div>
                  <p className="text-xs text-slate-400">Fetches all historical compliance audit reports for a logged-in account.</p>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}