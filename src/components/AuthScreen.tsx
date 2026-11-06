import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Lock,
  Shield,
  ArrowRight,
  UserCheck,
  Key,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Ban,
  ShieldAlert,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, register, pendingUser, checkPendingStatus, clearPendingUser } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');

  // Register state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Quick account presets for instant testing
  const presets = [
    {
      name: 'Arafat Sani',
      roleTitle: 'Founder & Lead Dev',
      cred: 'arafat@privateconnect.internal',
      pass: 'admin123',
      role: 'founder',
      avatar: 'ArafatSani',
    },
    {
      name: 'Sarah Chen',
      roleTitle: 'Team Member',
      cred: 'sarah.chen@privateconnect.internal',
      pass: 'member123',
      role: 'member',
      avatar: 'SarahChen',
    },
    {
      name: 'Marcus Vance',
      roleTitle: 'Team Member',
      cred: 'marcus.vance@privateconnect.internal',
      pass: 'member123',
      role: 'member',
      avatar: 'MarcusVance',
    },
    {
      name: 'Elena Rostova',
      roleTitle: 'Team Member',
      cred: 'elena.rostova@privateconnect.internal',
      pass: 'member123',
      role: 'member',
      avatar: 'ElenaRostova',
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const res = await login(credential, password);
    setIsLoading(false);
    if (!res.success) {
      if (res.status === 'pending') {
        // Handled via pendingUser state
        return;
      }
      setError(res.error || 'Failed to sign in');
    }
  };

  const handleQuickLogin = async (cred: string, pass: string) => {
    setCredential(cred);
    setPassword(pass);
    setError(null);
    setIsLoading(true);
    const res = await login(cred, pass);
    setIsLoading(false);
    if (!res.success && res.status !== 'pending') {
      setError(res.error || 'Quick login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const res = await register({
      displayName,
      username,
      email,
      password: regPassword,
      inviteCode: inviteCode || undefined,
    });

    setIsLoading(false);
    if (res.success) {
      setSuccessMsg(res.message || 'Registration complete! Logging in...');
    } else if (res.status === 'pending') {
      // Pending screen is now mounted via pendingUser
      return;
    } else {
      setError(res.error || 'Registration failed');
    }
  };

  const handleCheckStatus = async () => {
    setIsCheckingStatus(true);
    setStatusMessage(null);
    const isApproved = await checkPendingStatus();
    setIsCheckingStatus(false);
    if (isApproved) {
      setStatusMessage('Congratulations! Your account was approved. Please sign in.');
    } else {
      setStatusMessage('Account is still awaiting clearance from Founder Arafat Sani or administrators.');
    }
  };

  // -------------------------------------------------------------
  // DEDICATED PENDING APPROVAL / REJECTED SCREEN
  // -------------------------------------------------------------
  if (pendingUser) {
    const isPending = pendingUser.status === 'pending';
    const isRejected = pendingUser.status === 'rejected';
    const isSuspended = pendingUser.status === 'suspended';

    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-[#F5F7FB] dark:bg-slate-950 font-sans selection:bg-[#0866FF]/20 selection:text-[#0866FF]">
        {/* Brand Emblem */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 bg-[#0866FF] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#0866FF]/25 mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Private Connect
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Your Space. Your Conversations.
          </p>
        </div>

        {/* Status Card */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xs">
            {isPending && (
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
            )}
            {isRejected && (
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Ban className="w-8 h-8" />
              </div>
            )}
            {isSuspended && (
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Heading */}
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">
            {isPending && 'Your account is awaiting approval.'}
            {isRejected && 'Registration Request Denied'}
            {isSuspended && 'Account Suspended'}
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {isPending &&
              'Private Connect is an exclusive, invite-only communication space. Your registration has been submitted to Founder Arafat Sani and platform administrators. You will be granted access once your membership is cleared.'}
            {isRejected &&
              'Your membership request was reviewed and could not be approved by the platform administrators at this time.'}
            {isSuspended &&
              'This account has been temporarily suspended by an administrator. Please contact your organization administrator.'}
          </p>

          {/* User Account Info Chip */}
          <div className="my-5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Registered Profile
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                  isPending
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : isRejected
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                }`}
              >
                {pendingUser.status}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {pendingUser.displayName}
            </p>
            <p className="text-[11px] text-slate-500">
              @{pendingUser.username} {pendingUser.email ? `· ${pendingUser.email}` : ''}
            </p>
          </div>

          {/* Status Message if refreshed */}
          {statusMessage && (
            <div className="p-3 mb-4 rounded-xl text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-100 dark:border-blue-900/50">
              {statusMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {isPending && (
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
                className="w-full py-2.5 bg-[#0866FF] hover:bg-[#0756d6] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0866FF]/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                <span>{isCheckingStatus ? 'Checking Status...' : 'Check Approval Status'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={clearPendingUser}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Sign In with Another Account
            </button>
          </div>

          {/* Footer Developer Credit */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              © 2026 Private Connect. All Rights Reserved.
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Developed by Arafat Sani
            </p>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STANDARD SIGN IN / REGISTER FORM
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-[#F5F7FB] dark:bg-slate-950 font-sans selection:bg-[#0866FF]/20 selection:text-[#0866FF]">
      {/* Brand & Emblem */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-14 h-14 bg-[#0866FF] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#0866FF]/25 mb-3">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Private Connect
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Your Space. Your Conversations.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-700 text-[#0866FF] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-colors ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-700 text-[#0866FF] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Login Form */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email or Username
              </label>
              <input
                type="text"
                required
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="arafat@privateconnect.internal"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF] focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF] focus:bg-white dark:focus:bg-slate-900 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#0866FF] hover:bg-[#0756d6] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0866FF]/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* 2. Register Form */
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Choose strong password"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Invitation Code
                </label>
                <span className="text-[10px] text-[#0866FF]">Try: CONNECT-VIP-2026</span>
              </div>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="CONNECT-VIP-2026"
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Valid code grants instant clearance. Without code, account requires review by Founder Arafat Sani.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-2 bg-[#0866FF] hover:bg-[#0756d6] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0866FF]/20 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <span>{isLoading ? 'Registering...' : 'Request Private Access'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Quick Demo Accounts Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-3">
            Quick 1-Click Multi-User Demo Switcher
          </p>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((p) => (
              <button
                key={p.cred}
                type="button"
                onClick={() => handleQuickLogin(p.cred, p.pass)}
                className={`flex items-center gap-2 p-2 rounded-xl border transition-colors text-left ${
                  p.role === 'founder'
                    ? 'border-amber-400/60 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-500'
                    : 'border-slate-200/80 dark:border-slate-700 hover:border-[#0866FF] hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.avatar}`}
                  alt={p.name}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {p.name}
                    </p>
                  </div>
                  <p className={`text-[9px] font-medium capitalize truncate ${p.role === 'founder' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'}`}>
                    {p.roleTitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Developer Credit on Login Page */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            © 2026 Private Connect. All Rights Reserved.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            Designed & Developed by Arafat Sani
          </p>
        </div>
      </div>
    </div>
  );
};
