import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DB {
  users: Array<{
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
    coverUrl?: string;
    bio?: string;
    founderTitle?: string;
    responsibility?: string;
    contactLinks?: { github?: string; website?: string; email?: string };
    role: 'founder' | 'admin' | 'member';
    status: 'approved' | 'pending' | 'rejected' | 'suspended';
    isOnline: boolean;
    lastSeen: string;
    createdAt: string;
  }>;
  conversations: Array<{
    id: string;
    isGroup: boolean;
    name?: string;
    description?: string;
    avatarUrl?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    memberIds: string[];
    memberRoles: Record<string, 'founder' | 'admin' | 'member'>;
    mutedBy: string[];
    archivedBy: string[];
    lastRead: Record<string, string>; // userId -> timestamp
  }>;
  messages: Array<{
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    messageType: 'text' | 'image' | 'video' | 'audio' | 'voice' | 'file';
    replyToId?: string;
    isPinned: boolean;
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    reactions: Array<{
      id: string;
      messageId: string;
      userId: string;
      reaction: '❤️' | '😂' | '😮' | '😢' | '👍' | '🔥';
      createdAt: string;
    }>;
    reads: string[];
    attachments?: Array<{
      id: string;
      messageId?: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      fileUrl: string;
      durationSeconds?: number;
    }>;
  }>;
  invitations: Array<{
    id: string;
    code: string;
    email?: string;
    createdBy: string;
    role: 'founder' | 'admin' | 'member';
    status: 'pending' | 'accepted' | 'expired' | 'revoked';
    expiresAt: string;
    createdAt: string;
  }>;
  notifications: Array<{
    id: string;
    userId: string;
    actorId?: string;
    conversationId?: string;
    type: 'message' | 'mention' | 'call' | 'reaction' | 'invitation';
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
  }>;
  calls: Array<{
    id: string;
    conversationId?: string;
    callerId: string;
    receiverId: string;
    callType: 'voice' | 'video';
    status: 'missed' | 'completed' | 'declined' | 'busy' | 'ongoing';
    startedAt: string;
    endedAt?: string;
    durationSeconds: number;
    createdAt: string;
  }>;
}

