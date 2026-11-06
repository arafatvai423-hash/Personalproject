import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { sound } from '../services/sound';

interface PendingAccount {
  id: string;
  email?: string;
  displayName: string;
  username: string;
  status: 'pending' | 'rejected' | 'suspended';
  message?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  pendingUser: PendingAccount | null;
  isAuthenticated: boolean;
  isFounder: boolean;
  isAdminOrFounder: boolean;
  isLoading: boolean;
  theme: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  readReceiptsEnabled: boolean;
  onlineVisibility: boolean;
  login: (cred: string, pass: string) => Promise<{ success: boolean; error?: string; status?: string }>;
  register: (data: { email: string; password: string; displayName: string; username: string; inviteCode?: string }) => Promise<{ success: boolean; message?: string; error?: string; status?: string }>;
  logout: () => void;
  updateProfile: (data: { displayName?: string; bio?: string; avatarUrl?: string; coverUrl?: string }) => Promise<void>;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setSoundEnabled: (enabled: boolean) => void;
  setReadReceiptsEnabled: (enabled: boolean) => void;
  setOnlineVisibility: (visible: boolean) => void;
  refreshUser: () => Promise<void>;
  checkPendingStatus: () => Promise<boolean>;
  clearPendingUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingUser, setPendingUser] = useState<PendingAccount | null>(() => {
    try {
      const stored = localStorage.getItem('pc_pending_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('pc_theme') as any) || 'light';
  });
  const [soundEnabled, setSoundEnabledState] = useState(() => sound.getSoundEnabled());
  const [readReceiptsEnabled, setReadReceiptsState] = useState(() => {
    return localStorage.getItem('pc_read_receipts') !== 'false';
  });
  const [onlineVisibility, setOnlineVisibilityState] = useState(() => {
    return localStorage.getItem('pc_online_visibility') !== 'false';
  });

  // Apply theme to HTML root element
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('pc_theme', theme);
  }, [theme]);

  // Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('pc_token');
      if (token) {
        try {
          const res = await api.getMe();
          if (res.user) {
            setCurrentUser(res.user);
            socket.connect(res.user.id);
          } else {
            localStorage.removeItem('pc_token');
          }
        } catch (e) {
          console.warn('Initial session restore failed:', e);
          localStorage.removeItem('pc_token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen to user updates via socket
    const cleanup = socket.on('user:updated', (updatedUser: UserProfile) => {
      setCurrentUser((prev) => (prev && prev.id === updatedUser.id ? { ...prev, ...updatedUser } : prev));
    });

    return () => {
      cleanup();
    };
  }, []);

  const login = async (cred: string, pass: string) => {
    try {
      const res = await api.login(cred, pass);
      if (res.user && res.token) {
        localStorage.setItem('pc_token', res.token);
        localStorage.removeItem('pc_pending_user');
        setPendingUser(null);
        setCurrentUser(res.user);
        socket.connect(res.user.id);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (err: any) {
      if (err.status === 'pending' || err.status === 'rejected' || err.status === 'suspended') {
        const pUser: PendingAccount = {
          id: err.user?.id || '',
          email: err.user?.email || cred,
          displayName: err.user?.displayName || 'Registered User',
          username: err.user?.username || cred,
          status: err.status,
          message: err.message || err.error,
        };
        setPendingUser(pUser);
        localStorage.setItem('pc_pending_user', JSON.stringify(pUser));
        return { success: false, status: err.status, error: err.error || err.message };
      }
      return { success: false, error: err.message || 'Login failed', status: err.status };
    }
  };

  const register = async (data: { email: string; password: string; displayName: string; username: string; inviteCode?: string }) => {
    try {
      const res = await api.register(data);
      if (res.token && res.user) {
        localStorage.setItem('pc_token', res.token);
        localStorage.removeItem('pc_pending_user');
        setPendingUser(null);
        setCurrentUser(res.user);
        socket.connect(res.user.id);
        return { success: true, message: 'Account registered and approved!' };
      }
      if (res.status === 'pending') {
        const pUser: PendingAccount = {
          id: res.user?.id || '',
          email: data.email,
          displayName: data.displayName,
          username: data.username,
          status: 'pending',
          message: res.message,
        };
        setPendingUser(pUser);
        localStorage.setItem('pc_pending_user', JSON.stringify(pUser));
        return { success: false, status: 'pending', message: res.message };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const checkPendingStatus = async (): Promise<boolean> => {
    if (!pendingUser) return false;
    try {
      const res = await api.checkApprovalStatus({ userId: pendingUser.id, email: pendingUser.email });
      if (res && res.status === 'approved') {
        // Status has been approved by Founder / Admin!
        setPendingUser(null);
        localStorage.removeItem('pc_pending_user');
        return true;
      } else if (res && res.status) {
        setPendingUser((prev) => prev ? { ...prev, status: res.status as any } : null);
      }
      return false;
    } catch {
      return false;
    }
  };

  const clearPendingUser = () => {
    setPendingUser(null);
    localStorage.removeItem('pc_pending_user');
  };

  const logout = () => {
    localStorage.removeItem('pc_token');
    localStorage.removeItem('pc_pending_user');
    setPendingUser(null);
    socket.disconnect();
    setCurrentUser(null);
  };

  const updateProfile = async (data: { displayName?: string; bio?: string; avatarUrl?: string; coverUrl?: string }) => {
    const res = await api.updateProfile(data);
    if (res.user) {
      setCurrentUser(res.user);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.user) {
        setCurrentUser(res.user);
      }
    } catch (e) {}
  };

  const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setThemeState(newTheme);
  };

  const setSoundEnabled = (enabled: boolean) => {
    sound.setSoundEnabled(enabled);
    setSoundEnabledState(enabled);
  };

  const setReadReceiptsEnabled = (enabled: boolean) => {
    setReadReceiptsState(enabled);
    localStorage.setItem('pc_read_receipts', String(enabled));
  };

  const setOnlineVisibility = (visible: boolean) => {
    setOnlineVisibilityState(visible);
    localStorage.setItem('pc_online_visibility', String(visible));
  };

  const isFounder = currentUser?.role === 'founder';
  const isAdminOrFounder = isFounder || currentUser?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        pendingUser,
        isAuthenticated: !!currentUser,
        isFounder,
        isAdminOrFounder,
        isLoading,
        theme,
        soundEnabled,
        readReceiptsEnabled,
        onlineVisibility,
        login,
        register,
        logout,
        updateProfile,
        setTheme,
        setSoundEnabled,
        setReadReceiptsEnabled,
        setOnlineVisibility,
        refreshUser,
        checkPendingStatus,
        clearPendingUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
