import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trash2, LogOut, Shield, Settings as SettingsIcon, AlertCircle, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const { user, logout, setAuthModalOpen } = useAuth();
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all local data?')) {
      localStorage.removeItem('macfeed_likes');
      localStorage.removeItem('macfeed_history');
      showToast('Local data cleared successfully.');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('WARNING: Are you sure you want to delete your account? This action is permanent and cannot be undone.')) {
      try {
        const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiHost}/auth/delete-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
          showToast('Account deleted successfully.', 'success');
          logout();
          setTimeout(() => {
            window.location.href = '#/';
          }, 1000);
        } else {
          showToast(data.error || 'Failed to delete account.', 'error');
        }
      } catch (e) {
        showToast('Error connecting to authentication server.', 'error');
      }
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 bg-[#0b0c10] text-white">
        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-white/10">
          <SettingsIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase mb-2">Account Settings</h2>
        <p className="text-gray-400 text-xs sm:text-sm font-medium mb-8 max-w-sm">
          Sign in to access your MacFeed cloud profile, sync playback history, and customize playback preferences.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase text-xs tracking-wider shadow-lg hover:bg-gray-200 transition"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] text-white pt-2 sm:pt-4 px-3 sm:px-6 max-w-7xl mx-auto pb-32">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-10 right-10 z-[1000] px-6 py-3 rounded-xl shadow-2xl font-bold uppercase text-xs tracking-wider flex items-center gap-2.5 ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-white text-black'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Digen Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="digen-section-title text-xl sm:text-2xl md:text-3xl font-black">
              USER PROFILE & PREFERENCES
            </h1>
            <span className="digen-badge-teal text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              Google Verified
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm font-normal max-w-2xl">
            Manage account session, local privacy caching, and video playback engines.
          </p>
        </div>
      </div>

      {/* --- User Profile Banner --- */}
      <div className="digen-card p-6 rounded-2xl mb-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/20 shadow-xl shrink-0">
          {user.picture ? (
            <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center text-xl font-bold">
              {user.name?.charAt(0) || 'U'}
            </div>
          )}
        </div>
        <div className="text-center sm:text-left">
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
          <div className="flex items-center gap-2 mt-3 justify-center sm:justify-start">
            <span className="digen-badge-amber text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Pro Streamer
            </span>
            <span className="text-[11px] text-gray-500 font-mono">ID: {user.id?.slice(0, 10)}...</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="digen-card p-6 rounded-2xl">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#f5b700]" />
              Privacy & Local Storage
            </h2>
            <div className="space-y-3">
              <button 
                onClick={handleClearData}
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-semibold text-white">Clear Local Watch History & Likes</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button 
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3 text-red-400">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-xs font-semibold">Delete Account Data</span>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5">
          <section className="digen-card p-6 rounded-2xl">
            <h2 className="text-base font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <LogOut className="w-4 h-4 text-red-400" />
              Session Control
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Logging out will clear your active cloud session from this browser.
            </p>
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 p-3.5 bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