// Initial seed data generator
function getInitialDB(): DB {
  const adminId = 'u_founder_001';
  const user1Id = 'u_sarah_002';
  const user2Id = 'u_marcus_003';
  const user3Id = 'u_elena_004';

  const groupConvId = 'c_general_grp';
  const directConvId1 = 'c_dm_sarah_marcus';
  const now = new Date().toISOString();
  const past5 = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const past20 = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  const past1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  return {
    users: [
      {
        id: adminId,
        email: 'arafat@privateconnect.internal',
        passwordHash: 'admin123',
        displayName: 'Arafat Sani',
        username: 'arafat_sani',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArafatSani',
        coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        bio: 'Founder & Lead Developer of Private Connect. Architect of secure real-time messaging, WebRTC calling, and private group governance.',
        founderTitle: 'Founder & Lead Developer',
        responsibility: 'Product Development, Technical Architecture and Platform Management.',
        contactLinks: {
          github: 'https://github.com',
          website: 'https://privateconnect.internal',
          email: 'arafat@privateconnect.internal',
        },
        role: 'founder',
        status: 'approved',
        isOnline: true,
        lastSeen: now,
        createdAt: past1h,
      },
      {
        id: user1Id,
        email: 'sarah.chen@privateconnect.internal',
        passwordHash: 'member123',
        displayName: 'Sarah Chen',
        username: 'sarah_c',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahChen',
        bio: 'Design lead & UI specialist. Passionate about real-time collaboration.',
        role: 'member',
        status: 'approved',
        isOnline: true,
        lastSeen: now,
        createdAt: past1h,
      },
      {
        id: user2Id,
        email: 'marcus.vance@privateconnect.internal',
        passwordHash: 'member123',
        displayName: 'Marcus Vance',
        username: 'marcus_v',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MarcusVance',
        bio: 'Backend & WebRTC engineer. Audio/video streaming focus.',
        role: 'member',
        status: 'approved',
        isOnline: false,
        lastSeen: past5,
        createdAt: past1h,
      },
      {
        id: user3Id,
        email: 'elena.rostova@privateconnect.internal',
        passwordHash: 'member123',
        displayName: 'Elena Rostova',
        username: 'elena_r',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ElenaRostova',
        bio: 'Product manager & security researcher. Private by default.',
        role: 'member',
        status: 'approved',
        isOnline: false,
        lastSeen: past20,
        createdAt: past1h,
      },
    ],
    conversations: [
      {
        id: groupConvId,
        isGroup: true,
        name: 'Private Connect Core Team',
        description: 'Authorized workspace for executive strategy, security audits, and real-time coordination.',
        avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=PrivateConnectCore',
        createdBy: adminId,
        createdAt: past1h,
        updatedAt: now,
        memberIds: [adminId, user1Id, user2Id, user3Id],
        memberRoles: {
          [adminId]: 'admin',
          [user1Id]: 'member',
          [user2Id]: 'member',
          [user3Id]: 'member',
        },
        mutedBy: [],
        archivedBy: [],
        lastRead: {
          [adminId]: now,
          [user1Id]: now,
          [user2Id]: past5,
          [user3Id]: past20,
        },
      },
      {
        id: directConvId1,
        isGroup: false,
        createdBy: adminId,
        createdAt: past1h,
        updatedAt: past5,
        memberIds: [adminId, user1Id],
        memberRoles: {
          [adminId]: 'admin',
          [user1Id]: 'member',
        },
        mutedBy: [],
        archivedBy: [],
        lastRead: {
          [adminId]: now,
          [user1Id]: now,
        },
      },
    ],
    messages: [
      {
        id: 'm_seed_1',
        conversationId: groupConvId,
        senderId: adminId,
        content: 'Welcome to Private Connect! All conversations here are strictly private, encrypted, and isolated to authorized team members.',
        messageType: 'text',
        isPinned: true,
        isEdited: false,
        isDeleted: false,
        createdAt: past1h,
        updatedAt: past1h,
        reactions: [
          {
            id: 'r_seed_1',
            messageId: 'm_seed_1',
            userId: user1Id,
            reaction: '🔥',
            createdAt: past1h,
          },
          {
            id: 'r_seed_2',
            messageId: 'm_seed_1',
            userId: user2Id,
            reaction: '👍',
            createdAt: past1h,
          },
        ],
        reads: [adminId, user1Id, user2Id, user3Id],
      },
      {
        id: 'm_seed_2',
        conversationId: groupConvId,
        senderId: user1Id,
        content: 'The new Messenger-inspired interface is exceptionally fluid. Real-time typing indicators and WebRTC audio/video call integration are working smoothly.',
        messageType: 'text',
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: past20,
        updatedAt: past20,
        reactions: [
          {
            id: 'r_seed_3',
            messageId: 'm_seed_2',
            userId: adminId,
            reaction: '❤️',
            createdAt: past20,
          },
        ],
        reads: [adminId, user1Id, user2Id],
      },
      {
        id: 'm_seed_3',
        conversationId: directConvId1,
        senderId: user1Id,
        content: 'Hey Arafat! Ready for our 1-on-1 audio call test when you have a moment.',
        messageType: 'text',
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: past5,
        updatedAt: past5,
        reactions: [
          {
            id: 'r_seed_4',
            messageId: 'm_seed_3',
            userId: adminId,
            reaction: '👍',
            createdAt: past5,
          },
        ],
        reads: [adminId, user1Id],
      },
    ],
    invitations: [
      {
        id: 'inv_vip_001',
        code: 'CONNECT-VIP-2026',
        email: 'guest.partner@privateconnect.internal',
        createdBy: adminId,
        role: 'member',
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: past1h,
      },
    ],
    notifications: [],
    calls: [],
  };
}

// Database helper functions
let db: DB;
function loadDB(): DB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data: DB = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      // Ensure founder identity is properly established and upgraded
      let founder = data.users.find((u) => u.email === 'arafat@privateconnect.internal' || u.id === 'u_admin_001' || u.id === 'u_founder_001' || u.role === 'founder');
      if (founder) {
        founder.displayName = 'Arafat Sani';
        founder.username = 'arafat_sani';
        founder.role = 'founder';
        founder.status = 'approved';
        founder.founderTitle = 'Founder & Lead Developer';
        founder.responsibility = 'Product Development, Technical Architecture and Platform Management.';
        if (!founder.coverUrl) {
          founder.coverUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
        }
        if (!founder.contactLinks) {
          founder.contactLinks = {
            github: 'https://github.com',
            website: 'https://privateconnect.internal',
            email: 'arafat@privateconnect.internal',
          };
        }
      }
      saveDB(data);
      return data;
    }
  } catch (err) {
    console.error('Error reading db.json, generating initial database:', err);
  }
  const initial = getInitialDB();
  saveDB(initial);
  return initial;
}

function saveDB(data: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}

db = loadDB();

// Setup Express and WebSocket server
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Track connected WebSocket clients: userId -> Set<WebSocket>
const clients = new Map<string, Set<WebSocket>>();
const socketToUser = new Map<WebSocket, string>();

function broadcastToUsers(userIds: string[], event: string, payload: any) {
  const messageStr = JSON.stringify({ event, payload });
  userIds.forEach((uid) => {
    const userSockets = clients.get(uid);
    if (userSockets) {
      userSockets.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      });
    }
  });
}

