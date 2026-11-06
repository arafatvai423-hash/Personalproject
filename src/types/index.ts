export type UserRole = 'founder' | 'admin' | 'member';
export type UserStatus = 'approved' | 'pending' | 'rejected' | 'suspended';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file';
export type CallType = 'voice' | 'video';
export type CallStatus = 'missed' | 'completed' | 'declined' | 'busy' | 'ongoing';
export type ReactionType = '❤️' | '😂' | '😮' | '😢' | '👍' | '🔥';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  coverUrl?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  founderTitle?: string;
  responsibility?: string;
  contactLinks?: {
    github?: string;
    website?: string;
    email?: string;
  };
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  messageId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  durationSeconds?: number;
  createdAt?: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  reaction: ReactionType;
  userName?: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: UserProfile;
  content: string;
  messageType: MessageType;
  replyToId?: string;
  replyToMessage?: {
    id: string;
    senderName: string;
    content: string;
    messageType: MessageType;
  };
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  reactions: MessageReaction[];
  reads: string[]; // user IDs who have read
  attachments?: Attachment[];
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: UserRole;
  profile: UserProfile;
  isMuted: boolean;
  isArchived: boolean;
  lastReadAt: string;
  joinedAt: string;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: ConversationMember[];
  lastMessage?: Message;
  unreadCount?: number;
  isMuted?: boolean;
  isArchived?: boolean;
}

export interface UserInvitation {
  id: string;
  code: string;
  email?: string;
  createdBy: string;
  creatorName?: string;
  role: UserRole;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  actorId?: string;
  actor?: UserProfile;
  conversationId?: string;
  type: 'message' | 'mention' | 'call' | 'reaction' | 'invitation';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface CallRecord {
  id: string;
  conversationId?: string;
  callerId: string;
  receiverId: string;
  caller?: UserProfile;
  receiver?: UserProfile;
  callType: CallType;
  status: CallStatus;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
}

export interface CallSignalPayload {
  type: 'initiate' | 'incoming' | 'accept' | 'reject' | 'ice-candidate' | 'end';
  callId: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  sdp?: any;
  candidate?: any;
  caller?: UserProfile;
}
