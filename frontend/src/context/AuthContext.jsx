import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('macfeed_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('macfeed_user');
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read user from storage', e);
    }
  }, []);

  const login = useCallback((userData) => {
    setUser(userData);
    try {
      localStorage.setItem('macfeed_user', JSON.stringify(userData));
    } catch (e) {}
    setAuthModalOpen(false);
  }, []);

  const guestLogin = useCallback(() => {
    const guestUser = {
      id: `guest_${Date.now()}`,
      name: 'Guest Explorer',
      email: 'guest@macfeed.app',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      isGuest: true,
    };
    login(guestUser);
  }, [login]);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem('macfeed_user');
    } catch (e) {}
  }, []);

  // Legacy support for methods that might be called elsewhere
  const signOut = logout;

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        login,
        guestLogin,
        logout,
        signOut,
        isAuthModalOpen, 
        setAuthModalOpen 
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