function broadcastToAll(event: string, payload: any) {
  const messageStr = JSON.stringify({ event, payload });
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, payload } = data;

      if (type === 'auth') {
        const userId = payload.userId;
        if (userId) {
          if (!clients.has(userId)) {
            clients.set(userId, new Set());
          }
          clients.get(userId)!.add(ws);
          socketToUser.set(ws, userId);

          // Update user online status
          const user = db.users.find((u) => u.id === userId);
          if (user) {
            user.isOnline = true;
            user.lastSeen = new Date().toISOString();
            saveDB(db);
            broadcastToAll('presence:update', {
              userId,
              isOnline: true,
              lastSeen: user.lastSeen,
            });
          }
        }
      } else if (type === 'typing') {
        const { conversationId, userId, isTyping } = payload;
        const conv = db.conversations.find((c) => c.id === conversationId);
        if (conv) {
          const others = conv.memberIds.filter((id) => id !== userId);
          broadcastToUsers(others, 'typing:update', {
            conversationId,
            userId,
            isTyping,
          });
        }
      } else if (type === 'call:signal') {
        // WebRTC Signaling Relay
        const { targetUserId } = payload;
        if (targetUserId) {
          broadcastToUsers([targetUserId], 'call:signal', payload);
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    const userId = socketToUser.get(ws);
    if (userId) {
      const userSockets = clients.get(userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          clients.delete(userId);
          const user = db.users.find((u) => u.id === userId);
          if (user) {
            user.isOnline = false;
            user.lastSeen = new Date().toISOString();
            saveDB(db);
            broadcastToAll('presence:update', {
              userId,
              isOnline: false,
              lastSeen: user.lastSeen,
            });
          }
        }
      }
      socketToUser.delete(ws);
    }
  });
});

// Authentication Helpers
function getAuthUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  const userId = (req.headers['x-user-id'] as string) || (authHeader ? authHeader.replace('Bearer ', '') : '');
  if (!userId) return null;
  return db.users.find((u) => u.id === userId) || null;
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. Auth: Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, displayName, username, inviteCode } = req.body;
  if (!email || !password || !displayName || !username) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();

  if (db.users.some((u) => u.email === cleanEmail)) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }
  if (db.users.some((u) => u.username === cleanUsername)) {
    return res.status(400).json({ error: 'This username is already taken.' });
  }

  // Invitation check
  let status: 'approved' | 'pending' = 'pending';
  let matchedInvitation: any = null;

  if (inviteCode) {
    matchedInvitation = db.invitations.find(
      (inv) => inv.code.toUpperCase() === inviteCode.trim().toUpperCase() && inv.status === 'pending'
    );
    if (matchedInvitation) {
      status = 'approved';
      matchedInvitation.status = 'accepted';
    }
  }

  // First user or valid invite code gets approved immediately
  if (db.users.length === 0) {
    status = 'approved';
  }

  // If no users exist, seed as founder. Otherwise regular registration can only be member.
  const assignedRole: 'founder' | 'admin' | 'member' =
    db.users.length === 0
      ? 'founder'
      : (matchedInvitation?.role === 'admin' ? 'admin' : 'member');

  const newUser = {
    id: `u_${crypto.randomUUID().slice(0, 8)}`,
    email: cleanEmail,
    passwordHash: password,
    displayName: displayName.trim(),
    username: cleanUsername,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
    coverUrl: '',
    bio: 'Member of Private Connect',
    role: assignedRole,
    status,
    isOnline: status === 'approved',
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // If approved, add to the main general group conversation if one exists
  if (status === 'approved') {
    const mainGroup = db.conversations.find((c) => c.isGroup && c.name?.includes('Private Connect Core Team'));
    if (mainGroup && !mainGroup.memberIds.includes(newUser.id)) {
      mainGroup.memberIds.push(newUser.id);
      mainGroup.memberRoles[newUser.id] = 'member';
      mainGroup.lastRead[newUser.id] = new Date().toISOString();
    }
  }

  saveDB(db);

  if (status === 'pending') {
    return res.status(201).json({
      message: 'Your account is awaiting approval. Private Connect is an exclusive, invite-only space. Your request has been queued for review by Founder Arafat Sani and administrators.',
      status: 'pending',
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        username: newUser.username,
        role: newUser.role,
        status: newUser.status,
      },
    });
  }

  return res.status(201).json({
    user: newUser,
    token: newUser.id,
  });
});

