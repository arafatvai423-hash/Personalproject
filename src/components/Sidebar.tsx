import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  Plus,
  Shield,
  Settings,
  LogOut,
  Moon,
  Sun,
  Lock,
  VolumeX,
  Users,
  MessageCircle,
  Archive,
  Info,
  Award,
} from 'lucide-react';

interface SidebarProps {
  onOpenNewChat: () => void;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenFounderProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewChat,
  onOpenAdmin,
  onOpenSettings,
  onOpenAbout,
  onOpenFounderProfile,
}) => {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    searchFilter,
    setSearchFilter,
    activeCategory,
    setActiveCategory,
    isLoadingConversations,
  } = useChat();
  const { currentUser, theme, setTheme, logout } = useAuth();

  const [showUserMenu, setShowUserMenu] = useState(false);

  // Format relative timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHour = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m`;
      if (diffHour < 24) return `${diffHour}h`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Category filter
    if (activeCategory === 'direct' && c.isGroup) return false;
    if (activeCategory === 'groups' && !c.isGroup) return false;
    if (activeCategory === 'archived' && !c.isArchived) return false;
    if (activeCategory !== 'archived' && c.isArchived) return false;

    // Search query filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const nameMatch = c.isGroup
        ? c.name?.toLowerCase().includes(q)
        : c.members.some((m) => m.profile?.displayName.toLowerCase().includes(q) || m.profile?.username.toLowerCase().includes(q));
      const messageMatch = c.lastMessage?.content.toLowerCase().includes(q);
      return nameMatch || messageMatch;
    }

    return true;
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <aside
      className={`w-full md:w-80 lg:w-96 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 ${
        activeConversationId ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#0866FF] text-white rounded-xl flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  Private Connect
                </span>
                {totalUnread > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#0866FF] text-white rounded-full">
                    {totalUnread}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Your Space. Your Conversations.</p>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={onOpenNewChat}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-[#0866FF] hover:text-white dark:hover:bg-[#0866FF] text-slate-700 dark:text-slate-300 rounded-full transition-colors shadow-2xs"
            title="Start new conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* User Card & Quick Controls */}
        <div className="mt-3.5 flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={currentUser?.role === 'founder' ? onOpenFounderProfile : onOpenSettings}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition-opacity"
            title={currentUser?.role === 'founder' ? 'View Founder Profile' : 'View Profile'}
          >
            <div className="relative">
              <img
                src={
                  currentUser?.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.id}`
                }
                alt="user"
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
              {currentUser?.role === 'founder' ? (
                <span
                  className="absolute -bottom-1 -right-1 p-0.5 bg-amber-500 text-slate-950 rounded-full ring-1 ring-white dark:ring-slate-800"
                  title="Verified Founder"
                >
                  <Award className="w-2.5 h-2.5 fill-slate-950 text-slate-950" />
                </span>
              ) : (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {currentUser?.displayName}
                </p>
                {currentUser?.role === 'founder' && (
                  <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-extrabold tracking-wide uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                    Founder
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="capitalize">{currentUser?.role === 'founder' ? 'Founder & Lead Dev' : currentUser?.role}</span>
                <span>·</span>
                <span className="truncate">@{currentUser?.username}</span>
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1">
            {/* Admin / Founder Dashboard */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'founder') && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                title={currentUser?.role === 'founder' ? 'Founder Administration Console' : 'Admin Console'}
              >
                <Shield className="w-4 h-4" />
              </button>
            )}

            {/* About Application */}
            <button
              type="button"
              onClick={onOpenAbout}
              className="p-1.5 text-slate-500 hover:text-[#0866FF] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="About Private Connect"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Toggle appearance"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 rounded-xl outline-hidden focus:border-[#0866FF] dark:focus:border-[#0866FF] transition-colors"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 mt-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`flex-1 py-1 rounded-md transition-colors ${
              activeCategory === 'all'
                ? 'bg-white dark:bg-slate-700 text-[#0866FF] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('direct')}
            className={`flex-1 py-1 rounded-md transition-colors ${
              activeCategory === 'direct'
                ? 'bg-white dark:bg-slate-700 text-[#0866FF] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Direct
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('groups')}
            className={`flex-1 py-1 rounded-md transition-colors ${
              activeCategory === 'groups'
                ? 'bg-white dark:bg-slate-700 text-[#0866FF] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Groups
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('archived')}
            className={`flex-1 py-1 rounded-md transition-colors ${
              activeCategory === 'archived'
                ? 'bg-white dark:bg-slate-700 text-[#0866FF] dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Conversations Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
        {isLoadingConversations ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-[#0866FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-xs text-slate-400 italic">No conversations found</p>
            <button
              type="button"
              onClick={onOpenNewChat}
              className="mt-3 text-xs text-[#0866FF] font-semibold hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            const peer = conv.isGroup
              ? null
              : conv.members.find((m) => m.userId !== currentUser?.id)?.profile;

            // Generate snippet preview
            let snippet = 'No messages yet';
            if (conv.lastMessage) {
              if (conv.lastMessage.isDeleted) {
                snippet = 'Message was deleted';
              } else if (conv.lastMessage.messageType === 'voice') {
                snippet = '🎤 Voice message';
              } else if (conv.lastMessage.messageType === 'image') {
                snippet = '📷 Photo';
              } else if (conv.lastMessage.messageType === 'video') {
                snippet = '🎥 Video';
              } else if (conv.lastMessage.messageType === 'file') {
                snippet = '📎 File attachment';
              } else {
                snippet = conv.lastMessage.content;
              }

              // Add prefix if you sent it
              if (conv.lastMessage.senderId === currentUser?.id) {
                snippet = `You: ${snippet}`;
              }
            }

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left p-3 sm:px-4 flex items-center gap-3 transition-colors ${
                  isSelected
                    ? 'bg-[#0866FF]/10 dark:bg-[#0866FF]/20 border-l-4 border-[#0866FF]'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Conversation Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={
                      conv.isGroup
                        ? conv.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.id}`
                        : peer?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peer?.id}`
                    }
                    alt="avatar"
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shadow-2xs"
                  />
                  {!conv.isGroup && peer?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>

                {/* Info & Last Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {conv.isGroup ? conv.name : peer?.displayName || 'User'}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${conv.unreadCount ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {snippet}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {conv.isMuted && (
                        <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      {conv.unreadCount ? (
                        <span className="px-1.5 py-0.2 bg-[#0866FF] text-white text-[10px] font-bold rounded-full min-w-4 text-center">
                          {conv.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Application Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center shrink-0 bg-slate-50/60 dark:bg-slate-900/60">
        <p className="text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
          © 2026 Private Connect. All Rights Reserved.
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
          Developed by Arafat Sani
        </p>
      </div>
    </aside>
  );
};
