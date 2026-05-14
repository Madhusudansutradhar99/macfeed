import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Layout, User, LogIn, Palette } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { user, setAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY < 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsFocused(false);
    }
  };

  const isSearchPage = location.pathname === '/search';

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{ y: isVisible || isFocused ? 0 : -100 }}
      className={`fixed top-0 left-0 right-0 h-[80px] z-[5000] flex items-center px-4 md:px-12 transition-all duration-500 bg-secondary/80 backdrop-blur-xl border-b border-primary/10`}
    >
      <div className="flex items-center gap-6 shrink-0 mr-8">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))} 
          className="w-12 h-12 flex items-center justify-center bg-secondary border-2 border-accent rounded-2xl text-accent shadow-lg shadow-accent/10"
          style={{ borderColor: 'var(--accent-color)', color: 'var(--accent-color)' }}
        >
          <Layout className="w-6 h-6" />
        </button>
      </div>

      <div ref={dropdownRef} className="flex-1 max-w-2xl mx-auto relative">
        <form onSubmit={handleSearch} className="relative group">
          <div 
            className={`flex items-center px-6 py-2 rounded-full border-4 transition-all duration-500 ${isFocused ? 'bg-secondary border-accent shadow-[0_0_25px_var(--accent-color)]' : 'bg-secondary/50 border-accent/40'}`}
            style={{ borderColor: isFocused ? 'var(--accent-color)' : 'var(--accent-color)66' }}
          >
            <Search className="w-5 h-5 mr-4 text-accent" style={{ color: 'var(--accent-color)' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              placeholder="SEARCH..."
              className="bg-transparent outline-none text-primary text-sm font-black italic uppercase tracking-widest w-full placeholder:text-primary/20"
            />
          </div>
        </form>
      </div>

      <div className="shrink-0 ml-8 flex items-center gap-4">
        <ThemeToggle />
        
        {user ? (
          <button 
            onClick={() => navigate('/settings')}
            className="w-12 h-12 rounded-full bg-accent p-[3px] shadow-xl"
            style={{ backgroundColor: 'var(--accent-color)' }}
          >
            <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center font-black text-sm text-primary">
              {user.email?.[0].toUpperCase()}
            </div>
          </button>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-on-accent shadow-xl"
            style={{ backgroundColor: 'var(--accent-color)', color: 'var(--text-on-accent)' }}
          >
            <LogIn className="w-6 h-6" />
          </button>
        )}
      </div>
    </motion.header>
  );
}