// 2. Auth: Login
app.post('/api/auth/login', (req, res) => {
  const { credential, password } = req.body;
  if (!credential || !password) {
    return res.status(400).json({ error: 'Please enter your email or username and password.' });
  }

  const cleanCred = credential.trim().toLowerCase();
  const user = db.users.find(
    (u) => (u.email.toLowerCase() === cleanCred || u.username.toLowerCase() === cleanCred) && u.passwordHash === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify your details.' });
  }

  if (user.status === 'pending') {
    return res.status(403).json({
      error: 'Your account is awaiting approval.',
      message: 'Your registration request has been submitted to Founder Arafat Sani and platform administrators. You will be granted access once your membership is cleared.',
      status: 'pending',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  }

  if (user.status === 'rejected') {
    return res.status(403).json({
      error: 'Account Registration Denied.',
      message: 'Your membership request was reviewed and could not be approved by the platform administrators at this time.',
      status: 'rejected',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({
      error: 'Account Suspended.',
      message: 'This account has been suspended by an administrator. Please contact support.',
      status: 'suspended',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  }

  user.isOnline = true;
  user.lastSeen = new Date().toISOString();
  saveDB(db);

  return res.json({
    user,
    token: user.id,
  });
});

// 2b. Check Approval Status
app.get('/api/auth/status', (req, res) => {
  const userId = req.query.userId as string;
  const email = req.query.email as string;

  let user = null;
  if (userId) {
    user = db.users.find((u) => u.id === userId);
  } else if (email) {
    user = db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  if (!user) {
    return res.status(404).json({ error: 'User record not found.' });
  }

  return res.json({
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    role: user.role,
    status: user.status,
  });
});

// 3. Auth: Me
app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  return res.json({ user });
});

// 4. Update Profile
app.put('/api/users/profile', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { displayName, bio, avatarUrl } = req.body;
  if (displayName) user.displayName = displayName.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (avatarUrl) user.avatarUrl = avatarUrl;

  saveDB(db);
  broadcastToAll('user:updated', user);
  return res.json({ user });
});

// 5. List Approved Users for starting new chats
app.get('/api/users', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  // Only approved members can browse other approved members
  const approvedUsers = db.users
    .filter((u) => u.status === 'approved')
    .map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      username: u.username,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      role: u.role,
      status: u.status,
      isOnline: clients.has(u.id),
      lastSeen: u.lastSeen,
      createdAt: u.createdAt,
    }));

  return res.json({ users: approvedUsers });
});

