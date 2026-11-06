import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sound } from '../services/sound';
import { getSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';
import {
  X,
  User,
  Moon,
  Shield,
  Volume2,
  Database,
  Check,
  ExternalLink,
  Save,
  Info,
  Award,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAbout?: () => void;
  onOpenFounderProfile?: () => void;
}

const AVATAR_SEEDS = ['Arafat', 'SarahChen', 'MarcusVance', 'ElenaRostova', 'Felix', 'Zoe', 'Alex', 'Nova'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAbout,
  onOpenFounderProfile,
}) => {
  const {
    currentUser,
    updateProfile,
    theme,
    setTheme,
    soundEnabled,
    setSoundEnabled,
    readReceiptsEnabled,
    setReadReceiptsEnabled,
    onlineVisibility,
    setOnlineVisibility,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'privacy' | 'database' | 'about'>('profile');

  // Profile form
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Supabase form
  const initialConfig = getSupabaseConfig();
  const [sbUrl, setSbUrl] = useState(initialConfig.url);
  const [sbKey, setSbKey] = useState(initialConfig.key);
  const [sbSaved, setSbSaved] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const avatarUrl = avatarSeed
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`
        : undefined;
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        avatarUrl,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(sbUrl, sbKey);
    setSbSaved(true);
    setTimeout(() => setSbSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Account & Platform Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-4 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-[#0866FF] text-[#0866FF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'appearance'
                ? 'border-[#0866FF] text-[#0866FF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Appearance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'privacy'
                ? 'border-[#0866FF] text-[#0866FF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Privacy & Audio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-[#0866FF] text-[#0866FF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database & Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'about'
                ? 'border-[#0866FF] text-[#0866FF]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>About</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* 1. Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bio / Status Note
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Choose Avatar Seed
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {AVATAR_SEEDS.map((seed) => (
                    <button
                      key={seed}
                      type="button"
                      onClick={() => setAvatarSeed(seed)}
                      className={`p-1 rounded-full ring-2 transition-all ${
                        avatarSeed === seed
                          ? 'ring-[#0866FF] scale-110 shadow-xs'
                          : 'ring-transparent hover:ring-slate-300'
                      }`}
                    >
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
                        alt={seed}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0866FF] hover:bg-[#0756d6] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  {profileSaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Changes Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 2. Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Application Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'light'
                      ? 'border-[#0866FF] bg-[#0866FF]/5 text-[#0866FF] font-bold shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 mx-auto mb-2 flex items-center justify-center">
                    ☀️
                  </div>
                  <span className="text-xs">Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'dark'
                      ? 'border-[#0866FF] bg-[#0866FF]/5 text-[#0866FF] font-bold shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-sky-400 mx-auto mb-2 flex items-center justify-center">
                    🌙
                  </div>
                  <span className="text-xs">Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'system'
                      ? 'border-[#0866FF] bg-[#0866FF]/5 text-[#0866FF] font-bold shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 mx-auto mb-2 flex items-center justify-center">
                    💻
                  </div>
                  <span className="text-xs">System</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. Privacy & Audio Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Online Presence Indicator
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Show your active status to fellow authorized members
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={onlineVisibility}
                  onChange={(e) => setOnlineVisibility(e.target.checked)}
                  className="w-4 h-4 text-[#0866FF] rounded-sm"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Read Receipts
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Let conversation participants know when you have seen their messages
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={readReceiptsEnabled}
                  onChange={(e) => setReadReceiptsEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#0866FF] rounded-sm"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Sound Effects & Ringtones
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Play audio chimes for incoming calls and new messages
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => sound.playMessageSound()}
                    className="text-[10px] text-[#0866FF] font-semibold hover:underline"
                  >
                    Test sound
                  </button>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="w-4 h-4 text-[#0866FF] rounded-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. Database & Cloud Tab */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                  Database & Realtime Status
                </p>
                <p className="text-[11px] leading-relaxed">
                  Private Connect is currently running with its integrated real-time WebSocket and WebRTC signaling engine on port 3000. All database migrations, tables, constraints, indexes, and Supabase Row Level Security (RLS) policies are fully defined in:
                </p>
                <code className="block my-2 p-1.5 bg-white dark:bg-slate-900 rounded-md font-mono text-[10px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  /supabase/migrations/20260101_init.sql
                </code>
              </div>

              <form onSubmit={handleSaveSupabase} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Anon Key
                  </label>
                  <input
                    type="password"
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                  />
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0866FF] hover:bg-[#0756d6] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  {sbSaved ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Configuration Saved</span>
                    </>
                  ) : (
                    <span>Save Supabase Credentials</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* 5. About Private Connect Tab */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Product Banner */}
              <div className="p-4 bg-gradient-to-br from-[#0866FF]/10 via-[#0084FF]/5 to-transparent dark:from-slate-800/60 dark:to-slate-850 rounded-2xl border border-[#0866FF]/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0866FF] flex items-center justify-center text-white shadow-md shadow-[#0866FF]/30">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        Private Connect
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0866FF]/10 dark:bg-[#0866FF]/20 text-[#0866FF]">
                        v2.4.0
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your Space. Your Conversations.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenAbout && (
                    <button
                      type="button"
                      onClick={onOpenAbout}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 shadow-2xs transition-all"
                    >
                      <Info className="w-3.5 h-3.5 text-[#0866FF]" />
                      <span>About App</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Founder Spotlight Card */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Founder & Developer Identity</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Platform Creator
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Arafat"
                      alt="Arafat Sani"
                      className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Arafat Sani
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                          FOUNDER
                        </span>
                      </div>
                      <p className="text-xs font-medium text-[#0866FF]">
                        Founder & Lead Developer
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Product Development, Technical Architecture and Platform Management
                      </p>
                    </div>
                  </div>

                  {onOpenFounderProfile && (
                    <button
                      type="button"
                      onClick={onOpenFounderProfile}
                      className="px-3 py-1.5 bg-[#0866FF] hover:bg-[#0756d6] text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-xs transition-colors shrink-0"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Profile</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Developer Attribution & Architecture */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Developer Credit
                  </span>
                  <span className="font-bold text-[#0866FF]">
                    Designed & Developed by Arafat Sani
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Security Architecture</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    PostgreSQL RLS + WebSockets + WebRTC
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Membership System</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Strict Approval & Admin Control
                  </span>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-2 text-center text-[11px] text-slate-400 space-y-0.5">
                <p>© 2026 Private Connect. All Rights Reserved.</p>
                <p className="font-medium text-slate-500 dark:text-slate-400">
                  Developed by Arafat Sani
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
