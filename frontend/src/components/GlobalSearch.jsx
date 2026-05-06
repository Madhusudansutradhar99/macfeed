import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Music, Play, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useMusicPlayer } from '../context/MusicContext';
import Fuse from 'fuse.js';

function formatViews(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

export default function GlobalSearch({ collapsed, isMobile }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef();
  const containerRef = useRef();
  const navigate = useNavigate();
  const musicPlayer = useMusicPlayer();

  const isTopPosition = isFocused || query.length > 0;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        fetchResults(query);
      } else {
        setResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Click outside to close dropdown and unfocus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
        if (query.trim() === '') {
          setIsHovered(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query]);

  const fetchResults = async (q) => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .ilike('title', `%${q}%`)
        .limit(8);
      
      if (!error && data) {
        setResults(data);
      }
    } catch (err) {
      console.error("Search fetch error:", err);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsFocused(false);
    setIsHovered(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsFocused(false);
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  const handleResultClick = (video) => {
    if (video.category === 'Music' && musicPlayer?.playVideo) {
      musicPlayer.playVideo(video);
    } else {
      navigate(`/watch/${video.id}`);
    }
    setQuery('');
    setIsFocused(false);
    setIsHovered(false);
  };

  // Mobile behavior is just a full screen overlay, which we might handle differently,
  // but for now, we'll assume this component is used in Desktop sidebar.
  if (isMobile) return null; // We'll handle mobile search separately or adapt this later.

  const showExpanded = isHovered || isFocused || query.length > 0 || !collapsed;

  return (
    <>
      {/* Backdrop for top position search */}
      <AnimatePresence>
        {isTopPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={clearSearch}
          />
        )}
      </AnimatePresence>

      {/* 
        We use motion.div with layout to smoothly transition from 
        relative sidebar position to fixed top position 
      */}
      <div
        className={
          isTopPosition
            ? 'fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[600px] max-w-[90vw]'
            : 'absolute left-0 top-0 z-50 shadow-lg'
        }
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isFocused && !query) setIsHovered(false);
        }}
        onPointerDown={() => setIsHovered(true)}
        onPointerLeave={() => {
          if (!isFocused && !query) setIsHovered(false);
        }}
        onClick={() => {
          setIsFocused(true);
          // Small timeout to ensure input is mounted before focusing
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
      >
        <motion.div
          layout
          initial={false}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`flex items-center bg-[#181828] rounded-xl overflow-hidden transition-colors ${isFocused ? 'ring-1 ring-purple-500/50 border border-purple-500' : 'border border-transparent hover:border-white/10'} ${isTopPosition ? 'shadow-2xl shadow-purple-900/20 bg-gradient-to-r from-[#181828] to-[#1a1a2e]' : ''}`}
          style={{ width: isTopPosition ? '100%' : showExpanded ? 240 : 44 }}
        >
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 text-gray-400">
            <Search className="w-5 h-5" />
          </div>

          <AnimatePresence>
            {(showExpanded || isTopPosition) && (
              <motion.input
                ref={inputRef}
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search..."
                className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm pr-10"
              />
            )}
          </AnimatePresence>

          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 text-gray-500 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {isTopPosition && results.length > 0 && (
            <motion.div
              layoutId="search-results"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 8 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 bg-[#14141f] rounded-2xl shadow-2xl border border-white/10 overflow-hidden max-h-[420px] overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#8B5CF6 transparent' }}
            >
              <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                Search Results
              </div>
              {results.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-purple-600/10 cursor-pointer transition-colors group"
                  onClick={() => handleResultClick(v)}
                >
                  <div className="relative flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden bg-black">
                    <img
                      src={v.thumbnail_url}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/30">
                      {v.category === 'Music' ? (
                        <Music className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white fill-white" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate group-hover:text-purple-300 transition">
                      {v.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-purple-600/20 text-purple-300 px-1.5 py-0.5 rounded font-medium">
                        {v.category}
                      </span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                        <TrendingUp className="w-2.5 h-2.5" /> {formatViews(v.views)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div
                className="px-4 py-3 text-center text-sm text-purple-400 hover:bg-purple-600/10 cursor-pointer transition border-t border-white/5 font-medium"
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(query)}`);
                  setIsFocused(false);
                }}
              >
                See all results for "{query}" →
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