// 6. List Conversations for Current User
app.get('/api/conversations', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const userConversations = db.conversations
    .filter((c) => c.memberIds.includes(user.id))
    .map((c) => {
      // Find members details
      const members = c.memberIds.map((mId) => {
        const u = db.users.find((usr) => usr.id === mId);
        return {
          id: `${c.id}_${mId}`,
          conversationId: c.id,
          userId: mId,
          role: c.memberRoles[mId] || 'member',
          profile: u
            ? {
                id: u.id,
                email: u.email,
                displayName: u.displayName,
                username: u.username,
                avatarUrl: u.avatarUrl,
                bio: u.bio,
                role: u.role,
                status: u.status,
                isOnline: clients.has(u.id),
                lastSeen: u.lastSeen,
                createdAt: u.createdAt,
              }
            : {
                id: mId,
                email: 'user@privateconnect.internal',
                displayName: 'Former Member',
                username: 'member',
                role: 'member',
                status: 'approved',
                isOnline: false,
                lastSeen: '',
                createdAt: '',
              },
          isMuted: c.mutedBy.includes(user.id),
          isArchived: c.archivedBy.includes(user.id),
          lastReadAt: c.lastRead[mId] || c.createdAt,
          joinedAt: c.createdAt,
        };
      });

      // Find last message
      const convMessages = db.messages
        .filter((m) => m.conversationId === c.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const lastMessage = convMessages[convMessages.length - 1];

      // Unread count
      const userLastReadTime = new Date(c.lastRead[user.id] || 0).getTime();
      const unreadCount = convMessages.filter(
        (m) => m.senderId !== user.id && new Date(m.createdAt).getTime() > userLastReadTime
      ).length;

      return {
        id: c.id,
        isGroup: c.isGroup,
        name: c.name,
        description: c.description,
        avatarUrl: c.avatarUrl,
        createdBy: c.createdBy,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        members,
        lastMessage,
        unreadCount,
        isMuted: c.mutedBy.includes(user.id),
        isArchived: c.archivedBy.includes(user.id),
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return res.json({ conversations: userConversations });
});

// 7. Create Conversation (1-on-1 or Group)
app.post('/api/conversations', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { isGroup, targetUserId, name, description, memberIds } = req.body;

  if (!isGroup) {
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID is required.' });
    }

    // Check if 1-on-1 already exists
    const existing = db.conversations.find(
      (c) =>
        !c.isGroup &&
        c.memberIds.length === 2 &&
        c.memberIds.includes(user.id) &&
        c.memberIds.includes(targetUserId)
    );

    if (existing) {
      return res.json({ conversation: existing });
    }

    const newConv = {
      id: `c_dm_${crypto.randomUUID().slice(0, 8)}`,
      isGroup: false,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberIds: [user.id, targetUserId],
      memberRoles: {
        [user.id]: 'member' as 'member',
        [targetUserId]: 'member' as 'member',
      },
      mutedBy: [],
      archivedBy: [],
      lastRead: {
        [user.id]: new Date().toISOString(),
        [targetUserId]: new Date().toISOString(),
      },
    };

    db.conversations.push(newConv);
    saveDB(db);

    broadcastToUsers([user.id, targetUserId], 'conversation:created', newConv);
    return res.status(201).json({ conversation: newConv });
  } else {
    // Group creation
    if (!name) {
      return res.status(400).json({ error: 'Group name is required.' });
    }

    const allMembers = Array.from(new Set([user.id, ...(memberIds || [])]));
    const memberRoles: Record<string, 'admin' | 'member'> = {};
    const lastRead: Record<string, string> = {};

    allMembers.forEach((mId) => {
      memberRoles[mId] = mId === user.id ? 'admin' : 'member';
      lastRead[mId] = new Date().toISOString();
    });

    const newGroup = {
      id: `c_grp_${crypto.randomUUID().slice(0, 8)}`,
      isGroup: true,
      name: name.trim(),
      description: (description || '').trim(),
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      memberIds: allMembers,
      memberRoles,
      mutedBy: [],
      archivedBy: [],
      lastRead,
    };

    db.conversations.push(newGroup);
    saveDB(db);

    broadcastToUsers(allMembers, 'conversation:created', newGroup);
    return res.status(201).json({ conversation: newGroup });
  }
});

// 8. Get Messages for Conversation
app.get('/api/conversations/:id/messages', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const convId = req.params.id;
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv || !conv.memberIds.includes(user.id)) {
    return res.status(403).json({ error: 'Access denied to this conversation.' });
  }

  // Update last read for this user
  conv.lastRead[user.id] = new Date().toISOString();

  // Populate sender details and replies
  const messages = db.messages
    .filter((m) => m.conversationId === convId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((m) => {
      const sender = db.users.find((u) => u.id === m.senderId);
      let replyToMessage = undefined;
      if (m.replyToId) {
        const parentMsg = db.messages.find((p) => p.id === m.replyToId);
        if (parentMsg) {
          const parentSender = db.users.find((u) => u.id === parentMsg.senderId);
          replyToMessage = {
            id: parentMsg.id,
            senderName: parentSender?.displayName || 'User',
            content: parentMsg.content,
            messageType: parentMsg.messageType,
          };
        }
      }

      // Mark reads
      if (!m.reads.includes(user.id)) {
        m.reads.push(user.id);
      }

      return {
        ...m,
        sender: sender
          ? {
              id: sender.id,
              email: sender.email,
              displayName: sender.displayName,
              username: sender.username,
              avatarUrl: sender.avatarUrl,
              bio: sender.bio,
              role: sender.role,
              status: sender.status,
              isOnline: clients.has(sender.id),
              lastSeen: sender.lastSeen,
              createdAt: sender.createdAt,
            }
          : undefined,
        replyToMessage,
      };
    });

  saveDB(db);
  return res.json({ messages });
});

// 9. Send Message
app.post('/api/conversations/:id/messages', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const convId = req.params.id;
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv || !conv.memberIds.includes(user.id)) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  const { content, messageType = 'text', replyToId, attachments } = req.body;
  if (!content && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: 'Message content or attachment is required.' });
  }

  const now = new Date().toISOString();
  const newMessage = {
    id: `m_${crypto.randomUUID().slice(0, 8)}`,
    conversationId: convId,
    senderId: user.id,
    content: (content || '').trim(),
    messageType: messageType as any,
    replyToId: replyToId || undefined,
    isPinned: false,
    isEdited: false,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    reactions: [],
    reads: [user.id],
    attachments: attachments || [],
  };

  db.messages.push(newMessage);
  conv.updatedAt = now;
  conv.lastRead[user.id] = now;
  saveDB(db);

  // Populate sender info for broadcast
  let replyToMessage = undefined;
  if (replyToId) {
    const parentMsg = db.messages.find((p) => p.id === replyToId);
    if (parentMsg) {
      const parentSender = db.users.find((u) => u.id === parentMsg.senderId);
      replyToMessage = {
        id: parentMsg.id,
        senderName: parentSender?.displayName || 'User',
        content: parentMsg.content,
        messageType: parentMsg.messageType,
      };
    }
  }

  const fullMessage = {
    ...newMessage,
    sender: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      role: user.role,
      status: user.status,
      isOnline: true,
      lastSeen: now,
      createdAt: user.createdAt,
    },
    replyToMessage,
  };

  // Broadcast to all conversation members
  broadcastToUsers(conv.memberIds, 'message:new', fullMessage);

  return res.status(201).json({ message: fullMessage });
});

