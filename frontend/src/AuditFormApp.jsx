import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight, 
  LogOut, 
  History, 
  Youtube, 
  Loader2, 
  RefreshCw,
  Bot
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function AuditFormApp() {
  // Authentication State
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('guardian_user') || 'null'));
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'reset'
  
  // Auth Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Workspace Audit State
  const [sessions, setSessions] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [auditStep, setAuditStep] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  // Fetch session history for logged-in user
  const fetchHistory = async (userEmail) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/sessions?email=${encodeURIComponent(userEmail)}`);
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  useEffect(() => {
    if (user?.email) fetchHistory(user.email);
  }, [user]);

  // Auth Handlers
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError(''); setAuthLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/signup`, { full_name: fullName, email, password });
      setAuthSuccess('Account created! Logging you in...');
      setTimeout(() => handleLogin(e), 1000);
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Sign up failed.');
    } finally { setAuthLoading(false); }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError(''); setAuthLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      setUser(res.data.user);
      localStorage.setItem('guardian_user', JSON.stringify(res.data.user));
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Invalid email or password.');
    } finally { setAuthLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess(''); setAuthLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      setAuthSuccess(`Reset code generated! Demo Code: ${res.data.demo_reset_code}`);
      setAuthMode('reset');
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Failed to request password reset.');
    } finally { setAuthLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess(''); setAuthLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, { email, token: resetToken, new_password: password });
      setAuthSuccess('Password updated successfully! Please log in.');
      setAuthMode('login');
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Invalid token or reset request failed.');
    } finally { setAuthLoading(false); }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('guardian_user');
    setAuditResult(null);
    setSessions([]);
  };

  // Audit Trigger
  const handleRunAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/audit`, { email: user.email, video_url: videoUrl }, { timeout: 600000 });
      setAuditResult(res.data);
      setAuditStep(3);
      fetchHistory(user.email);
    } catch (err) {
      alert(err.response?.data?.detail || 'Audit failed.');
    } finally { setAuditLoading(false); }
  };

  // ------------------------------------------------------------------
  // LOGIN / SIGNUP CARD (Vigilant Agent with Agentic AI Description)
  // ------------------------------------------------------------------
  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto my-8 p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 bg-[#1E293B] border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Left Hero Panel (Agentic AI Focus) */}
          <div className="md:col-span-5 bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
                  <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">Vigilant Agent</span>
              </div>

              <div className="space-y-3 pt-4">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-400">
                  <Bot className="w-3.5 h-3.5" /> Agentic AI Engine
                </span>
                <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                  Autonomous Multi-Modal Compliance Verification
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Powered by <strong className="text-amber-400 font-semibold">Agentic AI</strong> and multi-modal vision parsing. Vigilant Agent autonomously evaluates video frames, OCR text, and speech transcripts against strict policy benchmarks.
                </p>
              </div>
            </div>

            <div className="pt-8 relative z-10">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm space-y-1">
                <p className="text-xs font-semibold text-amber-400">🤖 Autonomous Policy Reasoning</p>
                <p className="text-[11px] text-slate-400">Performs real-time rule checks and automated evidence logging across cloud infrastructure.</p>
              </div>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="md:col-span-7 p-8 bg-[#0F172A] flex flex-col justify-center space-y-6">
            
            {/* Tab Switcher */}
            {(authMode === 'login' || authMode === 'signup') && (
              <div className="flex bg-slate-800/70 p-1 rounded-2xl border border-slate-700/60 w-full">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    authMode === 'login' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/10' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                    authMode === 'signup' 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/10' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Title Header */}
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">
                {authMode === 'login' && 'Welcome Back'}
                {authMode === 'signup' && 'Create Your Account'}
                {authMode === 'forgot' && 'Reset Password'}
                {authMode === 'reset' && 'Enter Reset Code'}
              </h3>
              <p className="text-xs text-slate-400">
                {authMode === 'login' && 'Enter your registered credentials to launch Vigilant Agent.'}
                {authMode === 'signup' && 'Register to deploy Agentic AI video compliance audits.'}
                {authMode === 'forgot' && 'Provide your email address to receive a security recovery code.'}
                {authMode === 'reset' && 'Enter the 6-character code along with your new password.'}
              </p>
            </div>

            {/* Banners */}
            {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">{authError}</div>}
            {authSuccess && <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 font-medium">{authSuccess}</div>}

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Password</label>
                    <button type="button" onClick={() => setAuthMode('forgot')} className="text-xs font-semibold text-amber-400 hover:underline">Forgot?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/15">
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                </button>
              </form>
            )}

            {/* SIGN UP FORM */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/15">
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authMode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Recovery Code'}
                </button>

                <div className="text-center pt-2">
                  <button type="button" onClick={() => setAuthMode('login')} className="text-xs text-slate-400 hover:underline">Return to Login</button>
                </div>
              </form>
            )}

            {/* RESET PASSWORD FORM */}
            {authMode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Reset Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input type="text" required value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="6-character code" className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500 font-mono" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </button>
              </form>
            )}

          </div>

        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // LOGGED-IN AUDIT WORKSPACE (Vigilant Agent Portal)
  // ------------------------------------------------------------------
  return (
    <div className="w-full max-w-7xl mx-auto my-6 flex flex-col md:flex-row gap-6 min-h-[600px] border border-slate-700/60 rounded-3xl bg-[#1E293B] overflow-hidden shadow-2xl">
      
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-[#0F172A] border-b md:border-b-0 md:border-r border-slate-700/60 p-5 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              <span className="font-bold text-base text-white">Vigilant Agent</span>
            </div>
            <button onClick={handleLogout} title="Log Out" className="p-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* User Badge */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold flex items-center justify-center text-xs">
              {user.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* History */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <History className="w-3.5 h-3.5" /> Agentic Audit History ({sessions.length})
            </div>

            <div className="space-y-1.5 max-h-[300px] md:max-h-[380px] overflow-y-auto pr-1">
              {sessions.map((sess) => (
                <button
                  key={sess.session_id}
                  onClick={() => {
                    setAuditResult({ session_id: sess.session_id, status: sess.status, final_report: sess.final_report });
                    setVideoUrl(sess.video_url);
                    setAuditStep(3);
                  }}
                  className="w-full text-left bg-slate-800/40 hover:bg-slate-800/90 border border-slate-700/50 rounded-xl p-3 text-xs transition cursor-pointer space-y-1 block"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-amber-400">{sess.session_id.slice(0, 8)}</span>
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {sess.status}
                    </span>
                  </div>
                  <p className="text-slate-300 truncate text-[11px] font-mono">{sess.video_url}</p>
                </button>
              ))}

              {sessions.length === 0 && (
                <p className="text-xs text-slate-500 px-2 py-4 text-center">No past audits for this account.</p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => { setAuditStep(1); setVideoUrl(''); setAuditResult(null); }}
          className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition cursor-pointer shadow-md shadow-amber-500/15"
        >
          <RefreshCw className="w-3.5 h-3.5" /> New Audit Request
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-8 bg-[#0F172A]">
        <div className="w-full max-w-xl bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 md:p-8 shadow-xl">
          
          {auditStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Start Agentic Video Audit</h2>
                <p className="text-slate-400 text-sm mt-1">Multi-modal extraction with autonomous policy reasoning.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-slate-300">YouTube URL</label>
                <div className="relative">
                  <Youtube className="absolute left-3.5 top-3.5 w-5 h-5 text-rose-500" />
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              <button onClick={() => setAuditStep(2)} disabled={!videoUrl.trim()} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {auditStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Confirm Agent Pipeline</h2>
                <p className="text-slate-400 text-xs mt-1">Run Agentic AI extraction and Groq compliance reasoning.</p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-xs">
                <span className="text-slate-400 font-semibold block mb-1">TARGET URL</span>
                <p className="text-amber-400 font-mono truncate">{videoUrl}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setAuditStep(1)} className="w-1/3 border border-slate-700 text-slate-300 py-2.5 rounded-xl text-xs hover:bg-slate-800">Back</button>
                <button onClick={handleRunAudit} disabled={auditLoading} className="w-2/3 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-2 cursor-pointer">
                  {auditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Agent Engine'}
                </button>
              </div>
            </div>
          )}

          {auditStep === 3 && auditResult && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700/60 pb-3">
                <h2 className="text-lg font-bold text-white">Agent Findings & Audit Log</h2>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">
                  {auditResult.session_id}
                </span>
              </div>

              <div className="bg-[#0F172A] border border-slate-700/60 rounded-xl p-4 text-xs font-mono text-slate-300 max-h-80 overflow-y-auto whitespace-pre-wrap">
                {auditResult.final_report}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}