import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    api.get('/auth/me')
      .then(({ data }) => {
        if (active) setUser(data?.user || null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const login = (userData) => {
    setUser(userData);
    setAuthModalOpen(false);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Clear the local view even if the session endpoint is temporarily unavailable.
    } finally {
      setUser(null);
      setAuthModalOpen(false);
    }
  };

  // Legacy support for methods that might be called elsewhere
  const signOut = logout;

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        loading, 
        login,
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
