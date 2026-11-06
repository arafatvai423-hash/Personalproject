import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import {
  X,
  Shield,
  Award,
  Code,
  Globe,
  Github,
  Mail,
  Camera,
  Image as ImageIcon,
  Check,
  Save,
  Lock,
} from 'lucide-react';

interface FounderProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FounderProfileModal: React.FC<FounderProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, isFounder } = useAuth();

  const [founderData, setFounderData] = useState<any>(null);
  const [displayName, setDisplayName] = useState('Arafat Sani');
  const [founderTitle, setFounderTitle] = useState('Founder & Lead Developer');
  const [responsibility, setResponsibility] = useState('Product Development, Technical Architecture and Platform Management.');
  const [bio, setBio] = useState('Founder & Lead Developer of Private Connect. Architect of secure real-time messaging, WebRTC calling, and private group governance.');
  const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=ArafatSani');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
  const [website, setWebsite] = useState('https://privateconnect.internal');
  const [github, setGithub] = useState('https://github.com');
  const [email, setEmail] = useState('arafat@privateconnect.internal');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    api
      .getFounderProfile()
      .then((res) => {
        if (res.founder) {
          setFounderData(res.founder);
          setDisplayName(res.founder.displayName || 'Arafat Sani');
          setFounderTitle(res.founder.founderTitle || 'Founder & Lead Developer');
          setResponsibility(res.founder.responsibility || 'Product Development, Technical Architecture and Platform Management.');
          setBio(res.founder.bio || '');
          if (res.founder.avatarUrl) setAvatarUrl(res.founder.avatarUrl);
          if (res.founder.coverUrl) setCoverUrl(res.founder.coverUrl);
          if (res.founder.contactLinks?.website) setWebsite(res.founder.contactLinks.website);
          if (res.founder.contactLinks?.github) setGithub(res.founder.contactLinks.github);
          if (res.founder.contactLinks?.email) setEmail(res.founder.contactLinks.email);
        }
      })
      .catch((err) => {
        console.error('Failed to load founder profile:', err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFounder) return;

    try {
      setIsSaving(true);
      await api.updateFounderProfile({
        displayName,
        founderTitle,
        responsibility,
        bio,
        avatarUrl,
        coverUrl,
        contactLinks: {
          website,
          github,
          email,
        },
      });
      setSavedSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update founder profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cover Header */}
        <div className="relative h-36 sm:h-44 w-full bg-slate-900 overflow-hidden">
          <img
            src={coverUrl}
            alt="Founder Cover"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-xs transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Edit Cover Trigger for Founder */}
          {isFounder && isEditing && (
            <div className="absolute bottom-3 right-4">
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg backdrop-blur-xs cursor-pointer transition-colors">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Change Cover</span>
                <input
                  type="text"
                  placeholder="Cover image URL"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-6 pt-0 relative flex-1 overflow-y-auto">
          {/* Avatar & Badges */}
          <div className="flex items-end justify-between -mt-14 mb-4">
            <div className="relative">
              <img
                src={avatarUrl}
                alt="Arafat Sani"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl bg-white dark:bg-slate-800"
              />
              <div
                className="absolute bottom-0 right-0 p-1.5 bg-amber-500 text-slate-950 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-md"
                title="Verified Founder"
              >
                <Award className="w-4 h-4 fill-slate-950 text-slate-950" />
              </div>
            </div>

            {/* Actions for Founder */}
            {isFounder ? (
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-xl transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
                <Shield className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Verified Founder</span>
              </div>
            )}
          </div>

          {/* Form or View Mode */}
          {isEditing && isFounder ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Founder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Official Title
                  </label>
                  <input
                    type="text"
                    required
                    value={founderTitle}
                    onChange={(e) => setFounderTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Core Responsibility
                </label>
                <input
                  type="text"
                  value={responsibility}
                  onChange={(e) => setResponsibility(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Founder Bio & Mission
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Avatar Seed / URL
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cover Banner URL
                  </label>
                  <input
                    type="text"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#0866FF] hover:bg-[#0756d6] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Founder Profile'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 text-slate-800 dark:text-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-950 dark:text-white">
                    {displayName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    {founderTitle}
                  </span>
                </div>
                <p className="text-xs text-[#0866FF] font-semibold mt-0.5">
                  Private Connect · Project Founder
                </p>
              </div>

              {/* Responsibilities */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Mandate & Responsibility
                </p>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  {responsibility}
                </p>
              </div>

              {/* Bio */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Founder Note
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {bio}
                </p>
              </div>

              {/* Developer Credit & Copyright */}
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-[#0866FF]" />
                  <span className="text-xs font-bold text-blue-950 dark:text-blue-100">
                    Designed & Developed by Arafat Sani
                  </span>
                </div>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                  Private Connect
                </span>
              </div>

              {/* Contact Links */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-[#0866FF] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email Founder</span>
                  </a>
                )}
                {github && (
                  <a
                    href={github}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-[#0866FF] transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
                {website && (
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-[#0866FF] transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Platform</span>
                  </a>
                )}
              </div>

              {/* Notice */}
              <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400 italic">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Verified by Private Connect Cryptographic Identity & Authorization System</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
