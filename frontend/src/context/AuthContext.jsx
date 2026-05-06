import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Restore user from localStorage
    const savedUser = localStorage.getItem('macfeed_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user');
        localStorage.removeItem('macfeed_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('macfeed_user', JSON.stringify(userData));
    setAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('macfeed_user');
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
