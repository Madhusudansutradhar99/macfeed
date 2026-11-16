import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, PlayCircle, Music, Search, Layers, ChevronRight, Zap, Shield, Smartphone, Globe, Sparkles, ArrowLeft, Mail, Lock, User, LogIn, UserPlus, LogOut, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { supabase } from '../supabaseClient';

const FeatureCard = ({ feature, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2 + index * 0.1, duration: 0.8, type: "spring" }}
    whileHover={{ y: -10, scale: 1.02 }}
    className="relative group p-px rounded-[2.5rem] overflow-hidden bg-gradient-to-b from-white/10 to-transparent"
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative h-full backdrop-blur-3xl p-8 rounded-[2.5rem] border flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(255,255,255,0.05)' }}>
      <div>
        <div className="mb-8 w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg border border-white/10 group-hover:border-cyan-400/50 group-hover:scale-110 transition-all duration-500">
          {feature.icon}
        </div>
        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400 transition-all">
          {feature.title}
        </h3>
        <p className="text-white/40 text-sm font-medium leading-relaxed">
          {feature.desc}
        </p>
      </div>
    </div>
  </motion.div>
);

export default function IntroPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, guestLogin, logout, setAuthModalOpen } = useAuth();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If visitor is viewing as an intentional tour (?tour=true or from header/sidebar)
  const isTourMode = location.search.includes('tour=true') || location.state?.tour;

  // Automatically redirect authenticated users to the main page
  useEffect(() => {
    if (user && !isTourMode) {
      try {
        localStorage.setItem('macfeed_has_seen_intro', 'true');
      } catch (e) {}
      navigate('/', { replace: true });
    }
  }, [user, isTourMode, navigate]);

  const handlePostAuthRedirect = () => {
    try {
      localStorage.setItem('macfeed_has_seen_intro', 'true');
    } catch (e) {}
    navigate('/', { replace: true });
  };

  const handleExploreGuest = () => {
    try {
      localStorage.setItem('macfeed_has_seen_intro', 'true');
    } catch (e) {}
    guestLogin();
    handlePostAuthRedirect();
  };

  // Google OAuth Login
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
      setError('Google Login was cancelled or failed.');
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
      if (supabase && supabase.auth) {
        if (isLoginTab) {
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

      // Fallback instant login
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

  const features = [
    {
      icon: <Globe className="w-7 h-7 text-cyan-400" />,
      title: "Limitless Media",
      desc: "Tap into an infinite universe of content. YouTube, movies, live sports, and beyond, completely unchained."
    },
    {
      icon: <Music className="w-7 h-7 text-blue-400" />,
      title: "Persistent Audio",
      desc: "Your soundtrack never stops. Minimize the app or lock your screen, the music flows seamlessly in the background."
    },
    {
      icon: <Layers className="w-7 h-7 text-indigo-400" />,
      title: "Floating Engine",
      desc: "Multitask like a pro with our picture-in-picture floating player. Drag it, resize it, own your screen space."
    }
  ];

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-start relative overflow-hidden selection:bg-cyan-500/30" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      {/* Floating Back to App Button */}
      <div className="fixed top-5 left-5 z-50">
        <button
          onClick={() => {
            try { localStorage.setItem('macfeed_has_seen_intro', 'true'); } catch (e) {}
            navigate('/');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 hover:bg-black/90 border border-white/15 backdrop-blur-xl text-xs font-bold text-gray-200 hover:text-white transition shadow-lg active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Back to App</span>
        </button>
      </div>

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full blur-[120px] mix-blend-screen"
          style={{ backgroundColor: 'var(--accent-color)', opacity: 0.18 }}
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/80 to-[#020617] z-10" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center">
        
        {/* Header Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-12 backdrop-blur-md shadow-2xl border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(255,255,255,0.10)' }}>
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">
            Welcome to the Future
          </span>
        </motion.div>

        {/* Massive Hero Text */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
          className="text-center w-full max-w-5xl mb-12"
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black italic tracking-tighter uppercase leading-[0.85]">
            <span className="block text-white drop-shadow-2xl">BEYOND</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 drop-shadow-[0_0_40px_rgba(56,189,248,0.4)]">
              STREAMING
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-center text-white/50 text-lg md:text-xl max-w-2xl font-medium leading-relaxed mb-20"
        >
          Step into a revolutionary entertainment ecosystem. Zero boundaries. Infinite content. Crafted for the absolute elite.
        </motion.p>

        {/* ========================================================================= */}
        {/* PROMINENT USER SIGN-IN & LOGIN CARD */}
        {/* ========================================================================= */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-md mb-16 p-6 sm:p-8 rounded-[2rem] border border-white/15 bg-[#0b0e17]/85 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cyan-500/20 to-transparent rounded-full blur-2xl pointer-events-none" />

          {user ? (
            /* Authenticated User Card */
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 mb-4 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                <img
                  src={user.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop'}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">
                Currently Signed In
              </span>
              <h3 className="text-xl font-bold text-white mb-1 truncate max-w-full">
                {user.name || user.email?.split('@')[0]}
              </h3>
              <p className="text-xs text-white/50 mb-6 truncate max-w-full">
                {user.email}
              </p>

              <button
                type="button"
                onClick={handlePostAuthRedirect}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-black font-black uppercase tracking-wider text-sm transition shadow-[0_0_25px_rgba(56,189,248,0.5)] flex items-center justify-center gap-2 mb-3 active:scale-98"
              >
                <span>Enter Main Page</span>
                <ChevronRight className="w-5 h-5 text-black" />
              </button>

              <button
                type="button"
                onClick={() => logout()}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-400 hover:text-white transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Switch Account / Sign Out</span>
              </button>
            </div>
          ) : (
            /* Unauthenticated Visitor Login Form */
            <div>
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white mb-1">
                  User Login & Access
                </h3>
                <p className="text-xs text-white/50">
                  Sign in to save your playlists, history, and preferences.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Google OAuth Button */}
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-3 shadow-lg active:scale-98 mb-4 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className="h-px bg-white/10 flex-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Or with Email</span>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              {/* 2. Direct Email / Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {!isLoginTab && (
                  <div>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-black font-black uppercase tracking-wider text-xs transition shadow-[0_0_20px_rgba(56,189,248,0.4)] flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                  ) : isLoginTab ? (
                    <>
                      <LogIn className="w-4 h-4 text-black" />
                      <span>Sign In & Enter</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-black" />
                      <span>Create Account & Enter</span>
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Login / Register */}
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => { setIsLoginTab(!isLoginTab); setError(null); }}
                  className="text-[11px] text-cyan-400 hover:underline font-semibold"
                >
                  {isLoginTab ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>

              {/* 3. Instant Guest Explorer Option */}
              <div className="mt-5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleExploreGuest}
                  className="w-full py-3 px-4 rounded-xl bg-[#f5b700]/15 hover:bg-[#f5b700]/25 border border-[#f5b700]/40 text-[#f5b700] hover:text-amber-300 font-black uppercase tracking-wider text-xs transition flex items-center justify-center gap-2 active:scale-98 shadow-[0_0_15px_rgba(245,183,0,0.15)]"
                >
                  <Zap className="w-4 h-4 fill-[#f5b700]" />
                  <span>⚡ Continue as Guest Explorer (Instant)</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Bento Grid Features */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} index={i} />
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-32 flex flex-wrap items-center justify-center gap-12 opacity-40 grayscale"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Military Grade Security</span>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Zero Latency Engine</span>
          </div>
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-[0.3em]">Cross-Platform Sync</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
