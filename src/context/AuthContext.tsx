import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { UserProfile, CategoryItem, CatalogSkill } from '../types.ts';

interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

interface PendingVerificationState {
  email: string;
  codePreview?: string;
}

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  categories: CategoryItem[];
  catalogSkills: CatalogSkill[];
  unreadNotifications: number;
  pendingVerification: PendingVerificationState | null;
  setPendingVerification: (v: PendingVerificationState | null) => void;
  signInWithGoogle: () => Promise<UserProfile | null>;
  loginWithEmail: (email: string, password: string) => Promise<{
    profile?: UserProfile;
    requiresVerification?: boolean;
    email?: string;
    verificationCodePreview?: string;
  }>;
  registerWithEmail: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{
    email: string;
    verificationCodePreview?: string;
  }>;
  verifyEmailCode: (email: string, code: string) => Promise<UserProfile>;
  resendVerificationCode: (email: string) => Promise<string | undefined>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshCatalog: () => Promise<void>;
  apiFetch: <T = any>(path: string, options?: RequestInit) => Promise<T>;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [catalogSkills, setCatalogSkills] = useState<CatalogSkill[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [pendingVerification, setPendingVerification] = useState<PendingVerificationState | null>(
    null
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Store authentication token in memory (never in localStorage)
  const tokenRef = useRef<string | null>(null);

  const showToast = useCallback(
    (text: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const getActiveToken = useCallback(async (): Promise<string | null> => {
    if (auth.currentUser) {
      try {
        const fbToken = await auth.currentUser.getIdToken();
        tokenRef.current = fbToken;
        return fbToken;
      } catch {
        // Fallback to memory token
      }
    }
    return tokenRef.current;
  }, []);

  const apiFetch = useCallback(
    async <T = any>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = await getActiveToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(path, {
        ...options,
        headers,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err: any = new Error(data.error || `Request failed (${res.status})`);
        err.status = res.status;
        err.data = data;
        throw err;
      }
      return data as T;
    },
    [getActiveToken]
  );

  const refreshCatalog = useCallback(async () => {
    try {
      const data = await fetch('/api/catalog').then((r) => r.json());
      if (data.categories) setCategories(data.categories);
      if (data.skills) setCatalogSkills(data.skills);
    } catch (err) {
      console.error('Failed to fetch skills catalog:', err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const token = await getActiveToken();
      if (!token) {
        setProfile(null);
        return;
      }
      const data = await apiFetch<{ profile: UserProfile }>('/api/auth/me');
      setProfile(data.profile);

      const notifData = await apiFetch<{ unreadCount: number }>('/api/notifications');
      setUnreadNotifications(notifData.unreadCount || 0);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  }, [apiFetch, getActiveToken]);

  useEffect(() => {
    refreshCatalog();
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          tokenRef.current = idToken;
          const data = await apiFetch<{ profile: UserProfile }>('/api/auth/me');
          setProfile(data.profile);
          const notifData = await apiFetch<{ unreadCount: number }>('/api/notifications');
          setUnreadNotifications(notifData.unreadCount || 0);
        } catch (err: any) {
          console.error('Error syncing Firebase user:', err);
          if (err?.status === 403) {
            showToast(err.message || 'Account access restricted.', 'error');
          }
          setProfile(null);
        }
      } else if (!tokenRef.current) {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [apiFetch, refreshCatalog, showToast]);

  const signInWithGoogle = async (): Promise<UserProfile | null> => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    const idToken = await cred.user.getIdToken();
    tokenRef.current = idToken;
    const data = await apiFetch<{ profile: UserProfile }>('/api/auth/me');
    setProfile(data.profile);
    const notifData = await apiFetch<{ unreadCount: number }>('/api/notifications');
    setUnreadNotifications(notifData.unreadCount || 0);
    showToast(`Welcome back, ${data.profile.fullName}!`, 'success');
    return data.profile;
  };

  const registerWithEmail = async (fullName: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }
    setPendingVerification({
      email: data.email,
      codePreview: data.verificationCodePreview,
    });
    showToast('Account created! Please verify your email address.', 'info');
    return {
      email: data.email,
      verificationCodePreview: data.verificationCodePreview,
    };
  };

  const verifyEmailCode = async (email: string, code: string): Promise<UserProfile> => {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Verification failed.');
    }
    tokenRef.current = data.token;
    setProfile(data.profile);
    setPendingVerification(null);
    showToast('Email verified! Welcome to SkillBridge.', 'success');
    return data.profile;
  };

  const resendVerificationCode = async (email: string): Promise<string | undefined> => {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend verification email.');
    }
    setPendingVerification({
      email: data.email,
      codePreview: data.verificationCodePreview,
    });
    showToast('Verification email resent!', 'info');
    return data.verificationCodePreview;
  };

  const loginWithEmail = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.requiresVerification) {
        setPendingVerification({
          email: data.email || email,
          codePreview: data.verificationCodePreview,
        });
        return {
          requiresVerification: true,
          email: data.email || email,
          verificationCodePreview: data.verificationCodePreview,
        };
      }
      throw new Error(data.error || 'Invalid credentials.');
    }

    tokenRef.current = data.token;
    setProfile(data.profile);
    const notifData = await apiFetch<{ unreadCount: number }>('/api/notifications').catch(() => ({
      unreadCount: 0,
    }));
    setUnreadNotifications(notifData.unreadCount || 0);
    showToast(`Signed in as ${data.profile.fullName}`, 'success');
    return { profile: data.profile };
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore if not signed in via Firebase
    }
    tokenRef.current = null;
    setProfile(null);
    setUnreadNotifications(0);
    showToast('You have been logged out.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        loading,
        categories,
        catalogSkills,
        unreadNotifications,
        pendingVerification,
        setPendingVerification,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        verifyEmailCode,
        resendVerificationCode,
        logout,
        refreshProfile,
        refreshCatalog,
        apiFetch,
        showToast,
      }}
    >
      {children}
      {/* Toast Notifications Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto glass-level-3 flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl text-xs font-semibold tracking-tight transition-all ${
              t.type === 'error'
                ? 'border-red-500/40 text-red-200'
                : t.type === 'info'
                ? 'border-cyan-400/35 text-cyan-100'
                : 'border-emerald-400/35 text-emerald-100'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  t.type === 'error'
                    ? 'bg-red-400'
                    : t.type === 'info'
                    ? 'bg-cyan-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span>{t.text}</span>
            </div>
          </div>
        ))}
      </div>
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
