import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Loader2, AlertCircle, Sparkles, User, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';

export default function AuthModal() {
  const { user, login, logout, isAuthModalOpen, setAuthModalOpen } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form states (Disabled for now as per frontend-only request)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

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
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture
        };

        login(userData);
      } catch (err) {
        console.error('Login Failed:', err);
        setError('Failed to fetch user information from Google.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google Login Failed. Please try again.');
    }
  });

  if (!isAuthModalOpen) return null;

  const onClose = () => {
    setAuthModalOpen(false);
    setError(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-primary/20 backdrop-blur-xl"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-blue-500/10 animate-pulse" />
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotateX: 15 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotateX: -15 }}
          className="relative w-full max-w-4xl grid grid-cols-1 lg:grid-cols-10 bg-secondary border border-primary rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          {/* Left Decorative Section */}
          <div className="hidden lg:flex lg:col-span-4 bg-primary/5 border-r border-primary p-10 flex-col justify-between relative overflow-hidden">
             <div className="absolute top-[-20%] left-[-20%] w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]" />
             <div className="absolute bottom-[-20%] right-[-20%] w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
             
             <div className="relative z-10">
                <div className="flex items-center gap-3 mb-10">
                   <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20" style={{ backgroundColor: 'var(--accent-color)' }}>
                      <Sparkles className="w-6 h-6 text-white" />
                   </div>
                   <span className="text-xl font-black italic tracking-tighter text-primary">MACFEED ID</span>
                </div>
                
                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-primary mb-6 leading-[0.9]">
                   ONE ACCOUNT<br />
                   <span className="text-accent" style={{ color: 'var(--accent-color)' }}>ALL ACCESS</span>
                </h3>
                <p className="text-secondary text-[11px] font-bold leading-relaxed uppercase tracking-widest opacity-60">
                   Sign in with Google to sync your core data across all dimensions.
                </p>
             </div>

             <div className="relative z-10">
                <button
                  onClick={() => googleLogin()}
                  disabled={loading}
                  className="w-full flex items-center gap-4 bg-secondary border border-primary hover:border-accent p-5 rounded-2xl transition-all group active:scale-95 shadow-xl"
                >
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Google Connect</span>
                </button>
             </div>
          </div>

          {/* Right Section (Status) */}
          <div className="col-span-1 lg:col-span-6 p-8 lg:p-14 flex flex-col relative items-center justify-center">
            <button
              onClick={onClose}
              className="absolute top-8 right-8 p-3 text-secondary hover:text-primary bg-primary/5 hover:bg-primary/10 rounded-full transition-all active:scale-90 z-20"
            >
              <X className="w-6 h-6" />
            </button>

            {user ? (
               <div className="flex flex-col items-center py-10 w-full">
                  <div className="relative mb-8">
                     <img src={user.picture} className="w-32 h-32 rounded-[2.5rem] border-4 border-accent shadow-2xl" style={{ borderColor: 'var(--accent-color)' }} />
                     <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-xl border-4 border-secondary">
                        <Sparkles className="w-4 h-4 text-white" />
                     </div>
                  </div>
                  <h2 className="text-4xl font-black uppercase text-primary mb-2 italic tracking-tighter">Verified</h2>
                  <p className="text-secondary text-lg font-black uppercase tracking-tighter mb-1">{user.name}</p>
                  <p className="text-secondary text-[10px] uppercase tracking-[0.4em] mb-8 opacity-40">{user.email}</p>
                  
                  <button 
                    onClick={async () => {
                      try {
                        if ('Notification' in window) {
                          const perm = await Notification.requestPermission();
                          if (perm === 'granted') {
                             // Initialize empty audio to trigger background audio session permission context
                             const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
                             audio.play().catch(()=>{});
                             alert("Background Audio & Notifications Enabled!");
                          } else {
                             alert("Permission denied. Background audio may be restricted.");
                          }
                        } else {
                          alert("Notifications not supported on this browser.");
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="w-full h-16 mb-4 bg-green-500/10 text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-white rounded-3xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3"
                  >
                    <Sparkles className="w-5 h-5" />
                    Enable Background Audio
                  </button>

                  <button 
                    onClick={() => { logout(); onClose(); }} 
                    className="w-full h-20 border-2 border-primary text-primary hover:bg-red-500 hover:text-white hover:border-red-500 rounded-3xl font-black uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4"
                  >
                    <LogOut className="w-6 h-6" />
                    Terminate Session
                  </button>
               </div>
            ) : (
              <div className="w-full text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-primary/20">
                   <User className="w-10 h-10 text-secondary" />
                </div>
                <h2 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none mb-4">
                  Welcome Back
                </h2>
                <p className="text-secondary text-[10px] font-black uppercase tracking-[0.4em] opacity-60 mb-12 max-w-xs mx-auto">
                  Use the secure Google portal on the left to authorize your access.
                </p>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-3xl text-[10px] font-black uppercase mb-8 flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 shrink-0" /> {error}
                  </motion.div>
                )}

                {loading ? (
                   <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 animate-spin text-accent" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-secondary">Verifying Identity...</span>
                   </div>
                ) : (
                   <button
                    onClick={() => googleLogin()}
                    className="w-full h-20 bg-accent text-white font-black uppercase text-xs tracking-[0.4em] rounded-[2rem] shadow-2xl transition-all flex items-center justify-center gap-4 hover:brightness-110 active:scale-95"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                   >
                     Initiate Google Auth <ArrowRight className="w-5 h-5" />
                   </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
