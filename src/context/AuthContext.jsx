import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ loading: true, user: null });

  async function refreshSession() {
    try {
      const payload = await authApi.getMe();
      setSession({
        loading: false,
        user: payload?.isAuthenticated ? payload : null
      });

      
      return payload;
    } catch {
      setSession({ loading: false, user: null });
      return null;
    }
  }

  useEffect(() => {
    refreshSession();
  }, []);

  async function signIn(payload) {
    const result = await authApi.login(payload);
    const user = await refreshSession();
    return { result, user };
  }

  async function signOut() {
    try {
      await authApi.logout();
    } finally {
      setSession({ loading: false, user: null });
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        refreshSession,
        signIn,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
