import React, { useState, useRef } from 'react';
import { Message, ReactionType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import {
  Smile,
  Reply,
  Pin,
  Trash2,
  Edit2,
  Copy,
  Check,
  CheckCheck,
  Play,
  Pause,
  FileText,
  Download,
  MoreHorizontal,
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isGroup: boolean;
  showSender: boolean;
}

const REACTIONS: ReactionType[] = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isGroup, showSender }) => {
  const { currentUser } = useAuth();
  const { toggleReaction, togglePin, deleteMessage, setReplyingToMessage, setEditingMessage } = useChat();

  const [showReactionsPicker, setShowReactionsPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isMe = currentUser?.id === message.senderId;
  const isDeleted = message.isDeleted;

  // Format timestamp (e.g. "10:45 AM")
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  const handleToggleAudio = (audioUrl: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current && audioRef.current.duration) {
          setAudioProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
        }
      };
      audioRef.current.onended = () => {
        setIsPlayingAudio(false);
        setAudioProgress(0);
      };
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Group reactions by symbol
  const reactionCounts = message.reactions?.reduce((acc, r) => {
    acc[r.reaction] = (acc[r.reaction] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const myReactions = new Set(
    message.reactions?.filter((r) => r.userId === currentUser?.id).map((r) => r.reaction) || []
  );

  return (
    <div
      className={`group relative flex flex-col mb-1.5 px-4 ${
        isMe ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender name for group chats (when message is from someone else) */}
      {!isMe && isGroup && showSender && (
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 ml-10 mb-1">
          {message.sender?.displayName || 'Member'}
        </span>
      )}

      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar for other user */}
        {!isMe && (
          <div className="w-7 h-7 shrink-0 mb-1">
            {showSender ? (
              <img
                src={message.sender?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`}
                alt={message.sender?.displayName || 'User'}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
              />
            ) : (
              <div className="w-7" />
            )}
          </div>
        )}

        {/* Message Bubble Body */}
        <div className="relative">
          {/* Pinned Tag */}
          {message.isPinned && (
            <div className={`flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
              <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>Pinned message</span>
            </div>
          )}

          {/* Replying To snippet */}
          {message.replyToMessage && (
            <div
              className={`text-xs px-3 py-1.5 rounded-t-xl border-b border-white/20 dark:border-slate-700/50 mb-[-4px] opacity-85 ${
                isMe
                  ? 'bg-[#0756d6] text-white/90'
                  : 'bg-slate-200 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-1 font-semibold text-[11px]">
                <Reply className="w-3 h-3" />
                <span>Replying to {message.replyToMessage.senderName}</span>
              </div>
              <p className="truncate text-[11px] max-w-xs">{message.replyToMessage.content}</p>
            </div>
          )}

          {/* Main Bubble Container */}
          <div
            className={`px-4 py-2.5 rounded-2xl text-[14.5px] leading-relaxed shadow-2xs relative break-words ${
              isDeleted
                ? 'italic text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                : isMe
                ? 'bg-[#0866FF] text-white rounded-br-xs'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-bl-xs'
            }`}
          >
            {/* Deleted state */}
            {isDeleted ? (
              <span className="flex items-center gap-1 text-xs">
                <span>This message was deleted</span>
              </span>
            ) : (
              <>
                {/* Voice Note Player */}
                {message.messageType === 'voice' && message.attachments?.[0] ? (
                  <div className="flex items-center gap-3 py-1 min-w-[200px]">
                    <button
                      type="button"
                      onClick={() => handleToggleAudio(message.attachments![0].fileUrl)}
                      className={`p-2 rounded-full transition-colors ${
                        isMe
                          ? 'bg-white text-[#0866FF] hover:bg-slate-100'
                          : 'bg-[#0866FF] text-white hover:bg-[#0756d6]'
                      }`}
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <div className="h-1.5 bg-black/20 dark:bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-150 ${isMe ? 'bg-white' : 'bg-[#0866FF]'}`}
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-1 text-[11px] opacity-80">
                        <span>Voice Message</span>
                        <span>{message.attachments[0].durationSeconds ? `${message.attachments[0].durationSeconds}s` : ''}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Attachments: Images, Videos, Documents */}
                {message.attachments && message.attachments.length > 0 && message.messageType !== 'voice' && (
                  <div className="space-y-2 mb-2">
                    {message.attachments.map((att, idx) => {
                      if (att.fileType.startsWith('image/')) {
                        return (
                          <div key={idx} className="rounded-xl overflow-hidden max-w-sm">
                            <img
                              src={att.fileUrl}
                              alt={att.fileName}
                              className="w-full h-auto max-h-72 object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                              onClick={() => window.open(att.fileUrl, '_blank')}
                            />
                          </div>
                        );
                      } else if (att.fileType.startsWith('video/')) {
                        return (
                          <video
                            key={idx}
                            src={att.fileUrl}
                            controls
                            className="w-full max-h-72 rounded-xl object-contain bg-black"
                          />
                        );
                      } else {
                        return (
                          <a
                            key={idx}
                            href={att.fileUrl}
                            download={att.fileName}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                              isMe
                                ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                                : 'bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            <FileText className="w-6 h-6 text-[#0866FF] shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{att.fileName}</p>
                              <p className="text-[10px] opacity-75">
                                {(att.fileSize / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <Download className="w-4 h-4 opacity-75 shrink-0" />
                          </a>
                        );
                      }
                    })}
                  </div>
                )}

                {/* Text Content */}
                {message.content && (
                  <p className="whitespace-pre-wrap select-text leading-relaxed font-sans">{message.content}</p>
                )}

                {/* Meta footer: time, edited tag, read receipts */}
                <div
                  className={`flex items-center gap-1.5 text-[10px] mt-1 ${
                    isMe ? 'text-white/80 justify-end' : 'text-slate-400 dark:text-slate-400 justify-start'
                  }`}
                >
                  {message.isEdited && <span className="opacity-75">edited</span>}
                  <span>{formatTime(message.createdAt)}</span>
                  {isMe && (
                    <span title={message.reads && message.reads.length > 1 ? 'Read' : 'Sent'}>
                      {message.reads && message.reads.length > 1 ? (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                      ) : (
                        <Check className="w-3.5 h-3.5 opacity-75" />
                      )}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Reactions summary strip */}
          {Object.keys(reactionCounts).length > 0 && (
            <div
              className={`flex flex-wrap items-center gap-1 mt-1 ${
                isMe ? 'justify-end' : 'justify-start'
              }`}
            >
              {Object.entries(reactionCounts).map(([emoji, count]) => {
                const isSelected = myReactions.has(emoji as ReactionType);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => toggleReaction(message.id, emoji as ReactionType)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[#0866FF]/15 text-[#0866FF] border border-[#0866FF]/40 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="text-[11px] font-mono tabular-nums">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Hover Action Menu */}
        {!isDeleted && (
          <div
            className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 self-center ${
              isMe ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Quick Reactions Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReactionsPicker(!showReactionsPicker)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                title="Add reaction"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Reaction Picker Flyout */}
              {showReactionsPicker && (
                <div
                  className="absolute bottom-8 z-30 flex items-center gap-1 p-1 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-100"
                  style={{ [isMe ? 'right' : 'left']: 0 }}
                >
                  {REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        toggleReaction(message.id, emoji);
                        setShowReactionsPicker(false);
                      }}
                      className="p-1.5 text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Button */}
            <button
              type="button"
              onClick={() => setReplyingToMessage(message)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              title="Reply"
            >
              <Reply className="w-4 h-4" />
            </button>

            {/* Extra Options Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div
                  className={`absolute bottom-8 z-30 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-xs text-slate-700 dark:text-slate-200 ${
                    isMe ? 'right-0' : 'left-0'
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>{copied ? 'Copied!' : 'Copy text'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      togglePin(message.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Pin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{message.isPinned ? 'Unpin' : 'Pin message'}</span>
                  </button>

                  {isMe && message.messageType === 'text' && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMessage(message);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Edit message</span>
                    </button>
                  )}

                  {(isMe || currentUser?.role === 'admin') && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteMessage(message.id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