// 10. Edit Message
app.put('/api/conversations/:id/messages/:msgId', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id: convId, msgId } = req.params;
  const { content } = req.body;

  const msg = db.messages.find((m) => m.id === msgId && m.conversationId === convId);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  if (msg.senderId !== user.id) {
    return res.status(403).json({ error: 'Only the sender can edit this message.' });
  }

  msg.content = content.trim();
  msg.isEdited = true;
  msg.updatedAt = new Date().toISOString();
  saveDB(db);

  const conv = db.conversations.find((c) => c.id === convId);
  if (conv) {
    broadcastToUsers(conv.memberIds, 'message:update', msg);
  }

  return res.json({ message: msg });
});

// 11. Delete Message
app.delete('/api/conversations/:id/messages/:msgId', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id: convId, msgId } = req.params;
  const msg = db.messages.find((m) => m.id === msgId && m.conversationId === convId);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  if (msg.senderId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to delete this message.' });
  }

  msg.isDeleted = true;
  msg.content = 'This message was deleted.';
  msg.attachments = [];
  msg.updatedAt = new Date().toISOString();
  saveDB(db);

  const conv = db.conversations.find((c) => c.id === convId);
  if (conv) {
    broadcastToUsers(conv.memberIds, 'message:delete', { messageId: msgId, conversationId: convId });
  }

  return res.json({ success: true, message: msg });
});

// 12. Toggle Pin Message
app.post('/api/conversations/:id/messages/:msgId/pin', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id: convId, msgId } = req.params;
  const msg = db.messages.find((m) => m.id === msgId && m.conversationId === convId);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  msg.isPinned = !msg.isPinned;
  msg.updatedAt = new Date().toISOString();
  saveDB(db);

  const conv = db.conversations.find((c) => c.id === convId);
  if (conv) {
    broadcastToUsers(conv.memberIds, 'message:update', msg);
  }

  return res.json({ message: msg });
});

// 13. Toggle Message Reaction
app.post('/api/conversations/:id/messages/:msgId/react', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id: convId, msgId } = req.params;
  const { reaction } = req.body;

  const validReactions = ['❤️', '😂', '😮', '😢', '👍', '🔥'];
  if (!validReactions.includes(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction symbol.' });
  }

  const msg = db.messages.find((m) => m.id === msgId && m.conversationId === convId);
  if (!msg) return res.status(404).json({ error: 'Message not found.' });

  const existingIdx = msg.reactions.findIndex((r) => r.userId === user.id && r.reaction === reaction);
  if (existingIdx >= 0) {
    // Remove reaction
    msg.reactions.splice(existingIdx, 1);
  } else {
    // Add reaction
    msg.reactions.push({
      id: `r_${crypto.randomUUID().slice(0, 8)}`,
      messageId: msg.id,
      userId: user.id,
      reaction,
      createdAt: new Date().toISOString(),
    });
  }

  saveDB(db);

  const conv = db.conversations.find((c) => c.id === convId);
  if (conv) {
    broadcastToUsers(conv.memberIds, 'message:update', msg);
  }

  return res.json({ message: msg });
});

// 14. Mark Conversation As Read
app.post('/api/conversations/:id/read', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const convId = req.params.id;
  const conv = db.conversations.find((c) => c.id === convId);
  if (conv) {
    conv.lastRead[user.id] = new Date().toISOString();
    // mark messages read
    db.messages.forEach((m) => {
      if (m.conversationId === convId && !m.reads.includes(user.id)) {
        m.reads.push(user.id);
      }
    });
    saveDB(db);
    broadcastToUsers(conv.memberIds, 'conversation:read', { conversationId: convId, userId: user.id });
  }

  return res.json({ success: true });
});

// 15. Toggle Mute / Archive / Leave
app.post('/api/conversations/:id/mute', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const convId = req.params.id;
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

  if (conv.mutedBy.includes(user.id)) {
    conv.mutedBy = conv.mutedBy.filter((uid) => uid !== user.id);
  } else {
    conv.mutedBy.push(user.id);
  }
  saveDB(db);
  return res.json({ isMuted: conv.mutedBy.includes(user.id) });
});

app.post('/api/conversations/:id/archive', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const convId = req.params.id;
  const conv = db.conversations.find((c) => c.id === convId);
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' });

  if (conv.archivedBy.includes(user.id)) {
    conv.archivedBy = conv.archivedBy.filter((uid) => uid !== user.id);
  } else {
    conv.archivedBy.push(user.id);
  }
  saveDB(db);
  return res.json({ isArchived: conv.archivedBy.includes(user.id) });
});

