import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Compass,
  Film,
  Music,
  Zap,
  Trophy,
  Tv,
  Sparkles,
  Mic,
  Search,
  Smartphone,
  Bookmark,
  Gauge,
  User,
  X,
  FolderOpen,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { saveCategorizedVideos } from '../utils/categoryDetector';

export default function Header() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, setAuthModalOpen } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const navLinks = [
    { label: 'Explore', path: '/', icon: Compass },
    { label: 'Intro Tour', path: '/intro', icon: Sparkles, badge: 'Tour', badgeColor: 'digen-badge-amber' },
    { label: 'Movies', path: '/movies', icon: Film, badge: 'HD', badgeColor: 'digen-badge-teal' },
    { label: 'Music', path: '/music', icon: Music, badge: 'Audio', badgeColor: 'digen-badge-teal' },
    { label: 'Shorts', path: '/shorts', icon: Zap, badge: 'Hot', badgeColor: 'digen-badge-amber' },
    { label: 'Sports', path: '/sports', icon: Trophy, badge: 'Live', badgeColor: 'digen-badge-teal' },
    { label: 'Series', path: '/series', icon: Tv },
    { label: 'Local Player', path: '/playlists', icon: FolderOpen, badge: 'PRO', badgeColor: 'digen-badge-amber' },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleVideoSelect = (video) => {
    setIsSearchOpen(false);
    setQuery('');
    saveCategorizedVideos([video], query);
    navigate(`/watch/${video.id || 'yt-' + video.ytId}`, { state: { video } });
  };

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data: dbData } = await supabase
          .from('videos')
          .select('*')
          .ilike('title', `%${query.trim()}%`)
          .limit(5);
        if (dbData && dbData.length > 0) {
          saveCategorizedVideos(dbData, query);
        }
        setResults(dbData || []);
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-[66px] z-[5000] flex items-center justify-between px-3 sm:px-6 bg-[#07090e]/65 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_10px_35px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
      {/* --- Left: Brand Logo & Sidebar Toggle --- */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/15 text-gray-300 hover:text-[#f5b700] border border-white/10 transition active:scale-95"
          title="Toggle Sidebar Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/watermark.png"
            className="h-8 w-8 rounded-lg drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-transform"
            alt="MacFeed Logo"
          />
          <div className="flex items-baseline gap-1.5">
            <span className="text-white text-lg sm:text-xl font-black uppercase tracking-tight leading-none drop-shadow-sm">
              MAC<span className="text-[#f5b700]">FEED</span>
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 text-gray-400 bg-white/5 hidden sm:inline-block backdrop-blur-md">
              AI Hub
            </span>
          </div>
        </Link>
      </div>

      {/* --- Center: Glassmorphic Floating Pill Nav Bar --- */}
      <nav className="hidden lg:flex items-center rounded-full p-1 gap-1 bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]">
        {navLinks.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all relative ${
                isActive
                  ? 'bg-white text-black shadow-[0_2px_15px_rgba(255,255,255,0.3)]'
                  : 'text-gray-300 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase leading-tight ${
                    isActive ? 'bg-black/15 text-black' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Quick Voice / Mic button */}
        <button
          onClick={() => navigate('/smart-search')}
          className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          title="Voice Search"
        >
          <Mic className="w-3.5 h-3.5" />
        </button>

        {/* Search Trigger inside Pill Bar */}
        <button
          onClick={() => {
            setIsSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          title="Search"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* --- Right: Actions & User Profile --- */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Mobile Search Button */}
        <button
          onClick={() => {
            setIsSearchOpen(true);
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }}
          className="lg:hidden p-2 rounded-full bg-white/[0.06] border border-white/10 text-gray-300 hover:text-white backdrop-blur-xl"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Tokens / Free Tier Pill */}
        <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-white/[0.04] backdrop-blur-xl border border-white/10 text-gray-200 shadow-sm">
          <Zap className="w-3 h-3 text-[#f5b700]" />
          <span>Free</span>
        </div>

        {/* Mobile App Download */}
        <button
          onClick={() => navigate('/downloads')}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
          title="Downloads & App"
        >
          <Smartphone className="w-4 h-4" />
        </button>

        {/* History / Library */}
        <button
          onClick={() => navigate('/history')}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
          title="History"
        >
          <Bookmark className="w-4 h-4" />
        </button>

        {/* Performance Indicator */}
        <button
          onClick={() => navigate('/trending')}
          className="hidden md:flex p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5 transition"
          title="Speed & Trends"
        >
          <Gauge className="w-4 h-4" />
        </button>

        {/* User Profile Avatar Pill */}
        <button
          onClick={() => {
            if (!user) setAuthModalOpen(true);
            else navigate('/settings');
          }}
          className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white transition"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center text-[10px] font-bold">
            {user?.email ? user.email.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-gray-300">
            {user?.email ? user.email.split('@')[0] : 'Sign In'}
          </span>
        </button>
      </div>

      {/* --- Search Overlay Modal / Dropdown --- */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4">
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl bg-[#14161f] border border-white/15 rounded-2xl shadow-2xl overflow-hidden p-4"
            >
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 border-b border-white/10 pb-3">
                <Search className="w-5 h-5 text-[#f5b700] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search movies, series, songs, creators..."
                  className="w-full bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </form>

              {/* Suggestions / Results */}
              <div className="mt-3 max-h-80 overflow-y-auto no-scrollbar flex flex-col gap-1.5">
                {loading && <div className="text-center py-4 text-xs text-gray-400">Searching MacFeed database...</div>}
                {!loading && results.length > 0 && (
                  results.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleVideoSelect(item)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition"
                    >
                      <img
                        src={item.thumbnail_url || 'https://via.placeholder.com/120x68'}
                        className="w-14 h-9 rounded-lg object-cover shrink-0"
                        alt=""
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-white truncate">{item.title}</div>
                        <div className="text-[10px] text-gray-400">{item.category || 'Video'}</div>
                      </div>
                    </div>
                  ))
                )}
                {!loading && query.length >= 2 && results.length === 0 && (
                  <div className="text-center py-4 text-xs text-gray-400">
                    Press Enter to perform global search for "{query}"
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
