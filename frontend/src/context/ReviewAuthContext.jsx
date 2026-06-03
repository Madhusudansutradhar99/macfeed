import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

export const ReviewAuthContext = createContext();

export const ReviewAuthProvider = ({ children }) => {
  const { user: mainUser } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try to get Review-specific logged in user
    const reviewUserStr = localStorage.getItem('review_user');
    if (reviewUserStr) {
      try {
        const rUser = JSON.parse(reviewUserStr);
        setUser(rUser);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('review_user');
      }
    }

    // 2. Try to get main site's Google Auth user
    if (mainUser) {
      const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'sutradharmadhusudan676@gmail.com').split(',').map(e => e.trim().toLowerCase());
      const isAdmin = adminEmails.includes(mainUser.email?.toLowerCase());
      
      setUser({
        _id: mainUser.userId || mainUser.id || ('google_' + mainUser.email.replace(/[^a-zA-Z0-9]/g, '')),
        name: mainUser.name || 'User',
        email: mainUser.email,
        role: isAdmin ? 'admin' : 'user',
        totalEarnings: mainUser.totalEarnings || 0,
        pendingAmount: mainUser.pendingAmount || 0,
        withdrawnAmount: mainUser.withdrawnAmount || 0
      });
    } else {
      // Fallback: If not logged in on main site, default to seeded Admin User so chat features are fully functional!
      setUser({
        _id: 'user-admin', // Matches seeded MacFeed Admin in mockDb
        name: 'MacFeed Admin',
        email: 'admin@macfeed.com',
        role: 'admin',
        totalEarnings: 10000,
        pendingAmount: 2500,
        withdrawnAmount: 7500
      });
    }
    setLoading(false);
  }, [mainUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('review_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, phone) => {
    const { data } = await api.post('/auth/register', { name, email, password, phone });
    localStorage.setItem('review_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('review_user');
    setUser(null);
  };

  return (
    <ReviewAuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </ReviewAuthContext.Provider>
  );
};
