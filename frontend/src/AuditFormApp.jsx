import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { z } from 'zod';
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

// Zod Schemas for Client-side Validation
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.')
});

const signupSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters long.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.')
});

const urlSchema = z.string().url('Please enter a valid YouTube URL.').refine(
  val => val.includes('youtube.com') || val.includes('youtu.be'),
  'Must be a valid YouTube link.'
);

export default function AuditFormApp() {
  // Authentication State
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('guardian_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup' | 'forgot' | 'reset'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Workspace Audit State
  const [sessions, setSessions] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [auditStep, setAuditStep] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  const fetchHistory = async (userEmail) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/sessions?email=${encodeURIComponent(userEmail)}`);
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load audit history:', err);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchHistory(user.email);
    }
  }, [user]);

  // Auth Handlers
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError(''); setAuthSuccess('');

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setAuthError(validation.error.errors[0].message);
      return;
    }

    setAuthLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      setUser(res.data.user);
      localStorage.setItem('guardian_user', JSON.stringify(res.data.user));
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Invalid email or password.');
    } finally { 
      setAuthLoading(false); 
    }
  };

  const handleSignUp = async (e) => {
    if (e) e.preventDefault();
    setAuthError(''); setAuthSuccess('');

    const validation = signupSchema.safeParse({ full_name: fullName, email, password });
    if (!validation.success) {
      setAuthError(validation.error.errors[0].message);
      return;
    }

    setAuthLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/signup`, { full_name: fullName, email, password });
      setAuthSuccess('Account created successfully! Please log in.');
      setAuthMode('login');
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    setAuthError(''); setAuthSuccess('');
    setAuthLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
      setAuthSuccess(res.data.message);
      if (res.data.demo_reset_code) {
        setResetToken(res.data.demo_reset_code);
        setAuthMode('reset');
      }
    } catch (err) {
      setAuthError('Error initiating password reset.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    setAuthError(''); setAuthSuccess('');
    setAuthLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, {
        email,
        token: resetToken,
        new_password: newPassword
      });
      setAuthSuccess('Password reset successfully! Please sign in with your new password.');
      setAuthMode('login');
    } catch (err) {
      setAuthError(err.response?.data?.detail || 'Password reset failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('guardian_user');
    setAuditResult(null);
    setSessions([]);
  };

  // Run Video Audit
  const handleRunAudit = async () => {
    const urlValidation = urlSchema.safeParse(videoUrl);
    if (!urlValidation.success) {
      alert(urlValidation.error.errors[0].message);
      return;
    }

    setAuditLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/audit`, { email: user.email, video_url: videoUrl });
      setAuditResult(res.data);
      setAuditStep(3);
      fetchHistory(user.email);
    } catch (err) {
      alert(err.response?.data?.detail || 'Audit pipeline request failed.');
    } finally {
      setAuditLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // RENDER AUTHENTICATION SCREENS (Sign In / Sign Up / Forgot Password)
  // ------------------------------------------------------------------
  if (!user) {
    return (
      <div className="w-full max-w-4xl mx-auto my-8 p-4">
        <div className="grid grid-cols-1 md:grid-cols-12 bg-[#1E293B] border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Left Hero Panel */}
          <div className="md:col-span-5 bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-900 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700/60 relative overflow-hidden">
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
                  Real-time video compliance verification powered by <strong className="text-amber-400 font-semibold">Agentic AI reasoning</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Right Form Container */}
          <div className="md:col-span-7 p-8 bg-[#0F172A] flex flex-col justify-center space-y-6">
            
            {/* Feedback Messages */}
            {authError && <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 font-medium">{authError}</div>}
            {authSuccess && <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-medium">{authSuccess}</div>}

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">Sign In to Console</h3>
                  <p className="text-xs text-slate-400">Enter your credentials to launch Vigilant Agent.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Password</label>
                      <button type="button" onClick={() => { setAuthError(''); setAuthSuccess(''); setAuthMode('forgot'); }} className="text-xs text-amber-400 hover:underline cursor-pointer">Forgot password?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>

                  <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                  </button>
                </form>

                <p className="text-center text-xs text-slate-400">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setAuthError(''); setAuthSuccess(''); setAuthMode('signup'); }} className="text-amber-400 font-semibold hover:underline cursor-pointer">Sign Up</button>
                </p>
              </div>
            )}

            {/* SIGN UP FORM */}
            {authMode === 'signup' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">Create an Account</h3>
                  <p className="text-xs text-slate-400">Register to start performing automated video audits.</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dev Sahu" className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>

                  <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                  </button>
                </form>

                <p className="text-center text-xs text-slate-400">
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setAuthError(''); setAuthSuccess(''); setAuthMode('login'); }} className="text-amber-400 font-semibold hover:underline cursor-pointer">Sign In</button>
                </p>
              </div>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authMode === 'forgot' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">Reset Password</h3>
                  <p className="text-xs text-slate-400">Enter your email to receive a password reset code.</p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>

                  <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Code'}
                  </button>
                </form>

                <p className="text-center text-xs text-slate-400">
                  Remembered your password?{' '}
                  <button type="button" onClick={() => { setAuthError(''); setAuthSuccess(''); setAuthMode('login'); }} className="text-amber-400 font-semibold hover:underline cursor-pointer">Back to Sign In</button>
                </p>
              </div>
            )}

            {/* RESET PASSWORD FORM */}
            {authMode === 'reset' && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white tracking-tight">Set New Password</h3>
                  <p className="text-xs text-slate-400">Enter your reset code and choose a new password.</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Reset Token / Code</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="text" required value={resetToken} onChange={e => setResetToken(e.target.value)} placeholder="6-character code" className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500" />
                    </div>
                  </div>

                  <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                  </button>
                </form>
              </div>
            )}

          </div>

        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // AUDIT WORKSPACE SCREEN
  // ------------------------------------------------------------------
  return (
    <div className="w-full max-w-7xl mx-auto my-6 flex flex-col md:flex-row gap-6 min-h-[600px] border border-slate-700/60 rounded-3xl bg-[#1E293B] overflow-hidden shadow-2xl">
      
      {/* Left Sidebar */}
      <aside className="w-full md:w-80 bg-[#0F172A] border-b md:border-b-0 md:border-r border-slate-700/60 p-5 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          
          {/* Brand & Active User Account Info Bar */}
          <div className="space-y-3 pb-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-amber-500" />
                <span className="font-bold text-base text-white">Vigilant Agent</span>
              </div>
              
              {/* Logout Button */}
              <button 
                onClick={handleLogout} 
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Active User Email & Badge Display */}
            {user && (
              <div className="flex items-center gap-2.5 px-2.5 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center uppercase">
                  {user.full_name ? user.full_name[0] : user.email[0]}
                </div>
                <div className="flex-1 min-w-0">
                  {user.full_name && (
                    <p className="text-xs font-semibold text-slate-200 truncate">{user.full_name}</p>
                  )}
                  <p className="text-[11px] font-mono text-amber-400/90 truncate">{user.email}</p>
                </div>
              </div>
            )}
          </div>

          {/* Past Audits History List */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <History className="w-3.5 h-3.5" /> Past Audits ({sessions.length})
            </div>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {sessions.map((sess) => (
                <button
                  key={sess.session_id}
                  onClick={() => {
                    setAuditResult({ session_id: sess.session_id, status: sess.status, final_report: sess.final_report });
                    setVideoUrl(sess.video_url);
                    setAuditStep(3);
                  }}
                  className="w-full text-left bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 rounded-xl p-3 text-xs block transition"
                >
                  <span className="font-mono text-[10px] text-amber-400">{sess.session_id.slice(0, 8)}</span>
                  <p className="text-slate-300 truncate text-[11px] font-mono">{sess.video_url}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => { setAuditStep(1); setVideoUrl(''); setAuditResult(null); }}
          className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs transition hover:brightness-110 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> New Audit Request
        </button>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex items-center justify-center p-6 bg-[#0F172A]">
        <div className="w-full max-w-xl bg-[#1E293B] border border-slate-700/60 rounded-2xl p-6 md:p-8 shadow-xl">
          
          {/* STEP 1: Enter Video URL */}
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

              <button 
                onClick={() => setAuditStep(2)} 
                disabled={!videoUrl.trim()} 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition hover:brightness-110 cursor-pointer disabled:opacity-50"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: Confirm & Launch Pipeline */}
          {auditStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white">Confirm Agent Pipeline</h2>
                <p className="text-slate-400 text-xs mt-1">Run Agentic AI extraction and Groq compliance reasoning.</p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 text-xs">
                <span className="text-slate-400 font-semibold block mb-1">TARGET URL</span>
                <p className="text-amber-400 font-mono truncate">{videoUrl}</p>
              </div>

              {auditLoading && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Agentic Compliance Orchestration Engine...</span>
                </div>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => setAuditStep(1)} 
                  className="w-1/3 border border-slate-700 text-slate-300 py-2.5 rounded-xl text-xs hover:bg-slate-800 transition cursor-pointer"
                >
                  Back
                </button>
                <button 
                  onClick={handleRunAudit} 
                  disabled={auditLoading} 
                  className="w-2/3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex justify-center items-center gap-2 transition hover:brightness-110 cursor-pointer"
                >
                  {auditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Run Agent Engine'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Render Final Audit Report */}
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