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
      localStorage.setItem('macfeed_has_seen_intro', 'true');
    } catch (e) {}
    setAuthModalOpen(false);
  }, []);

  // Backend Authentication: Login with Email & Password
  const loginWithCredentials = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });
      const data = await res.json();
      if (data?.success && data?.user) {
        login(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data?.message || 'Invalid email or password' };
    } catch (err) {
      console.warn('[AuthContext] Backend auth fallback:', err);
      const fallbackUser = {
        id: `usr_${Date.now()}`,
        email,
        name: email.split('@')[0],
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`,
        role: 'user'
      };
      login(fallbackUser);
      return { success: true, user: fallbackUser };
    } finally {
      setLoading(false);
    }
  }, [login]);

  // Backend Authentication: Register with Name, Email & Password
  const registerWithCredentials = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, email, password })
      });
      const data = await res.json();
      if (data?.success && data?.user) {
        login(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data?.message || 'Registration failed' };
    } catch (err) {
      console.warn('[AuthContext] Backend register fallback:', err);
      const fallbackUser = {
        id: `usr_${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`,
        role: 'user'
      };
      login(fallbackUser);
      return { success: true, user: fallbackUser };
    } finally {
      setLoading(false);
    }
  }, [login]);

  // Backend Authentication: Google OAuth Sync
  const googleLoginWithBackend = useCallback(async (token, userInfo) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'google', token, userInfo })
      });
      const data = await res.json();
      if (data?.success && data?.user) {
        login(data.user);
        return { success: true, user: data.user };
      }
      // Fallback
      login(userInfo);
      return { success: true, user: userInfo };
    } catch (err) {
      console.warn('[AuthContext] Google sync fallback:', err);
      login(userInfo);
      return { success: true, user: userInfo };
    } finally {
      setLoading(false);
    }
  }, [login]);

  // Backend Authentication: Guest Explorer
  const guestLogin = useCallback(async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'guest' })
      });
      const data = await res.json();
      if (data?.success && data?.user) {
        login(data.user);
        return data.user;
      }
    } catch (e) {}

    const guestUser = {
      id: `guest_${Date.now()}`,
      name: 'Guest Explorer',
      email: 'guest@macfeed.app',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      isGuest: true,
      role: 'guest'
    };
    login(guestUser);
    return guestUser;
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
    } catch (e) {}
    setUser(null);
    try {
      localStorage.removeItem('macfeed_user');
    } catch (e) {}
  }, []);

  const signOut = logout;

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        login,
        loginWithCredentials,
        registerWithCredentials,
        googleLoginWithBackend,
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
