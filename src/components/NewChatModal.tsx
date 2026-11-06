import React, { useState, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { X, Users, MessageSquare, Search, Check } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { createConversation } = useChat();
  const { currentUser } = useAuth();

  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Group form state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    api
      .getUsers()
      .then((res) => {
        // Exclude current user from contact list
        setUsers(res.users.filter((u) => u.id !== currentUser?.id));
      })
      .catch((err) => {
        console.error('Failed to load users:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartDirectChat = async (targetUser: UserProfile) => {
    try {
      await createConversation({
        isGroup: false,
        targetUserId: targetUser.id,
      });
      onClose();
    } catch (e) {
      console.error('Failed to create direct chat:', e);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0) return;

    try {
      setIsSubmitting(true);
      await createConversation({
        isGroup: true,
        name: groupName.trim(),
        description: groupDescription.trim(),
        memberIds: selectedUserIds,
      });
      onClose();
    } catch (e) {
      console.error('Failed to create group:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
            New Conversation
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 p-2 gap-2">
          <button
            type="button"
            onClick={() => setMode('direct')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors ${
              mode === 'direct'
                ? 'bg-[#0866FF] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Direct Message</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('group')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors ${
              mode === 'group'
                ? 'bg-[#0866FF] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>

        {/* Content */}
        {mode === 'direct' ? (
          <div className="p-4 flex-1 overflow-y-auto">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search approved members..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
              />
            </div>

            {/* Approved Users List */}
            <div className="space-y-1">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading directory...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No members found</div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleStartDirectChat(user)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="relative">
                      <img
                        src={
                          user.avatarUrl ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                        }
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                      />
                      {user.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {user.displayName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                    </div>

                    <span className="text-[11px] text-[#0866FF] font-medium">Message</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateGroup} className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Group Name
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Executive Board, Security Taskforce"
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="Topic or operational purpose..."
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Members ({selectedUserIds.length} selected)
              </label>
              <div className="flex-1 overflow-y-auto max-h-48 border border-slate-100 dark:border-slate-800 rounded-xl p-1 divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleSelectUser(u.id)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                          alt={u.displayName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                          {u.displayName}
                        </span>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-[#0866FF] border-[#0866FF] text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!groupName.trim() || selectedUserIds.length === 0 || isSubmitting}
              className="w-full py-2.5 mt-2 bg-[#0866FF] hover:bg-[#0756d6] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? 'Creating group...' : 'Create Group'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
