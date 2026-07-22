import React, { useState } from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Activity, 
  Terminal, 
  CheckCircle2, 
  Copy, 
  Check, 
  Server, 
  Code2, 
  Workflow, 
  Layers, 
  BarChart3, 
  Database,
  Lock,
  Youtube
} from 'lucide-react';

export default function Documentation() {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 text-slate-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/40 border border-slate-700/60 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
            <BookOpen className="w-3.5 h-3.5" /> Vigilant Agent v2.0 Developer Docs
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Autonomous Multi-Modal Compliance Documentation
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Technical architecture, installation guide, execution metrics, and API specifications for the Vigilant Agent compliance orchestration engine.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-700/60 overflow-x-auto gap-2 pb-1">
        {[
          { id: 'overview', label: 'Architecture Overview', icon: Workflow },
          { id: 'installation', label: 'Installation & Setup', icon: Terminal },
          { id: 'evaluations', label: 'Metrics & Evaluation', icon: BarChart3 },
          { id: 'api', label: 'API Reference', icon: Server }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition cursor-pointer ${
                isActive 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ARCHITECTURE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Youtube className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="font-bold text-white text-base">1. Multi-Modal Indexing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Extracts spoken audio transcripts and on-screen visual text (OCR) from target media using Azure Video Indexer with fast indexing presets (`Basic`, `NoStreaming`).
              </p>
            </div>

            <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">2. LangGraph Workflow</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Stateful agent pipeline managing context retrieval, vector search against regulatory policy guidelines, and structured compliance checks.
              </p>
            </div>

            <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-bold text-white text-base">3. Groq Resilient Reasoning</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Groq Llama-3 inference with Tenacity exponential backoff retries (`@retry`) to guard against API rate limits and generate structured JSON breach reports.
              </p>
            </div>

          </div>

          <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" /> End-to-End System Pipeline
            </h3>
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
              [ Frontend: AuditFormApp.jsx ]<br/>
              &nbsp;&nbsp;│<br/>
              &nbsp;&nbsp;▼ (POST /audit with YouTube URL)<br/>
              [ FastAPI Backend: server.py ]<br/>
              &nbsp;&nbsp;│<br/>
              &nbsp;&nbsp;├── 1. YouTube Title Fetch (oEmbed API)<br/>
              &nbsp;&nbsp;├── 2. Video Indexer Service (indexingPreset="Basic")<br/>
              &nbsp;&nbsp;├── 3. LangGraph Stateful Execution (app.invoke)<br/>
              &nbsp;&nbsp;├── 4. Groq LLM Reasoning + Tenacity Exponential Retries<br/>
              &nbsp;&nbsp;└── 5. Metric Computation (Compliance Score, Latency, Violations)<br/>
              &nbsp;&nbsp;│<br/>
              &nbsp;&nbsp;▼ (JSON Response + SQLite Audit Log Persistence)<br/>
              [ Executive Dashboard View ]
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INSTALLATION & SETUP */}
      {activeTab === 'installation' && (
        <div className="space-y-6">
          <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">1. Environment Setup</h3>
            <p className="text-xs text-slate-400">Activate your Python virtual environment and install backend requirements:</p>
            
            <div className="relative bg-[#0F172A] border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-400">
              <button 
                onClick={() => handleCopy("python -m pip install -r requirements.txt\npip install tenacity", 1)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                {copiedIndex === 1 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <code>
                # Activate virtual environment (Windows PowerShell)<br/>
                .\.venv\Scripts\Activate.ps1<br/><br/>
                # Install backend dependencies & tenacity retry library<br/>
                python -m pip install -r requirements.txt<br/>
                python -m pip install tenacity
              </code>
            </div>
          </div>

          <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">2. Database Schema Migration</h3>
            <p className="text-xs text-slate-400">Ensure your SQLite database includes evaluation metric columns and media titles:</p>
            
            <div className="relative bg-[#0F172A] border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-400">
              <button 
                onClick={() => handleCopy("python -c \"import sqlite3; conn = sqlite3.connect('audit_sessions.db'); cursor = conn.cursor(); cursor.execute('ALTER TABLE audit_sessions ADD COLUMN compliance_score INTEGER DEFAULT 100;'); cursor.execute('ALTER TABLE audit_sessions ADD COLUMN latency_sec REAL DEFAULT 0.0;'); cursor.execute('ALTER TABLE audit_sessions ADD COLUMN violations_count INTEGER DEFAULT 0;'); cursor.execute('ALTER TABLE audit_sessions ADD COLUMN video_title TEXT DEFAULT ''YouTube Asset'';'); conn.commit(); conn.close(); print('Migration complete!')\"", 2)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white"
              >
                {copiedIndex === 2 ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <code>
                python -c "import sqlite3; conn = sqlite3.connect('audit_sessions.db'); cursor = conn.cursor(); cursor.execute('ALTER TABLE audit_sessions ADD COLUMN compliance_score INTEGER DEFAULT 100;'); cursor.execute('ALTER TABLE audit_sessions ADD COLUMN latency_sec REAL DEFAULT 0.0;'); cursor.execute('ALTER TABLE audit_sessions ADD COLUMN violations_count INTEGER DEFAULT 0;'); cursor.execute('ALTER TABLE audit_sessions ADD COLUMN video_title TEXT DEFAULT ''YouTube Asset'';'); conn.commit(); conn.close(); print('Migration complete!')"
              </code>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: METRICS & EVALUATION */}
      {activeTab === 'evaluations' && (
        <div className="space-y-6">
          <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" /> Evaluation Metric Definitions
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-amber-400 font-mono text-xs font-bold block">Compliance Score</span>
                <p className="text-xs text-slate-400">
                  A normalized $0-100$ rating calculated by deducting weighted penalties for policy violations (-15 per breach, -10 additional for critical severity).
                </p>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-emerald-400 font-mono text-xs font-bold block">Audit Latency</span>
                <p className="text-xs text-slate-400">
                  Total execution duration measured from request arrival to report output. Optimized using fast video indexing presets (`Basic`).
                </p>
              </div>

              <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-rose-400 font-mono text-xs font-bold block">Breach Count</span>
                <p className="text-xs text-slate-400">
                  Total count of verified regulatory policy non-compliance events flagged across audio dialogue and on-screen visual text.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: API REFERENCE */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold rounded-lg">
                POST
              </span>
              <code className="text-white text-sm font-bold font-mono">/audit</code>
            </div>
            <p className="text-xs text-slate-400">Initiates multi-modal extraction and agentic compliance auditing for a video URL.</p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase">Request Body (JSON)</span>
              <pre className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300">
{`{
  "email": "dev@example.com",
  "video_url": "https://www.youtube.com/watch?v=A4WZF74dAg4"
}`}
              </pre>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase">Response Body (200 OK)</span>
              <pre className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300">
{`{
  "session_id": "c6e35b4e-...",
  "video_id": "vid_c6e35b4e",
  "video_title": "Sample Marketing Campaign Video",
  "status": "COMPLETED",
  "compliance_score": 85,
  "latency_sec": 4.2,
  "violations_count": 1,
  "final_report": "FAIL: Breach of RULE-003 at 00:12s due to unsubstantiated financial guarantees."
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}