// Group Member Management
app.post('/api/conversations/:id/members', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const convId = req.params.id;
  const { userIdToAdd } = req.body;
  const conv = db.conversations.find((c) => c.id === convId && c.isGroup);
  if (!conv) return res.status(404).json({ error: 'Group conversation not found.' });

  if (conv.memberRoles[user.id] !== 'admin' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Only group admins can add members.' });
  }

  if (!conv.memberIds.includes(userIdToAdd)) {
    conv.memberIds.push(userIdToAdd);
    conv.memberRoles[userIdToAdd] = 'member';
    conv.lastRead[userIdToAdd] = new Date().toISOString();
    saveDB(db);
    broadcastToUsers(conv.memberIds, 'conversation:member_joined', { conversationId: convId, userId: userIdToAdd });
  }

  return res.json({ success: true, memberIds: conv.memberIds });
});

app.delete('/api/conversations/:id/members/:targetId', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { id: convId, targetId } = req.params;
  const conv = db.conversations.find((c) => c.id === convId && c.isGroup);
  if (!conv) return res.status(404).json({ error: 'Group conversation not found.' });

  // Can remove if self (leaving group) or if admin
  if (user.id !== targetId && conv.memberRoles[user.id] !== 'admin' && user.role !== 'admin') {
    return res.status(403).json({ error: 'Not authorized to remove this member.' });
  }

  conv.memberIds = conv.memberIds.filter((id) => id !== targetId);
  delete conv.memberRoles[targetId];
  delete conv.lastRead[targetId];
  saveDB(db);

  broadcastToUsers([...conv.memberIds, targetId], 'conversation:member_left', {
    conversationId: convId,
    userId: targetId,
  });

  return res.json({ success: true });
});

// 16. Calls Log & Call History
app.post('/api/calls/log', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const { conversationId, callerId, receiverId, callType, status, durationSeconds, startedAt, endedAt } = req.body;
  const newCall = {
    id: `call_${crypto.randomUUID().slice(0, 8)}`,
    conversationId,
    callerId,
    receiverId,
    callType,
    status: status || 'completed',
    startedAt: startedAt || new Date().toISOString(),
    endedAt: endedAt || new Date().toISOString(),
    durationSeconds: durationSeconds || 0,
    createdAt: new Date().toISOString(),
  };

  db.calls.push(newCall);
  saveDB(db);

  return res.status(201).json({ call: newCall });
});

app.get('/api/calls/history', (req, res) => {
  const user = getAuthUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized.' });

  const userCalls = db.calls
    .filter((c) => c.callerId === user.id || c.receiverId === user.id)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .map((c) => {
      const caller = db.users.find((u) => u.id === c.callerId);
      const receiver = db.users.find((u) => u.id === c.receiverId);
      return {
        ...c,
        caller: caller
          ? {
              id: caller.id,
              email: caller.email,
              displayName: caller.displayName,
              username: caller.username,
              avatarUrl: caller.avatarUrl,
              bio: caller.bio,
              role: caller.role,
              status: caller.status,
              isOnline: clients.has(caller.id),
              lastSeen: caller.lastSeen,
              createdAt: caller.createdAt,
            }
          : undefined,
        receiver: receiver
          ? {
              id: receiver.id,
              email: receiver.email,
              displayName: receiver.displayName,
              username: receiver.username,
              avatarUrl: receiver.avatarUrl,
              bio: receiver.bio,
              role: receiver.role,
              status: receiver.status,
              isOnline: clients.has(receiver.id),
              lastSeen: receiver.lastSeen,
              createdAt: receiver.createdAt,
            }
          : undefined,
      };
    });

  return res.json({ calls: userCalls });
});

// 16b. Founder Profile Endpoints
app.get('/api/founder', (_req, res) => {
  const founder = db.users.find((u) => u.role === 'founder') || db.users[0];
  return res.json({
    founder: {
      id: founder.id,
      displayName: founder.displayName || 'Arafat Sani',
      username: founder.username || 'arafat_sani',
      avatarUrl: founder.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArafatSani',
      coverUrl: founder.coverUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      bio: founder.bio || 'Founder & Lead Developer of Private Connect.',
      founderTitle: founder.founderTitle || 'Founder & Lead Developer',
      responsibility: founder.responsibility || 'Product Development, Technical Architecture and Platform Management.',
      contactLinks: founder.contactLinks || {
        github: 'https://github.com',
        website: 'https://privateconnect.internal',
        email: 'arafat@privateconnect.internal',
      },
      role: 'founder',
      productName: 'Private Connect',
      developerCredit: 'Designed & Developed by Arafat Sani',
    },
  });
});

