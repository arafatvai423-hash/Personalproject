import React, { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuth } from '../contexts/AuthContext';
import { useCall } from '../contexts/CallContext';
import {
  X,
  Phone,
  Video,
  Bell,
  BellOff,
  Archive,
  Pin,
  Image as ImageIcon,
  FileText,
  Users,
  UserPlus,
  LogOut,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';

export const RightPanel: React.FC = () => {
  const {
    activeConversation,
    messages,
    toggleMute,
    toggleArchive,
    addGroupMember,
    removeGroupMember,
    setIsRightPanelOpen,
    searchInChatQuery,
    setSearchInChatQuery,
  } = useChat();
  const { currentUser } = useAuth();
  const { startCall } = useCall();

  const [expandedSections, setExpandedSections] = useState({
    search: false,
    pinned: true,
    media: true,
    files: true,
    members: true,
  });
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');

  if (!activeConversation) return null;

  // Determine peer info for 1-on-1 chats
  const isGroup = activeConversation.isGroup;
  const peer = isGroup
    ? null
    : activeConversation.members.find((m) => m.userId !== currentUser?.id)?.profile || null;

  const toggleSection = (key: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Extract shared media and files from messages
  const sharedMedia = messages
    .filter((m) => !m.isDeleted && m.attachments?.some((a) => a.fileType.startsWith('image/') || a.fileType.startsWith('video/')))
    .flatMap((m) => m.attachments || []);

  const sharedFiles = messages
    .filter(
      (m) =>
        !m.isDeleted &&
        m.attachments?.some((a) => !a.fileType.startsWith('image/') && !a.fileType.startsWith('video/') && m.messageType !== 'voice')
    )
    .flatMap((m) => m.attachments || []);

  const pinnedMessages = messages.filter((m) => m.isPinned && !m.isDeleted);

  const isAdmin = isGroup
    ? activeConversation.members.find((m) => m.userId === currentUser?.id)?.role === 'admin'
    : false;

  return (
    <aside className="w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {isGroup ? 'Group Details' : 'Contact Info'}
        </h2>
        <button
          type="button"
          onClick={() => setIsRightPanelOpen(false)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Overview */}
      <div className="flex flex-col items-center p-6 text-center border-b border-slate-100 dark:border-slate-800/60">
        <div className="relative mb-3">
          <img
            src={
              isGroup
                ? activeConversation.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${activeConversation.id}`
                : peer?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${peer?.id}`
            }
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-xs"
          />
          {!isGroup && peer?.isOnline && (
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          )}
        </div>

        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
          {isGroup ? activeConversation.name : peer?.displayName}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {isGroup ? `${activeConversation.members.length} members` : `@${peer?.username}`}
        </p>

        {/* Bio or description */}
        {(isGroup ? activeConversation.description : peer?.bio) && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 max-w-xs leading-relaxed px-2 bg-slate-50 dark:bg-slate-800/50 py-2 rounded-xl">
            {isGroup ? activeConversation.description : peer?.bio}
          </p>
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center gap-4 mt-5">
          {!isGroup && peer && (
            <>
              <button
                type="button"
                onClick={() => startCall(peer, 'voice', activeConversation.id)}
                className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#0866FF] transition-colors"
              >
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#0866FF]/10 rounded-full">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium">Audio</span>
              </button>

              <button
                type="button"
                onClick={() => startCall(peer, 'video', activeConversation.id)}
                className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#0866FF] transition-colors"
              >
                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#0866FF]/10 rounded-full">
                  <Video className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-medium">Video</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => toggleMute(activeConversation.id)}
            className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#0866FF] transition-colors"
          >
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#0866FF]/10 rounded-full">
              {activeConversation.isMuted ? (
                <BellOff className="w-4 h-4 text-amber-500" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </div>
            <span className="text-[11px] font-medium">
              {activeConversation.isMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleArchive(activeConversation.id)}
            className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-[#0866FF] transition-colors"
          >
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#0866FF]/10 rounded-full">
              <Archive className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium">
              {activeConversation.isArchived ? 'Unarchive' : 'Archive'}
            </span>
          </button>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {/* Search in Conversation */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => toggleSection('search')}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 py-1"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Search in Conversation</span>
            </div>
            {expandedSections.search ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {expandedSections.search && (
            <div className="mt-2.5">
              <input
                type="text"
                value={searchInChatQuery}
                onChange={(e) => setSearchInChatQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden focus:border-[#0866FF]"
              />
            </div>
          )}
        </div>

        {/* Pinned Messages */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => toggleSection('pinned')}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 py-1"
          >
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-amber-500" />
              <span>Pinned Messages ({pinnedMessages.length})</span>
            </div>
            {expandedSections.pinned ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {expandedSections.pinned && (
            <div className="mt-2 space-y-2">
              {pinnedMessages.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">No pinned messages</p>
              ) : (
                pinnedMessages.map((pm) => (
                  <div
                    key={pm.id}
                    className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                      {pm.content || '[Attachment]'}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {pm.sender?.displayName}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Shared Media */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => toggleSection('media')}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 py-1"
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#0866FF]" />
              <span>Shared Photos & Videos ({sharedMedia.length})</span>
            </div>
            {expandedSections.media ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {expandedSections.media && (
            <div className="mt-2">
              {sharedMedia.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">No photos shared yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {sharedMedia.map((m, idx) => (
                    <img
                      key={idx}
                      src={m.fileUrl}
                      alt={m.fileName}
                      className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(m.fileUrl, '_blank')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Shared Files */}
        <div className="p-3">
          <button
            type="button"
            onClick={() => toggleSection('files')}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 py-1"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Shared Documents ({sharedFiles.length})</span>
            </div>
            {expandedSections.files ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {expandedSections.files && (
            <div className="mt-2 space-y-1.5">
              {sharedFiles.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">No documents shared yet</p>
              ) : (
                sharedFiles.map((f, idx) => (
                  <a
                    key={idx}
                    href={f.fileUrl}
                    download={f.fileName}
                    className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 rounded-lg text-xs transition-colors"
                  >
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate flex-1 font-medium">{f.fileName}</span>
                    <span className="text-[10px] text-slate-400">
                      {(f.fileSize / 1024).toFixed(0)}KB
                    </span>
                  </a>
                ))
              )}
            </div>
          )}
        </div>

        {/* Group Members List (for Group conversations) */}
        {isGroup && (
          <div className="p-3">
            <div className="flex items-center justify-between py-1">
              <button
                type="button"
                onClick={() => toggleSection('members')}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Group Members ({activeConversation.members.length})</span>
                {expandedSections.members ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(true)}
                  className="p-1 text-[#0866FF] hover:bg-[#0866FF]/10 rounded-full"
                  title="Add Member"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              )}
            </div>

            {expandedSections.members && (
              <div className="mt-2 space-y-2">
                {activeConversation.members.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <img
                        src={member.profile?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.userId}`}
                        alt="avatar"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {member.profile?.displayName || 'User'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {member.role === 'admin' ? 'Admin' : 'Member'}
                        </p>
                      </div>
                    </div>

                    {isAdmin && member.userId !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => removeGroupMember(activeConversation.id, member.userId)}
                        className="text-red-500 hover:text-red-600 text-[10px]"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => removeGroupMember(activeConversation.id, currentUser!.id)}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-red-200 dark:border-red-900/50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Group</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl">
            <h3 className="text-sm font-semibold mb-2">Add Member to Group</h3>
            <p className="text-xs text-slate-500 mb-4">Enter user ID or choose from contacts</p>
            <input
              type="text"
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
              placeholder="e.g. u_marcus_003"
              className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg mb-4 bg-slate-50 dark:bg-slate-900"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (newMemberId.trim()) {
                    await addGroupMember(activeConversation.id, newMemberId.trim());
                    setShowAddMemberModal(false);
                    setNewMemberId('');
                  }
                }}
                className="px-3 py-1.5 text-xs bg-[#0866FF] text-white rounded-lg hover:bg-[#0756d6]"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
