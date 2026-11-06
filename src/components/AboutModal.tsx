import React from 'react';
import {
  X,
  Lock,
  Shield,
  Code,
  Award,
  Globe,
  Github,
  Mail,
  Cpu,
  Server,
  Layers,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFounderProfile?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, onOpenFounderProfile }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0866FF] text-white rounded-xl flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                About Private Connect
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">v2.4.0 · Production</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800 dark:text-slate-200">
          {/* Hero Branding */}
          <div className="text-center pb-2">
            <h3 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Private Connect
            </h3>
            <p className="text-xs text-[#0866FF] font-semibold mt-0.5">
              Your Space. Your Conversations.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              An exclusive, production-grade private communication platform engineered for secure 1-on-1 chats, group channels, peer-to-peer WebRTC voice/video calls, and granular membership governance.
            </p>
          </div>

          {/* Founder Showcase Card */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 shadow-xs">
            {/* Cover Banner */}
            <div className="h-20 w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            </div>

            {/* Profile Content */}
            <div className="px-5 pb-5 pt-0 relative">
              <div className="flex items-end justify-between -mt-10 mb-3">
                <div className="relative">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=ArafatSani"
                    alt="Arafat Sani"
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-slate-900 shadow-md bg-white dark:bg-slate-800"
                  />
                  <div
                    className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-slate-950 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-xs"
                    title="Verified Founder"
                  >
                    <Award className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  </div>
                </div>

                {/* Founder Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/15 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
                  <Shield className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>Founder & Lead Developer</span>
                </div>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-slate-950 dark:text-white">
                  Arafat Sani
                </h4>
                <p className="text-xs font-semibold text-[#0866FF]">
                  Founder & Lead Developer
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Responsible for Product Development, Technical Architecture and Platform Management.
                </p>
              </div>

              {/* Developer Credit Callout */}
              <div className="mt-3.5 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200">
                <Code className="w-4 h-4 text-[#0866FF] shrink-0" />
                <span className="font-semibold text-[11px]">
                  Designed & Developed by Arafat Sani
                </span>
              </div>

              {/* Contact Links */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <a
                  href="mailto:arafat@privateconnect.internal"
                  className="flex items-center gap-1 hover:text-[#0866FF] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Contact Founder</span>
                </a>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-[11px] text-slate-400">Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="space-y-2.5">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Architecture & Stack
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-bold text-[11px]">Node.js & WebSockets</p>
                  <p className="text-[10px] text-slate-400">Instant bidirectional events</p>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#0866FF] shrink-0" />
                <div>
                  <p className="font-bold text-[11px]">WebRTC Peer Calling</p>
                  <p className="text-[10px] text-slate-400">Audio/Video streaming</p>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <p className="font-bold text-[11px]">PostgreSQL & Supabase</p>
                  <p className="text-[10px] text-slate-400">Row Level Security (RLS)</p>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="font-bold text-[11px]">Founder Governance</p>
                  <p className="text-[10px] text-slate-400">Strict member clearance</p>
                </div>
              </div>
            </div>
          </div>

          {/* Official Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              © 2026 Private Connect. All Rights Reserved.
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              Developed by Arafat Sani
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