app.put('/api/founder/profile', (req, res) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'founder') {
    return res.status(403).json({ error: 'Founder authorization required to update official profile.' });
  }

  const { displayName, bio, avatarUrl, coverUrl, founderTitle, responsibility, contactLinks } = req.body;
  if (displayName) user.displayName = displayName.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (avatarUrl) user.avatarUrl = avatarUrl;
  if (coverUrl !== undefined) user.coverUrl = coverUrl;
  if (founderTitle) user.founderTitle = founderTitle.trim();
  if (responsibility) user.responsibility = responsibility.trim();
  if (contactLinks) user.contactLinks = contactLinks;

  saveDB(db);
  broadcastToAll('user:updated', user);
  return res.json({ founder: user });
});

// 17. Admin Dashboard Endpoints (Accessible by Founder & Admin)
app.get('/api/admin/stats', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'founder')) {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }

  const stats = {
    totalUsers: db.users.length,
    approvedUsers: db.users.filter((u) => u.status === 'approved').length,
    pendingUsers: db.users.filter((u) => u.status === 'pending').length,
    rejectedUsers: db.users.filter((u) => u.status === 'rejected').length,
    suspendedUsers: db.users.filter((u) => u.status === 'suspended').length,
    activeOnlineUsers: Array.from(clients.keys()).length,
    totalConversations: db.conversations.length,
    groupConversations: db.conversations.filter((c) => c.isGroup).length,
    totalMessages: db.messages.length,
    totalCalls: db.calls.length,
    totalInvitations: db.invitations.length,
  };

  return res.json({ stats });
});

app.get('/api/admin/users', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'founder')) {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }

  return res.json({
    users: db.users.map((u) => ({
      ...u,
      isOnline: clients.has(u.id),
    })),
  });
});

app.post('/api/admin/users/:id/status', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'founder')) {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }

  const { id: targetId } = req.params;
  const { status, role } = req.body;

  const target = db.users.find((u) => u.id === targetId);
  if (!target) return res.status(404).json({ error: 'User not found.' });

  // Security: Protect Founder account from suspension or role alteration
  if (target.role === 'founder') {
    return res.status(403).json({ error: 'The Founder profile and role are immutable.' });
  }

  // Security: Prevent assigning the founder role
  if (role === 'founder') {
    return res.status(403).json({ error: 'The Founder role cannot be assigned to another user.' });
  }

  // Security: Only Founder can grant or revoke admin roles
  if (role && role !== target.role && user.role !== 'founder') {
    return res.status(403).json({ error: 'Only the Founder can grant or revoke administrator roles.' });
  }

  if (target.id === user.id && (status === 'suspended' || status === 'rejected')) {
    return res.status(400).json({ error: 'Cannot suspend or reject your own account.' });
  }

  if (status) {
    target.status = status;
    // Auto-join general group if newly approved
    if (status === 'approved') {
      const mainGroup = db.conversations.find((c) => c.isGroup && c.name?.includes('Private Connect Core Team'));
      if (mainGroup && !mainGroup.memberIds.includes(target.id)) {
        mainGroup.memberIds.push(target.id);
        mainGroup.memberRoles[target.id] = 'member';
        mainGroup.lastRead[target.id] = new Date().toISOString();
      }
    }
  }

  if (role) {
    target.role = role;
  }

  saveDB(db);

  broadcastToAll('user:updated', target);
  return res.json({ user: target });
});

app.get('/api/admin/invitations', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'founder')) {
    return res.status(403).json({ error: 'Administrative privileges required.' });
  }

  const list = db.invitations.map((inv) => {
    const creator = db.users.find((u) => u.id === inv.createdBy);
    return {
      ...inv,
      creatorName: creator?.displayName || 'Admin',
    };
  });

  return res.json({ invitations: list });
});

app.post('/api/admin/invitations', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'founder')) {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }

  const { email, role = 'member' } = req.body;
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const code = `CONNECT-${randomSuffix}`;

  const newInv = {
    id: `inv_${crypto.randomUUID().slice(0, 8)}`,
    code,
    email: email ? email.trim().toLowerCase() : undefined,
    createdBy: user.id,
    role: role as 'admin' | 'member',
    status: 'pending' as const,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  db.invitations.push(newInv);
  saveDB(db);

  return res.status(201).json({ invitation: newInv });
});

app.post('/api/admin/invitations/:id/revoke', (req, res) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'founder')) {
    return res.status(403).json({ error: 'Admin privileges required.' });
  }

  const { id } = req.params;
  const inv = db.invitations.find((i) => i.id === id);
  if (!inv) return res.status(404).json({ error: 'Invitation not found.' });

  inv.status = 'revoked';
  saveDB(db);

  return res.json({ success: true, invitation: inv });
});

// 18. Attach Vite Middlewares for React Client in Development
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Private Connect Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
