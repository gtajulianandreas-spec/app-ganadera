import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { switchDatabaseTenant } from '../db';
import { syncEngine } from '../sync/engine';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  fullName: string;
  avatarUrl: string | null;
  role: string;
}

export interface AuthIdentityInfo {
  provider: 'password' | 'google';
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface PrivacyConsentSummary {
  policyVersion: string;
  acceptedMarketing: boolean;
  consentedAt: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  acceptedPrivacyPolicy: boolean;
  acceptedDataProcessing: boolean;
  acceptedMarketing: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  identities: AuthIdentityInfo[];
  latestConsent: PrivacyConsentSummary | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isOffline: boolean;
  backendConfigured: boolean;
  urlVerifyToken: string | null;
  urlResetToken: string | null;
  urlAuthError: string | null;
  clearUrlAuthParams: () => void;
  refreshSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; code?: string }>;
  register: (payload: RegisterPayload) => Promise<{ ok: boolean; message?: string; error?: string }>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<{ ok: boolean; message?: string; error?: string }>;
  forgotPassword: (email: string) => Promise<{ ok: boolean; message?: string; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ ok: boolean; message?: string; error?: string }>;
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_PROFILE_SNAPSHOT_KEY = 'ag_user_profile_snapshot';

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)ag_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function readCachedUserSnapshot(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeCachedUserSnapshot(user: AuthUser | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_PROFILE_SNAPSHOT_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_PROFILE_SNAPSHOT_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readCachedUserSnapshot());
  const [identities, setIdentities] = useState<AuthIdentityInfo[]>([]);
  const [latestConsent, setLatestConsent] = useState<PrivacyConsentSummary | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [backendConfigured, setBackendConfigured] = useState(true);

  const [urlVerifyToken, setUrlVerifyToken] = useState<string | null>(null);
  const [urlResetToken, setUrlResetToken] = useState<string | null>(null);
  const [urlAuthError, setUrlAuthError] = useState<string | null>(null);

  const apiFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const method = (init.method || 'GET').toUpperCase();
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      const csrf = readCsrfCookie();
      if (csrf) {
        headers.set('X-CSRF-Token', csrf);
      }
    }
    return fetch(url, {
      ...init,
      headers,
      credentials: 'include',
    });
  }, []);

  // Partition local IndexedDB per authenticated user and wire cloud sync
  useEffect(() => {
    let cancelled = false;
    const userId = user?.id ?? null;

    syncEngine.configureCloudSync({ userId, apiFetch });
    switchDatabaseTenant(userId)
      .then(() => {
        if (!cancelled && userId && navigator.onLine) {
          void syncEngine.triggerSync();
        }
      })
      .catch((err) => {
        console.error('[DB TENANT SWITCH ERROR]', err);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, apiFetch]);

  const refreshSession = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      setIsLoadingAuth(false);
      return;
    }

    try {
      const res = await apiFetch('/api/auth/session');
      if (res.status === 503) {
        setIsOffline(true);
        return;
      }

      setIsOffline(false);

      if (res.status === 401) {
        setUser(null);
        writeCachedUserSnapshot(null);
        setIdentities([]);
        setLatestConsent(null);
        return;
      }

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setBackendConfigured(data.backendConfigured !== false);

      if (data.authenticated && data.user) {
        setUser(data.user);
        writeCachedUserSnapshot(data.user);
        setIdentities(data.identities || []);
        setLatestConsent(data.latestConsent || null);
      } else {
        setUser(null);
        writeCachedUserSnapshot(null);
        setIdentities([]);
        setLatestConsent(null);
      }
    } catch {
      // Network unreachable: preserve cached display profile when offline
      setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : true);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const vt = params.get('verify_token');
      const rt = params.get('reset_token');
      const ae = params.get('auth_error');
      if (vt || rt || ae) {
        if (vt) setUrlVerifyToken(vt);
        if (rt) setUrlResetToken(rt);
        if (ae) setUrlAuthError(ae);
        // Strip sensitive single-use tokens from browser URL/history immediately
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('verify_token');
        cleanUrl.searchParams.delete('reset_token');
        cleanUrl.searchParams.delete('auth_error');
        window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search);
      }
    }

    refreshSession();

    const handleOnline = () => {
      setIsOffline(false);
      refreshSession();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshSession]);

  const clearUrlAuthParams = useCallback(() => {
    setUrlVerifyToken(null);
    setUrlResetToken(null);
    setUrlAuthError(null);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error || 'No se pudo iniciar sesión.', code: data.code };
      }
      await refreshSession();
      return { ok: true };
    } catch {
      return { ok: false, error: 'Sin conexión a internet. Conéctate para iniciar sesión.' };
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data.error || 'No se pudo completar el registro.' };
      }
      return { ok: true, message: data.message };
    } catch {
      return { ok: false, error: 'Sin conexión a internet. Conéctate para crear tu cuenta.' };
    }
  };

  const logout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    writeCachedUserSnapshot(null);
    setIdentities([]);
    setLatestConsent(null);
  };

  const verifyEmail = async (token: string) => {
    try {
      const res = await apiFetch('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || 'Token de verificación inválido.' };
      await refreshSession();
      return { ok: true, message: data.message };
    } catch {
      return { ok: false, error: 'Sin conexión a internet para verificar el correo.' };
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || 'Error al solicitar recuperación.' };
      return { ok: true, message: data.message };
    } catch {
      return { ok: false, error: 'Sin conexión a internet para enviar la recuperación.' };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: data.error || 'No se pudo restablecer la contraseña.' };
      return { ok: true, message: data.message };
    } catch {
      return { ok: false, error: 'Sin conexión a internet para restablecer la contraseña.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        identities,
        latestConsent,
        isAuthenticated: !!user,
        isLoadingAuth,
        isOffline,
        backendConfigured,
        urlVerifyToken,
        urlResetToken,
        urlAuthError,
        clearUrlAuthParams,
        refreshSession,
        login,
        register,
        logout,
        verifyEmail,
        forgotPassword,
        resetPassword,
        apiFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
