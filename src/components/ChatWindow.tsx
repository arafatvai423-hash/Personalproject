import React, { useRef, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useCall } from '../contexts/CallContext';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import {
  Phone,
  Video,
  Info,
  Search,
  ChevronLeft,
  Lock,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

export const ChatWindow: React.FC = () => {
  const {
    activeConversation,
    messages,
    isLoadingMessages,
    typingUsers,
    isRightPanelOpen,
    setIsRightPanelOpen,
    searchInChatQuery,
    setSearchInChatQuery,
    selectConversation,
  } = useChat();
  const { currentUser } = useAuth();
  const { startCall } = useCall();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  if (!activeConversation) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-[#F5F7FB] dark:bg-slate-950">
        <div className="w-16 h-16 bg-[#0866FF]/10 text-[#0866FF] rounded-2xl flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Private Connect</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
          Select a conversation from the sidebar or start a new private discussion.
        </p>
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Restricted & Authorized Team Access</span>
        </div>
      </div>
    );
  }

  const isGroup = activeConversation.isGroup;
  const peer = isGroup
    ? null
    : activeConversation.members.find((m) => m.userId !== currentUser?.id)?.profile || null;

  // Filter messages if search inside chat is active
  const filteredMessages = searchInChatQuery
    ? messages.filter((m) =>
        m.content.toLowerCase().includes(searchInChatQuery.toLowerCase())
      )
    : messages;

  return (
    <div className="flex-1 h-full flex flex-col bg-[#F5F7FB] dark:bg-slate-950 relative overflow-hidden">
      {/* Top Chat Header */}
      <header className="h-16 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          <button
            type="button"
            onClick={() => selectConversation(null)}
            className="md:hidden p-1.5 -ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Avatar */}
          <div className="relative shrink-0">
            <img
              src={
                isGroup
                  ? activeConversation.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${activeConversation.id}`
                  : peer?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peer?.id}`
              }
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
            {!isGroup && peer?.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </div>

          {/* Conversation Title & Presence */}
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {isGroup ? activeConversation.name : peer?.displayName || 'User'}
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
              {isGroup ? (
                <span>{activeConversation.members.length} members</span>
              ) : peer?.isOnline ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active now</span>
              ) : (
                <span>Private Member</span>
              )}
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {!isGroup && peer && (
            <>
              {/* Voice Call Button */}
              <button
                type="button"
                onClick={() => startCall(peer, 'voice', activeConversation.id)}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-[#0866FF] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Start voice call"
              >
                <Phone className="w-5 h-5" />
              </button>

              {/* Video Call Button */}
              <button
                type="button"
                onClick={() => startCall(peer, 'video', activeConversation.id)}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-[#0866FF] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                title="Start video call"
              >
                <Video className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Toggle Details Panel */}
          <button
            type="button"
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className={`p-2.5 rounded-full transition-colors ${
              isRightPanelOpen
                ? 'text-[#0866FF] bg-[#0866FF]/10'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Conversation information"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Search in chat banner */}
      {searchInChatQuery && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <span>
            Filtering messages matching: <strong>"{searchInChatQuery}"</strong> ({filteredMessages.length} results)
          </span>
          <button
            type="button"
            onClick={() => setSearchInChatQuery('')}
            className="font-medium underline hover:text-amber-700"
          >
            Clear
          </button>
        </div>
      )}

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* End-to-end Privacy Notice Banner */}
        <div className="flex flex-col items-center justify-center my-4 text-center">
          <div className="p-2 bg-slate-200/60 dark:bg-slate-800 rounded-full mb-2">
            <Lock className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm">
            Messages and calls are private to members of this group. No unauthorized access permitted.
          </p>
        </div>

        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#0866FF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs italic">
            No messages yet. Send a greeting to begin!
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const prevMsg = filteredMessages[idx - 1];
            const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isGroup={isGroup}
                showSender={showSender}
              />
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-slate-500 dark:text-slate-400 italic animate-pulse">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            <span>Someone is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <MessageInput />
    </div>
  );
};
