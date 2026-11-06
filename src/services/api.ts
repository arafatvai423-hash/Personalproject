import { UserProfile, Conversation, Message, CallRecord, UserInvitation } from '../types';

const API_BASE = '/api';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pc_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-user-id'] = token;
    }
    return headers;
  }

  async get<T>(url: string): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network request failed' }));
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network request failed' }));
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network request failed' }));
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  async delete<T>(url: string): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network request failed' }));
      throw new Error(err.error || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  // Auth
  async login(credential: string, password: string) {
    return this.post<{ user: UserProfile; token: string }>('/auth/login', { credential, password });
  }

  async register(data: { email: string; password: string; displayName: string; username: string; inviteCode?: string }) {
    return this.post<{ user?: UserProfile; token?: string; message?: string; status?: string }>('/auth/register', data);
  }

  async getMe() {
    return this.get<{ user: UserProfile }>('/auth/me');
  }

  async updateProfile(data: { displayName?: string; bio?: string; avatarUrl?: string }) {
    return this.put<{ user: UserProfile }>('/users/profile', data);
  }

  // Users
  async getUsers() {
    return this.get<{ users: UserProfile[] }>('/users');
  }

  // Conversations
  async getConversations() {
    return this.get<{ conversations: Conversation[] }>('/conversations');
  }

  async createConversation(data: { isGroup: boolean; targetUserId?: string; name?: string; description?: string; memberIds?: string[] }) {
    return this.post<{ conversation: Conversation }>('/conversations', data);
  }

  async toggleMute(conversationId: string) {
    return this.post<{ isMuted: boolean }>(`/conversations/${conversationId}/mute`);
  }

  async toggleArchive(conversationId: string) {
    return this.post<{ isArchived: boolean }>(`/conversations/${conversationId}/archive`);
  }

  async addGroupMember(conversationId: string, userIdToAdd: string) {
    return this.post<{ success: boolean; memberIds: string[] }>(`/conversations/${conversationId}/members`, { userIdToAdd });
  }

  async removeGroupMember(conversationId: string, targetId: string) {
    return this.delete<{ success: boolean }>(`/conversations/${conversationId}/members/${targetId}`);
  }

  // Messages
  async getMessages(conversationId: string) {
    return this.get<{ messages: Message[] }>(`/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, data: { content: string; messageType?: string; replyToId?: string; attachments?: any[] }) {
    return this.post<{ message: Message }>(`/conversations/${conversationId}/messages`, data);
  }

  async editMessage(conversationId: string, messageId: string, content: string) {
    return this.put<{ message: Message }>(`/conversations/${conversationId}/messages/${messageId}`, { content });
  }

  async deleteMessage(conversationId: string, messageId: string) {
    return this.delete<{ success: boolean }>(`/conversations/${conversationId}/messages/${messageId}`);
  }

  async togglePin(conversationId: string, messageId: string) {
    return this.post<{ message: Message }>(`/conversations/${conversationId}/messages/${messageId}/pin`);
  }

  async toggleReaction(conversationId: string, messageId: string, reaction: string) {
    return this.post<{ message: Message }>(`/conversations/${conversationId}/messages/${messageId}/react`, { reaction });
  }

  async markAsRead(conversationId: string) {
    return this.post<{ success: boolean }>(`/conversations/${conversationId}/read`);
  }

  // Calls
  async logCall(data: any) {
    return this.post<{ call: CallRecord }>('/calls/log', data);
  }

  async getCallHistory() {
    return this.get<{ calls: CallRecord[] }>('/calls/history');
  }

  // Admin
  async getAdminStats() {
    return this.get<{ stats: any }>('/admin/stats');
  }

  async getAdminUsers() {
    return this.get<{ users: UserProfile[] }>('/admin/users');
  }

  async updateUserStatus(targetId: string, status: string, role?: string) {
    return this.post<{ user: UserProfile }>(`/admin/users/${targetId}/status`, { status, role });
  }

  async getAdminInvitations() {
    return this.get<{ invitations: UserInvitation[] }>('/admin/invitations');
  }

  async createInvitation(data: { email?: string; role?: string }) {
    return this.post<{ invitation: UserInvitation }>('/admin/invitations', data);
  }

  async revokeInvitation(invitationId: string) {
    return this.post<{ success: boolean }>(`/admin/invitations/${invitationId}/revoke`);
  }

  // Founder
  async getFounderProfile() {
    return this.get<{ founder: UserProfile & { productName: string; developerCredit: string } }>('/founder');
  }

  async updateFounderProfile(data: {
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    coverUrl?: string;
    founderTitle?: string;
    responsibility?: string;
    contactLinks?: { github?: string; website?: string; email?: string };
  }) {
    return this.put<{ founder: UserProfile }>('/founder/profile', data);
  }

  async checkApprovalStatus(params: { userId?: string; email?: string }) {
    const query = params.userId ? `userId=${encodeURIComponent(params.userId)}` : `email=${encodeURIComponent(params.email || '')}`;
    return this.get<{ id: string; displayName: string; username: string; role: string; status: string }>(`/auth/status?${query}`);
  }
}

export const api = new ApiService();
