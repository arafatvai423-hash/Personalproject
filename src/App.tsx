/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider, useChat } from './contexts/ChatContext';
import { CallProvider } from './contexts/CallContext';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { RightPanel } from './components/RightPanel';
import { CallModal } from './components/CallModal';
import { NewChatModal } from './components/NewChatModal';
import { AdminDashboard } from './components/AdminDashboard';
import { SettingsModal } from './components/SettingsModal';
import { AuthScreen } from './components/AuthScreen';
import { AboutModal } from './components/AboutModal';
import { FounderProfileModal } from './components/FounderProfileModal';

const MainAppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isRightPanelOpen, activeConversationId } = useChat();

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isFounderProfileOpen, setIsFounderProfileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F5F7FB] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#0866FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Connecting to Private Space...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#F5F7FB] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Left Sidebar */}
      <Sidebar
        onOpenNewChat={() => setIsNewChatOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenFounderProfile={() => setIsFounderProfileOpen(true)}
      />

      {/* Center Chat Window */}
      <main
        className={`flex-1 h-full min-w-0 ${
          activeConversationId ? 'flex' : 'hidden md:flex'
        }`}
      >
        <ChatWindow />
      </main>

      {/* Right Panel (Desktop only or when opened) */}
      {isRightPanelOpen && activeConversationId && (
        <div className="hidden lg:block h-full">
          <RightPanel />
        </div>
      )}

      {/* Modals & Overlays */}
      <CallModal />

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />

      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onOpenFounderProfile={() => setIsFounderProfileOpen(true)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenFounderProfile={() => setIsFounderProfileOpen(true)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onOpenFounderProfile={() => {
          setIsAboutOpen(false);
          setIsFounderProfileOpen(true);
        }}
      />

      <FounderProfileModal
        isOpen={isFounderProfileOpen}
        onClose={() => setIsFounderProfileOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <CallProvider>
          <MainAppLayout />
        </CallProvider>
      </ChatProvider>
    </AuthProvider>
  );
}
