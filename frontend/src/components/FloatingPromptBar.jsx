import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  FolderOpen,
  Maximize2,
  Clock,
  Film,
  X,
  HardDrive,
  CheckCircle2,
  Layers,
  ChevronUp,
} from 'lucide-react';
import { useMusicPlayer } from '../context/MusicContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingPromptBar() {
  const {
    isLocalPlayerOpen,
    setIsLocalPlayerOpen,
    activeLocalSong,
    setActiveLocalSong,
    playingLocal,
    setPlayingLocal,
    playLocalFile,
    playLocalSong,
  } = useMusicPlayer();

  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showRecentMenu, setShowRecentMenu] = useState(false);
  const [recentLocal, setRecentLocal] = useState([]);
  const [backendConnected, setBackendConnected] = useState(true);
  const navigate = useNavigate();

  // Load recent local videos
  useEffect(() => {
    try {
      const recent = JSON.parse(localStorage.getItem('macfeed_recent_local') || '[]');
      setRecentLocal(recent);
    } catch (e) {
      setRecentLocal([]);
    }

    // Check backend connection
    fetch('/api/cache-stats')
      .then((res) => {
        if (res.ok) setBackendConnected(true);
      })
      .catch(() => setBackendConnected(false));
  }, [activeLocalSong]);

  const handleFileSelect = (e) => {
    const file = e.target.files
      ? e.target.files[0]
      : e.dataTransfer
      ? e.dataTransfer.files[0]
      : null;
    if (file) {
      const newMeta = {
        id: Date.now(),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        date: new Date().toLocaleDateString(),
      };

      const updated = [newMeta, ...recentLocal.filter((f) => f.name !== file.name)].slice(0, 8);
      localStorage.setItem('macfeed_recent_local', JSON.stringify(updated));
      setRecentLocal(updated);

      const history = JSON.parse(localStorage.getItem('macfeed_local_history') || '[]');
      const entry = {
        id: newMeta.id,
        title: file.name,
        name: file.name,
        lastPlayed: Date.now(),
        source: 'local',
        path: file.path || null,
      };
      const filtered = history.filter((h) => h.name !== entry.name);
      filtered.unshift(entry);
      localStorage.setItem('macfeed_local_history', JSON.stringify(filtered.slice(0, 50)));

      playLocalFile(file);
      if (e.target) e.target.value = '';
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e);
  };

  return (
    <div className="fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px))] md:bottom-6 left-0 right-0 z-[4000] px-2 sm:px-4 pointer-events-none">
      {/* Hidden File Input for Native File Browser */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="video/*,audio/*,.mkv,.ts,.m3u8,.mp4,.mp3,.webm,.mov"
        onChange={handleFileSelect}
      />

      <div className="max-w-2xl mx-auto pointer-events-auto relative">
        {/* Recent Files Dropdown Popup */}
        <AnimatePresence>
          {showRecentMenu && recentLocal.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: -10, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 right-0 mb-2 digen-card p-3 rounded-2xl shadow-2xl border border-white/10 z-50 max-h-60 overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-[#f5b700]" />
                  <span>Recent Local Videos</span>
                </div>
                <button
                  onClick={() => setShowRecentMenu(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                {recentLocal.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => {
                      setShowRecentMenu(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Film className="w-4 h-4 text-[#f5b700] shrink-0" />
                      <span className="text-xs font-medium text-white truncate max-w-[280px]">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono shrink-0">
                      {file.size || 'Local'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Center Local Player Capsule ─── */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`digen-floating-prompt rounded-2xl p-2 sm:p-2.5 transition-all duration-300 shadow-2xl border ${
            isDragging
              ? 'ring-2 ring-[#f5b700] border-[#f5b700] bg-[#f5b700]/10'
              : 'border-white/15'
          }`}
        >
          {activeLocalSong ? (
            /* Active Playing State */
            <div className="flex items-center justify-between gap-3 px-1 sm:px-2">
              <div
                onClick={() => setIsLocalPlayerOpen(true)}
                className="flex items-center gap-3 min-w-0 cursor-pointer flex-1 group"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f5b700] to-amber-600 flex items-center justify-center text-black shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                  <Film className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="digen-badge-amber text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                      Local Player
                    </span>
                    <div className="flex items-center gap-0.5">
                      {[6, 10, 7].map((h, i) => (
                        <div
                          key={i}
                          className={`w-0.5 bg-[#f5b700] rounded-full ${
                            playingLocal ? 'animate-bounce' : ''
                          }`}
                          style={{ height: `${h}px`, animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                  <h4 className="text-xs font-semibold text-white truncate group-hover:text-[#f5b700] transition-colors mt-0.5">
                    {activeLocalSong.title || 'Local Media File'}
                  </h4>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlayingLocal(!playingLocal);
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 border shadow-lg ${
                    playingLocal
                      ? 'bg-gradient-to-tr from-[#f5b700] to-amber-400 text-black border-[#f5b700] shadow-[0_0_20px_rgba(245,183,0,0.55)]'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-amber-400/50 shadow-[0_4px_12px_rgba(0,0,0,0.4)]'
                  }`}
                  title={playingLocal ? 'Pause Media' : 'Play Media'}
                >
                  {playingLocal ? (
                    <Pause className="w-4 h-4 fill-black text-black" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsLocalPlayerOpen(true);
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-jog-wheel'));
                    }, 150);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#f5b700] hover:bg-amber-400 text-black border border-[#f5b700] shadow-[0_0_20px_rgba(245,183,0,0.45)] transition active:scale-95"
                  title="Open Master Jog Wheel Player"
                >
                  <Maximize2 className="w-3.5 h-3.5 fill-black" />
                  <span>Jog Wheel 🎛️</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-full bg-white/[0.08] hover:bg-white/20 text-gray-200 hover:text-white border border-white/10 transition"
                  title="Open Another Video"
                >
                  <FolderOpen className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlayingLocal(false);
                    if (setActiveLocalSong) setActiveLocalSong(null);
                    setIsLocalPlayerOpen(false);
                  }}
                  className="p-1.5 rounded-full bg-white/[0.08] hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-white/10 transition active:scale-95"
                  title="Close Video & Reset Player"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Idle Ready State */
            <div className="flex items-center justify-between gap-2 px-1 sm:px-2">
              {/* Left Brand Badge */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1f232e] to-[#2e3444] border border-white/20 flex items-center justify-center text-[#f5b700] shadow">
                  <Film className="w-4 h-4" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-white tracking-wide uppercase">
                      Local Player
                    </span>
                    <span className="digen-badge-amber text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                      Pro 16K
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-none">
                    Hardware GPU Acceleration
                  </p>
                </div>
              </div>

              {/* Center Action: Open Local Video + Jog Wheel Launcher */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-white text-black hover:bg-gray-100 font-bold text-xs shadow-[0_0_20px_rgba(255,255,255,0.25)] transition active:scale-95"
                >
                  <FolderOpen className="w-4 h-4 text-black" />
                  <span>Open Local Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsLocalPlayerOpen(true);
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('open-jog-wheel'));
                    }, 150);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold bg-[#f5b700] hover:bg-amber-400 text-black border border-[#f5b700] shadow-[0_0_15px_rgba(245,183,0,0.35)] transition active:scale-95"
                  title="Open Master Jog Wheel Player"
                >
                  <Maximize2 className="w-3.5 h-3.5 fill-black" />
                  <span className="hidden xs:inline">Jog Wheel 🎛️</span>
                </button>
              </div>

              {/* Right Tools: Recent + Library */}
              <div className="flex items-center gap-1.5 shrink-0">
                {recentLocal.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowRecentMenu(!showRecentMenu)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition"
                    title="Recent Local Files"
                  >
                    <Clock className="w-3.5 h-3.5 text-[#f5b700]" />
                    <span className="hidden md:inline">Recent</span>
                    <ChevronUp
                      className={`w-3 h-3 transition-transform ${
                        showRecentMenu ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/playlists')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition"
                  title="MacFeed Library"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Library</span>
                </button>

                {backendConnected && (
                  <span
                    className="hidden lg:flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full"
                    title="Backend Server Connected (localhost:5000)"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Sync</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
