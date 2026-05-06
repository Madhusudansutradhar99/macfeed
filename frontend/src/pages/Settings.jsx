import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Trash2, LogOut, Shield, Settings as SettingsIcon, Mail, Key, AlertCircle, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
        <div className="w-24 h-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-primary animate-pulse">
           <SettingsIcon className="w-10 h-10 text-secondary" />
        </div>
        <h2 className="text-4xl font-black text-primary uppercase italic tracking-tighter mb-4">Secure Area</h2>
        <p className="text-secondary text-sm font-bold uppercase tracking-[0.2em] mb-10 max-w-sm opacity-60">
          Please sign in with Google to access your MacFeed core settings.
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="bg-accent text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-[0.4em] shadow-2xl shadow-accent/20 hover:scale-105 transition-all active:scale-95"
          style={{ backgroundColor: 'var(--accent-color)' }}
        >
          INITIATE ACCESS
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pb-32">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-10 right-10 z-[1000] px-8 py-4 rounded-2xl shadow-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 ${
              toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
        <div className="flex items-center gap-8">
           <div className="relative group">
              <div className="w-32 h-32 rounded-[3rem] overflow-hidden border-4 border-accent shadow-2xl transform group-hover:rotate-6 transition-all duration-500" style={{ borderColor: 'var(--accent-color)' }}>
                 <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent rounded-2xl flex items-center justify-center shadow-lg border-4 border-secondary" style={{ backgroundColor: 'var(--accent-color)' }}>
                 <Sparkles className="w-5 h-5 text-white" />
              </div>
           </div>
           <div>
              <h1 className="text-5xl font-black text-primary uppercase italic tracking-tighter leading-none mb-3">
                 {user.name.split(' ')[0]}'s <span className="text-accent" style={{ color: 'var(--accent-color)' }}>CORE</span>
              </h1>
              <div className="flex items-center gap-4">
                 <span className="px-3 py-1 bg-primary/10 rounded-lg text-[10px] font-black text-secondary uppercase tracking-widest border border-primary">Google Verified</span>
                 <span className="text-secondary text-[10px] font-bold uppercase tracking-widest opacity-40">{user.email}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 flex flex-col gap-8">
           <section className="bg-secondary/40 backdrop-blur-3xl border border-primary rounded-[3rem] p-10 relative overflow-hidden">
              <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                 <Key className="w-5 h-5 text-accent" style={{ color: 'var(--accent-color)' }} />
                 Identity Blueprint
              </h2>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] ml-2 mb-2 block">Name</label>
                    <div className="bg-primary/5 border border-primary rounded-2xl p-4 md:p-5 text-primary font-black uppercase italic tracking-wider break-words text-xs md:text-base w-full">
                       {user.name}
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] ml-2 mb-2 block">Email</label>
                    <div className="bg-primary/5 border border-primary rounded-2xl p-4 md:p-5 text-primary font-black lowercase italic tracking-wider break-all text-xs md:text-base w-full">
                       {user.email}
                    </div>
                 </div>
              </div>
           </section>

           <section className="bg-secondary/40 backdrop-blur-3xl border border-primary rounded-[3rem] p-10">
              <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                 <Shield className="w-5 h-5 text-accent" style={{ color: 'var(--accent-color)' }} />
                 Privacy & Data
              </h2>
              <button 
                onClick={handleClearData}
                className="w-full flex items-center justify-between p-6 bg-primary/5 border border-primary rounded-3xl hover:bg-white/5 transition-all mb-4"
              >
                 <div className="flex items-center gap-4">
                    <Trash2 className="w-5 h-5 text-secondary" />
                    <span className="font-black uppercase italic text-primary">Clear Local History</span>
                 </div>
                 <ChevronRight className="w-5 h-5 text-secondary" />
              </button>
           </section>
        </div>

        <div className="lg:col-span-5">
           <section className="bg-secondary/40 backdrop-blur-3xl border border-primary rounded-[3rem] p-10">
              <h2 className="text-xl font-black text-primary uppercase italic tracking-tighter mb-8">Session Control</h2>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-between p-6 bg-red-500/10 border border-red-500/30 rounded-3xl hover:bg-red-500 group transition-all"
              >
                 <div className="flex items-center gap-4">
                    <LogOut className="w-5 h-5 text-red-500 group-hover:text-white" />
                    <span className="font-black uppercase italic text-red-500 group-hover:text-white">Terminate Core Access</span>
                 </div>
                 <ArrowRight className="w-5 h-5 text-red-500 group-hover:text-white group-hover:translate-x-2 transition-all" />
              </button>
           </section>
        </div>
      </div>
    </div>
  );
}
