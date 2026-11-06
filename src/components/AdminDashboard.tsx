import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, UserInvitation } from '../types';
import {
  Shield,
  X,
  Users,
  UserCheck,
  Clock,
  MessageSquare,
  Phone,
  Key,
  Copy,
  Check,
  Ban,
  RefreshCw,
  Plus,
  Award,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFounderProfile?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  onOpenFounderProfile,
}) => {
  const { currentUser, isFounder } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'invitations'>('pending');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [founderInfo, setFounderInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // New invitation form
  const [newInvEmail, setNewInvEmail] = useState('');
  const [newInvRole, setNewInvRole] = useState<'admin' | 'member'>('member');
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, invRes, founderRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminInvitations(),
        api.getFounderProfile().catch(() => ({ founder: null })),
      ]);
      setStats(statsRes.stats);
      setUsers(usersRes.users);
      setInvitations(invRes.invitations);
      if (founderRes?.founder) {
        setFounderInfo(founderRes.founder);
      }
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      await api.updateUserStatus(userId, newStatus);
      setActionMessage(`User status updated to ${newStatus}.`);
      setTimeout(() => setActionMessage(null), 2500);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleToggleRole = async (targetUser: UserProfile) => {
    if (!isFounder) {
      alert('Only Founder Arafat Sani can assign or alter administrator privileges.');
      return;
    }
    if (targetUser.role === 'founder') {
      alert('The Founder role is permanent and cannot be modified.');
      return;
    }

    try {
      const newRole = targetUser.role === 'admin' ? 'member' : 'admin';
      await api.updateUserStatus(targetUser.id, '', newRole);
      setActionMessage(`${targetUser.displayName} role updated to ${newRole}.`);
      setTimeout(() => setActionMessage(null), 2500);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle role');
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      await api.createInvitation({
        email: newInvEmail.trim() || undefined,
        role: newInvRole,
      });
      setNewInvEmail('');
      await loadData();
    } catch (e) {
      console.error('Failed to create invitation:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    try {
      await api.revokeInvitation(id);
      await loadData();
    } catch (e) {
      console.error('Failed to revoke invitation:', e);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const pendingUsersList = users.filter((u) => u.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Administration & Governance Console
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {isFounder ? 'Founder Mode' : 'Admin Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Secure access clearance, member lifecycle, and role governance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto">
          {/* Action Notification */}
          {actionMessage && (
            <div className="mx-5 mt-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Founder Profile Spotlight Card */}
          <div className="m-5 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-indigo-900/40 relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <img
                    src={founderInfo?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=ArafatSani'}
                    alt="Arafat Sani"
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-400/80 shadow-md bg-slate-800"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-slate-950 rounded-full ring-2 ring-slate-900">
                    <Award className="w-3 h-3 fill-slate-950 text-slate-950" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {founderInfo?.displayName || 'Arafat Sani'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-amber-400 text-slate-950 shadow-xs">
                      Founder & Lead Developer
                    </span>
                  </div>
                  <p className="text-xs text-sky-200 mt-0.5 font-medium">
                    Private Connect · Technical Architecture & Platform Governance
                  </p>
                  <p className="text-[11px] text-slate-300/80 mt-1 max-w-lg leading-relaxed">
                    Designed & Developed by Arafat Sani. Direct authority over membership clearance, administrator appointments, and cryptographic security invariants.
                  </p>
                </div>
              </div>

              {onOpenFounderProfile && (
                <button
                  type="button"
                  onClick={onOpenFounderProfile}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl backdrop-blur-xs border border-white/20 transition-colors shrink-0"
                >
                  View Founder Profile
                </button>
              )}
            </div>
          </div>

          {/* Stats Strip */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 mb-5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-500">Total Users</span>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 shadow-2xs">
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Approval</span>
                </span>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5 tabular-nums">
                  {stats.pendingUsers}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <span className="text-[11px] font-medium text-emerald-600">Active Online</span>
                <p className="text-xl font-bold text-emerald-600 mt-0.5 tabular-nums">
                  {stats.activeOnlineUsers}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-500">Total Messages</span>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 tabular-nums">
                  {stats.totalMessages}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'border-[#0866FF] text-[#0866FF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Pending Requests</span>
              {pendingUsersList.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-extrabold rounded-full">
                  {pendingUsersList.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-[#0866FF] text-[#0866FF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              All Users ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('invitations')}
              className={`py-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'invitations'
                  ? 'border-[#0866FF] text-[#0866FF]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Invitation Codes ({invitations.length})
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-5">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading console data...</div>
            ) : activeTab === 'pending' ? (
              /* PENDING APPROVALS QUEUE */
              <div>
                {pendingUsersList.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      All Registration Requests Cleared
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      There are currently no accounts waiting for administrative approval.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 mb-2 font-medium">
                      The following accounts registered without an invitation code and require approval from Founder Arafat Sani or an administrator before they can access private conversations.
                    </p>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                      {pendingUsersList.map((u) => (
                        <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                              alt={u.displayName}
                              className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {u.displayName}
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400">@{u.username}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{u.email}</p>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                Registered: {new Date(u.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(u.id, 'rejected')}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(u.id, 'approved')}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve Access</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'users' ? (
              /* ALL REGISTERED USERS */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                      <th className="pb-3 pl-2">User</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right pr-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => {
                      const isTargetFounder = u.role === 'founder';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-3 pl-2 flex items-center gap-2.5">
                            <img
                              src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`}
                              alt={u.displayName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-slate-900 dark:text-slate-100">
                                  {u.displayName}
                                </p>
                                {isTargetFounder && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                                    FOUNDER
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">@{u.username}</p>
                            </div>
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-400">{u.email}</td>
                          <td className="py-3">
                            {isTargetFounder ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                Founder (Fixed)
                              </span>
                            ) : isFounder ? (
                              <button
                                type="button"
                                onClick={() => handleToggleRole(u)}
                                className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
                                title="Click to toggle Admin / Member role"
                              >
                                {u.role}
                              </button>
                            ) : (
                              <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {u.role}
                              </span>
                            )}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                u.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : u.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                                  : u.status === 'rejected'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                  : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 text-right pr-2 space-x-1.5">
                            {isTargetFounder ? (
                              <span className="text-[10px] text-slate-400 italic font-medium">
                                Immutable Authority
                              </span>
                            ) : (
                              <>
                                {u.status === 'pending' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(u.id, 'approved')}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(u.id, 'rejected')}
                                      className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-semibold transition-colors"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {u.status === 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(u.id, 'suspended')}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-semibold transition-colors"
                                  >
                                    Suspend
                                  </button>
                                )}
                                {u.status === 'rejected' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(u.id, 'approved')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                                  >
                                    Clear & Approve
                                  </button>
                                )}
                                {u.status === 'suspended' && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(u.id, 'approved')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                                  >
                                    Reactivate
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* INVITATION CODES */
              <div className="space-y-6">
                <form
                  onSubmit={handleCreateInvitation}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-end gap-3"
                >
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Assignee Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={newInvEmail}
                      onChange={(e) => setNewInvEmail(e.target.value)}
                      placeholder="partner@company.com"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Role
                    </label>
                    <select
                      value={newInvRole}
                      onChange={(e) => setNewInvRole(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#0866FF]"
                    >
                      <option value="member">Member</option>
                      {isFounder && <option value="admin">Admin</option>}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0866FF] hover:bg-[#0756d6] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Generate Code</span>
                  </button>
                </form>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                        <th className="pb-3 pl-2">Invite Code</th>
                        <th className="pb-3">Role</th>
                        <th className="pb-3">Assigned To</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right pr-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {invitations.map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-3 pl-2 font-mono font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{inv.code}</span>
                            <button
                              type="button"
                              onClick={() => copyCode(inv.code)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-sm"
                              title="Copy code"
                            >
                              {copiedCode === inv.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 capitalize text-slate-600 dark:text-slate-400">{inv.role}</td>
                          <td className="py-3 text-slate-500">{inv.email || 'Any authorized registrant'}</td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                                inv.status === 'pending'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 text-right pr-2">
                            {inv.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleRevokeInvitation(inv.id)}
                                className="text-red-500 hover:underline text-[11px]"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
