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
    // Authentication is bypassed for now as requested
    const dummyUser = { id: 'admin-123', name: 'Admin', email: 'admin@macfeed.local', picture: '' };
    setUser(dummyUser);
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
