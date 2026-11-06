import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message, ReactionType } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { sound } from '../services/sound';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeConversationId: string | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  searchFilter: string;
  activeCategory: 'all' | 'direct' | 'groups' | 'archived';
  typingUsers: string[]; // List of user IDs currently typing in the active conversation
  onlineUsers: Set<string>;
  replyingToMessage: Message | null;
  editingMessage: Message | null;
  isRightPanelOpen: boolean;
  searchInChatQuery: string;
  setSearchFilter: (query: string) => void;
  setActiveCategory: (cat: 'all' | 'direct' | 'groups' | 'archived') => void;
  selectConversation: (id: string | null) => void;
  sendMessage: (content: string, messageType?: string, attachments?: any[]) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  togglePin: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, reaction: ReactionType) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  createConversation: (data: { isGroup: boolean; targetUserId?: string; name?: string; description?: string; memberIds?: string[] }) => Promise<Conversation>;
  toggleMute: (convId: string) => Promise<void>;
  toggleArchive: (convId: string) => Promise<void>;
  addGroupMember: (convId: string, userId: string) => Promise<void>;
  removeGroupMember: (convId: string, targetId: string) => Promise<void>;
  setReplyingToMessage: (msg: Message | null) => void;
  setEditingMessage: (msg: Message | null) => void;
  setIsRightPanelOpen: (open: boolean) => void;
  setSearchInChatQuery: (query: string) => void;
  refreshConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, readReceiptsEnabled } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'direct' | 'groups' | 'archived'>('all');
  const [typingMap, setTypingMap] = useState<Record<string, Record<string, boolean>>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [searchInChatQuery, setSearchInChatQuery] = useState('');

  const activeConvRef = useRef<string | null>(null);
  activeConvRef.current = activeConversationId;

  // Fetch initial conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);
      // Auto-select first conversation if none selected on desktop
      if (!activeConvRef.current && res.conversations.length > 0 && window.innerWidth >= 768) {
        setActiveConversationId(res.conversations[0].id);
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    } else {
      setConversations([]);
      setMessages([]);
      setActiveConversationId(null);
    }
  }, [currentUser, fetchConversations]);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!activeConversationId || !currentUser) {
      setMessages([]);
      return;
    }

    let isSubscribed = true;
    setIsLoadingMessages(true);
    setReplyingToMessage(null);
    setEditingMessage(null);
    setSearchInChatQuery('');

    api
      .getMessages(activeConversationId)
      .then((res) => {
        if (isSubscribed) {
          setMessages(res.messages);
          // Mark as read in client list
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConversationId ? { ...c, unreadCount: 0 } : c))
          );
        }
      })
      .catch((err) => {
        console.error('Failed to fetch messages:', err);
      })
      .finally(() => {
        if (isSubscribed) setIsLoadingMessages(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeConversationId, currentUser]);

  // Realtime Socket Event Subscriptions
  useEffect(() => {
    if (!currentUser) return;

    // 1. New Message received
    const unbindMsg = socket.on('message:new', (newMsg: Message) => {
      // Check if message belongs to active conversation
      if (activeConvRef.current === newMsg.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev; // Idempotent check
          return [...prev, newMsg];
        });

        // Mark read immediately if we are viewing this chat
        if (readReceiptsEnabled && newMsg.senderId !== currentUser.id) {
          api.markAsRead(newMsg.conversationId).catch(() => {});
        }
      }

      // Play chime if message is from another user
      if (newMsg.senderId !== currentUser.id) {
        sound.playMessageSound();
      }

      // Update conversations list: bump to top and update last message & unread count
      setConversations((prev) => {
        return prev
          .map((c) => {
            if (c.id === newMsg.conversationId) {
              const isCurrentlyActive = activeConvRef.current === newMsg.conversationId;
              const newUnread = isCurrentlyActive || newMsg.senderId === currentUser.id
                ? 0
                : (c.unreadCount || 0) + 1;
              return {
                ...c,
                lastMessage: newMsg,
                updatedAt: newMsg.createdAt,
                unreadCount: newUnread,
              };
            }
            return c;
          })
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    });

    // 2. Message updated (edited / pinned / reacted)
    const unbindUpdate = socket.on('message:update', (updatedMsg: Message) => {
      setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)));
    });

    // 3. Message deleted
    const unbindDelete = socket.on('message:delete', ({ messageId, conversationId }: any) => {
      if (activeConvRef.current === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, content: 'This message was deleted.', attachments: [] }
              : m
          )
        );
      }
    });

    // 4. Typing indicators
    const unbindTyping = socket.on('typing:update', ({ conversationId, userId, isTyping }: any) => {
      setTypingMap((prev) => {
        const convTyping = { ...(prev[conversationId] || {}) };
        if (isTyping) {
          convTyping[userId] = true;
        } else {
          delete convTyping[userId];
        }
        return { ...prev, [conversationId]: convTyping };
      });
    });

    // 5. Presence (Online / Offline status)
    const unbindPresence = socket.on('presence:update', ({ userId, isOnline }: any) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (isOnline) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    });

    // 6. Conversation created
    const unbindConvCreated = socket.on('conversation:created', (newConv: Conversation) => {
      setConversations((prev) => {
        if (prev.some((c) => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
    });

    // 7. Conversation Read Receipt
    const unbindRead = socket.on('conversation:read', ({ conversationId, userId }: any) => {
      if (activeConvRef.current === conversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (!m.reads.includes(userId)) {
              return { ...m, reads: [...m.reads, userId] };
            }
            return m;
          })
        );
      }
    });

    return () => {
      unbindMsg();
      unbindUpdate();
      unbindDelete();
      unbindTyping();
      unbindPresence();
      unbindConvCreated();
      unbindRead();
    };
  }, [currentUser, readReceiptsEnabled]);

  const selectConversation = (id: string | null) => {
    setActiveConversationId(id);
    if (id && readReceiptsEnabled) {
      api.markAsRead(id).catch(() => {});
    }
  };

  const sendMessage = async (content: string, messageType: string = 'text', attachments?: any[]) => {
    if (!activeConversationId || !currentUser) return;
    const replyId = replyingToMessage?.id;
    setReplyingToMessage(null);

    // Optimistic UI could be applied, but since server latency is <10ms locally, standard request ensures order
    const res = await api.sendMessage(activeConversationId, {
      content,
      messageType,
      replyToId: replyId,
      attachments,
    });

    if (res.message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });

      setConversations((prev) =>
        prev
          .map((c) => (c.id === activeConversationId ? { ...c, lastMessage: res.message, updatedAt: res.message.createdAt } : c))
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      );
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (!activeConversationId) return;
    const res = await api.editMessage(activeConversationId, messageId, content);
    if (res.message) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...res.message } : m)));
      setEditingMessage(null);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!activeConversationId) return;
    await api.deleteMessage(activeConversationId, messageId);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, isDeleted: true, content: 'This message was deleted.', attachments: [] }
          : m
      )
    );
  };

  const togglePin = async (messageId: string) => {
    if (!activeConversationId) return;
    const res = await api.togglePin(activeConversationId, messageId);
    if (res.message) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...res.message } : m)));
    }
  };

  const toggleReaction = async (messageId: string, reaction: ReactionType) => {
    if (!activeConversationId) return;
    const res = await api.toggleReaction(activeConversationId, messageId, reaction);
    if (res.message) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, ...res.message } : m)));
    }
  };

  const setTyping = (isTyping: boolean) => {
    if (!activeConversationId || !currentUser) return;
    socket.sendTyping(activeConversationId, currentUser.id, isTyping);
  };

  const createConversation = async (data: { isGroup: boolean; targetUserId?: string; name?: string; description?: string; memberIds?: string[] }) => {
    const res = await api.createConversation(data);
    await fetchConversations();
    setActiveConversationId(res.conversation.id);
    return res.conversation;
  };

  const toggleMute = async (convId: string) => {
    const res = await api.toggleMute(convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, isMuted: res.isMuted } : c))
    );
  };

  const toggleArchive = async (convId: string) => {
    const res = await api.toggleArchive(convId);
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, isArchived: res.isArchived } : c))
    );
  };

  const addGroupMember = async (convId: string, userId: string) => {
    await api.addGroupMember(convId, userId);
    await fetchConversations();
  };

  const removeGroupMember = async (convId: string, targetId: string) => {
    await api.removeGroupMember(convId, targetId);
    await fetchConversations();
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;
  const currentTypingUsers = activeConversationId
    ? Object.keys(typingMap[activeConversationId] || {}).filter((uid) => uid !== currentUser?.id)
    : [];

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        activeConversationId,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        searchFilter,
        activeCategory,
        typingUsers: currentTypingUsers,
        onlineUsers,
        replyingToMessage,
        editingMessage,
        isRightPanelOpen,
        searchInChatQuery,
        setSearchFilter,
        setActiveCategory,
        selectConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        togglePin,
        toggleReaction,
        setTyping,
        createConversation,
        toggleMute,
        toggleArchive,
        addGroupMember,
        removeGroupMember,
        setReplyingToMessage,
        setEditingMessage,
        setIsRightPanelOpen,
        setSearchInChatQuery,
        refreshConversations: fetchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
