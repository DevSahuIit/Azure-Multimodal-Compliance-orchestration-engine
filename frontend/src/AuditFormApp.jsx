import React, { useState } from 'react';
import axios from 'axios';
import { 
  Youtube, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AuditFormApp() {
  const [step, setStep] = useState(1);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  // Step 1: Validate YouTube URL
  const handleNext = () => {
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube video URL.');
      return;
    }
    if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be')) {
      setError('Please enter a valid YouTube link (e.g., https://www.youtube.com/watch?v=...).');
      return;
    }
    setError('');
    setStep(2);
  };

  // Step 2: Submit to FastAPI Backend (/audit)
  const handleAudit = async () => {
    setLoading(true);
    setError('');

    try {
      // 10-minute timeout for Azure Video Indexer processing
      const response = await axios.post(
        `${API_BASE_URL}/audit`,
        { video_url: videoUrl },
        { timeout: 600000 } 
      );

      setAuditResult(response.data);
      setStep(3);
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Audit request timed out. Azure Video Indexer is taking longer than expected.');
      } else {
        setError(err.response?.data?.detail || 'Failed to complete compliance audit pipeline.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setVideoUrl('');
    setAuditResult(null);
    setError('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 mb-6">
        <ShieldCheck className="w-8 h-8 text-indigo-400" />
        <span className="text-xl font-bold tracking-tight text-white">Brand Guardian AI</span>
      </div>

      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8">
        
        {/* Step Progress Bar (Daily UI #082 Form Design) */}
        {step < 3 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
              <span>STEP {step} OF 2</span>
              <span>{step === 1 ? '50% - Target Selection' : '100% - Ready to Audit'}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full transition-all duration-300 ease-out" 
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>
        )}

        {/* STEP 1: Video Input */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Video Compliance Audit</h2>
              <p className="text-slate-400 text-sm mt-1">
                Provide a YouTube promotional video URL to analyze spoken claims and on-screen disclaimers.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                YouTube Link
              </label>
              <div className="relative">
                <Youtube className="absolute left-3.5 top-3.5 w-5 h-5 text-rose-500" />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition text-sm"
                />
              </div>
              {error && <p className="text-xs text-rose-400 font-medium mt-1">{error}</p>}
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Preview & Confirm */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Confirm Pipeline Execution</h2>
              <p className="text-slate-400 text-sm mt-1">
                The video will be downloaded via yt-dlp, indexed in Azure AI Video Indexer, and audited against guidelines with Groq Llama 3.3.
              </p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Selected Target URL</span>
              <p className="font-mono text-indigo-300 truncate">{videoUrl}</p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep(1)}
                className="w-1/3 border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleAudit}
                className="w-2/3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Indexer...</span>
                  </>
                ) : (
                  <span>Run Audit Pipeline</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Compliance Report Display */}
        {step === 3 && auditResult && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Compliance Results</h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">Session: {auditResult.session_id}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                auditResult.status?.toLowerCase() === 'pass' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                STATUS: {auditResult.status || 'COMPLETED'}
              </div>
            </div>

            {/* Violations List */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-400 mb-3">Detected Issues</h3>
              {auditResult.compliance_results && auditResult.compliance_results.length > 0 ? (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {auditResult.compliance_results.map((issue, idx) => (
                    <div key={idx} className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-400 uppercase">{issue.category}</span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs">{issue.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>No compliance violations detected. Video adheres to guidelines.</span>
                </div>
              )}
            </div>

            {/* Final Markdown Summary */}
            <div>
              <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Executive Summary</h3>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {auditResult.final_report}
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Audit Another Video
            </button>
          </div>
        )}

      </div>
    </div>
  );
}