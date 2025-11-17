'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type AuthUser = {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAdmin?: boolean;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
};

type StoredAuthState = {
  user: AuthUser;
  token: string;
};

type LoginPayload = {
  user: AuthUser;
  token: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginPayload, options?: { persist?: boolean }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL &&
  process.env.NEXT_PUBLIC_BACKEND_URL !== 'undefined'
    ? process.env.NEXT_PUBLIC_BACKEND_URL
    : undefined;

const sanitizeUser = (user: unknown): AuthUser => {
  if (!user || typeof user !== 'object') {
    return {
      id: '',
      email: '',
      username: null,
      firstName: null,
      lastName: null,
      avatarUrl: null,
    };
  }

  const record = user as Record<string, unknown>;
  const toNullableString = (value: unknown): string | null =>
    typeof value === 'string' && value.trim().length > 0 ? value : null;

  return {
    id: typeof record.id === 'string' || typeof record.id === 'number' ? String(record.id) : '',
    email:
      typeof record.email === 'string' && record.email.trim().length > 0
        ? record.email
        : '',
    username: toNullableString(record.username),
    firstName: toNullableString(record.firstName),
    lastName: toNullableString(record.lastName),
    avatarUrl: toNullableString(record.avatarUrl),
  };
};

const emptyState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(emptyState);
  const [loading, setLoading] = useState<boolean>(true);

  const persistState = useCallback((stored: StoredAuthState | null) => {
    if (stored) {
      localStorage.setItem('authState', JSON.stringify(stored));
    } else {
      localStorage.removeItem('authState');
    }
  }, []);

  const applyAuthState = useCallback(
    (next: AuthState, stored?: StoredAuthState | null) => {
      setState(next);
      if (typeof window !== 'undefined') {
        persistState(
          stored ??
            (next.isAuthenticated && next.user && next.token
              ? { user: next.user, token: next.token }
              : null)
        );
      }
    },
    [persistState]
  );

  const logout = useCallback(() => {
    applyAuthState(emptyState, null);
  }, [applyAuthState]);

  const verifyToken = useCallback(async (token: string): Promise<AuthUser | null> => {
    if (!token) {
      return null;
    }

    if (!API_URL) {
      console.warn('Auth verification skipped: NEXT_PUBLIC_BACKEND_URL is not configured.');
      return null;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (data?.success && data?.user) {
        return sanitizeUser(data.user);
      }
    } catch (error) {
      console.error('Failed to verify auth token', error);
    }

    return null;
  }, []);

  const login = useCallback(
    async (payload: LoginPayload, options: { persist?: boolean } = {}) => {
      const { persist = true } = options;
      const user = sanitizeUser(payload.user);
      const nextState: AuthState = {
        user,
        token: payload.token,
        isAuthenticated: true,
      };

      applyAuthState(nextState, persist ? { user, token: payload.token } : null);
    },
    [applyAuthState]
  );

  const hydrateFromStorage = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const storedRaw = localStorage.getItem('authState');
    if (!storedRaw) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedRaw) as StoredAuthState;
      if (!parsed?.token || !parsed?.user) {
        logout();
        setLoading(false);
        return;
      }

      if (!API_URL) {
        const user = sanitizeUser(parsed.user);
        applyAuthState(
          {
            isAuthenticated: true,
            user,
            token: parsed.token,
          },
          { user, token: parsed.token }
        );
        setLoading(false);
        return;
      }

      const verifiedUser = await verifyToken(parsed.token);
      if (verifiedUser) {
        applyAuthState(
          {
            isAuthenticated: true,
            user: verifiedUser,
            token: parsed.token,
          },
          { user: verifiedUser, token: parsed.token }
        );
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to restore auth state from storage', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [applyAuthState, logout, verifyToken]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      await hydrateFromStorage();
      if (isMounted) {
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [hydrateFromStorage]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== 'authState') return;

      if (!event.newValue) {
        logout();
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as StoredAuthState;
        if (parsed?.token && parsed?.user) {
          applyAuthState(
            {
              isAuthenticated: true,
              user: sanitizeUser(parsed.user),
              token: parsed.token,
            },
            parsed
          );
        }
      } catch (error) {
        console.error('Failed to sync auth state from storage event', error);
        logout();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [applyAuthState, logout]);

  const refreshUser = useCallback(async () => {
    if (!state.token) {
      return;
    }

    if (!API_URL) {
      console.warn('Auth refresh skipped: NEXT_PUBLIC_BACKEND_URL is not configured.');
      return;
    }

    const verifiedUser = await verifyToken(state.token);
    if (verifiedUser) {
      applyAuthState(
        {
          isAuthenticated: true,
          user: verifiedUser,
          token: state.token,
        },
        { user: verifiedUser, token: state.token }
      );
    } else {
      logout();
    }
  }, [applyAuthState, logout, state.token, verifyToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: state.isAuthenticated,
      user: state.user,
      token: state.token,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [loading, login, logout, refreshUser, state.isAuthenticated, state.token, state.user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

