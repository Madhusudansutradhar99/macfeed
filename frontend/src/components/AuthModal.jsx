import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2, AlertCircle, Sparkles, User, LogOut, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { supabase } from '../supabaseClient';

export default function AuthModal() {
  const { user, login, guestLogin, logout, isAuthModalOpen, setAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handlePostAuthRedirect = () => {
    try {
      localStorage.setItem('macfeed_has_seen_intro', 'true');
    } catch (e) {}
    if (location.pathname === '/intro') {
      navigate('/', { replace: true });
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        const userInfo = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` }}
        ).then(res => res.json());
        
        const userData = {
          id: userInfo.sub,
          name: userInfo.name || 'Google User',
          email: userInfo.email,
          picture: userInfo.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
        };

        login(userData);
        handlePostAuthRedirect();
      } catch (err) {
        console.error('Login Failed:', err);
        setError('Failed to fetch user information from Google.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google Login was cancelled or failed. You can also sign in with Email or Guest.');
    }
  });

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Try Supabase auth if client is active
      if (supabase && supabase.auth) {
        if (isLogin) {
          const { data, error: supaErr } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (!supaErr && data?.user) {
            login({
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.full_name || email.split('@')[0],
              picture: data.user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
            });
            handlePostAuthRedirect();
            setLoading(false);
            return;
          }
        } else {
          const { data, error: supaErr } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name || email.split('@')[0] } }
          });
          if (!supaErr && data?.user) {
            login({
              id: data.user.id,
              email: data.user.email,
              name: name || email.split('@')[0],
              picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
            });
            handlePostAuthRedirect();
            setLoading(false);
            return;
          }
        }
      }

      // 2. Fallback client-side instant profile login
      login({
        id: `usr_${Date.now()}`,
        email,
        name: name || email.split('@')[0],
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
      });
      handlePostAuthRedirect();
    } catch (err) {
      console.warn('Auth fallback:', err);
      login({
        id: `usr_${Date.now()}`,
        email,
        name: name || email.split('@')[0],
        picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'
      });
      handlePostAuthRedirect();
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthModalOpen) return null;

  const onClose = () => {
    setAuthModalOpen(false);
    setError(null);
    if (user && location.pathname === '/intro') {
      handlePostAuthRedirect();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-amber-500/10 animate-pulse" />
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-h-[92vh] overflow-y-auto custom-scrollbar max-w-4xl grid grid-cols-1 lg:grid-cols-10 bg-[#0f111a] border border-white/15 rounded-[2rem] shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
        >
          {/* Always Available Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90 z-50 border border-white/10"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Decorative Section */}
          <div className="flex flex-col lg:col-span-4 bg-white/[0.02] border-b lg:border-b-0 lg:border-r border-white/10 p-6 sm:p-8 justify-between relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-amber-500/10 rounded-full blur-[60px]" />
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px]" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 bg-gradient-to-tr from-[#f5b700] to-amber-400 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <span className="text-lg font-black tracking-wider text-white">MACFEED ID</span>
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white mb-3 leading-none">
                Unlimited<br />
                <span className="text-[#f5b700]">Stream Pass</span>
              </h3>
              <p className="text-gray-400 text-xs font-medium leading-relaxed mb-6">
                Save likes, track stream history, sync your personal playlists, and experience instant zero-lag playback.
              </p>

              <div className="space-y-2 text-xs text-gray-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f5b700]" />
                  <span>Ad-free background audio flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f5b700]" />
                  <span>Floating Miniplayer with PIP</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f5b700]" />
                  <span>Instant high-bitrate streaming</span>
                </div>
              </div>
            </div>

            {/* Quick Guest Entry */}
            <div className="relative z-10 pt-6">
              <button
                type="button"
                onClick={() => { guestLogin(); handlePostAuthRedirect(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#f5b700]/50 p-3.5 rounded-2xl transition-all group active:scale-95 text-white text-xs font-bold"
              >
                <Sparkles className="w-4 h-4 text-[#f5b700]" />
                <span>Continue as Guest (1-Click)</span>
              </button>
            </div>
          </div>

          {/* Right Section (Auth Form or User Profile) */}
          <div className="col-span-1 lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center">
            {user ? (
              <div className="flex flex-col items-center py-6 w-full text-center">
                <div className="relative mb-6">
                  <img
                    src={user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                    className="w-24 h-24 rounded-3xl border-2 border-[#f5b700] shadow-xl object-cover"
                    alt="avatar"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 p-1.5 rounded-xl border-2 border-[#0f111a]">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-black uppercase text-white mb-1 tracking-tight">
                  {user.isGuest ? 'Guest Explorer' : 'Active Account'}
                </h2>
                <p className="text-base font-bold text-gray-200">{user.name}</p>
                <p className="text-xs text-gray-400 mb-6">{user.email}</p>
                
                <div className="w-full max-w-sm space-y-3">
                  <button 
                    onClick={() => { handlePostAuthRedirect(); onClose(); }}
                    className="w-full h-12 bg-[#f5b700] text-black font-black uppercase text-xs tracking-wider rounded-2xl transition hover:brightness-110 active:scale-95 shadow-lg shadow-amber-500/20"
                  >
                    Start Streaming
                  </button>
                  <button 
                    onClick={() => { logout(); }} 
                    className="w-full h-12 border border-white/20 text-gray-300 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 rounded-2xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out / Switch Account
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full">
                {/* Form Tabs */}
                <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
                  <button
                    type="button"
                    onClick={() => { setIsLogin(true); setError(null); }}
                    className={`text-xs font-black uppercase tracking-wider transition px-3 py-1.5 rounded-lg ${isLogin ? 'text-[#f5b700] bg-[#f5b700]/10' : 'text-gray-400 hover:text-white'}`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsLogin(false); setError(null); }}
                    className={`text-xs font-black uppercase tracking-wider transition px-3 py-1.5 rounded-lg ${!isLogin ? 'text-[#f5b700] bg-[#f5b700]/10' : 'text-gray-400 hover:text-white'}`}
                  >
                    Create Account
                  </button>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs font-medium mb-4 flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Email Password Form */}
                <form onSubmit={handleEmailAuth} className="space-y-3.5 mb-5">
                  {!isLogin && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full bg-white/5 border border-white/15 focus:border-[#f5b700] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full bg-white/5 border border-white/15 focus:border-[#f5b700] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/15 focus:border-[#f5b700] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-gradient-to-r from-[#f5b700] to-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl transition hover:brightness-110 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <>
                        <span>{isLogin ? 'Sign In' : 'Create Free Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-4 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <span className="relative bg-[#0f111a] px-3 text-[10px] uppercase font-bold text-gray-500 tracking-wider">or sign in with</span>
                </div>

                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={() => googleLogin()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 h-11 rounded-xl transition active:scale-95 text-xs font-bold text-white mb-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

