
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { authApi } from '../api';

import {
  getTabSession,
  setTabSession,
  clearTabSession,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore only this tab's session.
  useEffect(() => {
    let active = true;

    const existingToken = getTabSession();

    if (!existingToken) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    authApi
      .me()
      .then((res) => {
        if (active) {
          setUser(res?.data?.user || null);
        }
      })
      .catch(() => {
        if (active) {
          clearTabSession();
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Handle expired or revoked sessions.
  useEffect(() => {
    const onUnauthorized = () => {
      clearTabSession();
      setUser(null);
    };

    window.addEventListener(
      'auth:unauthorized',
      onUnauthorized
    );

    return () => {
      window.removeEventListener(
        'auth:unauthorized',
        onUnauthorized
      );
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authApi.login(credentials);

    const token = res?.data?.tabSessionToken;
    const authenticatedUser = res?.data?.user;

    if (!token || !authenticatedUser) {
      throw new Error(
        'Login response is missing session information.'
      );
    }

    // Store token only in the current tab.
    setTabSession(token);

    setUser(authenticatedUser);

    return authenticatedUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (getTabSession()) {
        await authApi.logout();
      }
    } finally {
      // Remove only the current tab's token.
      clearTabSession();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return ctx;
}
