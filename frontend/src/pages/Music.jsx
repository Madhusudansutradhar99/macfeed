import React, { useEffect, useState, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, ArrowLeft, Music as MusicIcon, Search, Flame, Clock, Sparkles,
  Download, Heart, ChevronLeft, ChevronRight, AlertTriangle, Folder, Upload, Settings, Trash, Maximize2, X, Palette, Plus
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useMusicPlayer } from '../context/MusicContext';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import { useNavigate } from 'react-router-dom';
import * as musicMetadata from 'music-metadata-browser';
import { Buffer } from 'buffer';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import { createClient } from '@supabase/supabase-js';
import 'swiper/css';
import 'swiper/css/free-mode';
import { fetchJson } from '../utils/request';

if (typeof window !== 'undefined') window.Buffer = window.Buffer || Buffer;

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const themes = [
  { name: 'Cyberpunk', bg1: '#2B9EAD', bg2: '#4C1D95', bg3: '#094F5C', bg4: '#8B5CF6', bg5: '#1A8A95', bg6: '#EC4899', bg7: '#0D6670', blur1: '#F472B6', blur2: '#2DD4BF', border: 'border-pink-500/50', bgBorder: 'bg-pink-500/50' },
  { name: 'Neon Dream', bg1: '#F43F5E', bg2: '#8B5CF6', bg3: '#3B82F6', bg4: '#EC4899', bg5: '#6366F1', bg6: '#14B8A6', bg7: '#0F766E', blur1: '#FCD34D', blur2: '#67E8F9', border: 'border-cyan-400/60', bgBorder: 'bg-cyan-400/60' },
  { name: 'Sunset Vibe', bg1: '#F59E0B', bg2: '#E11D48', bg3: '#4C1D95', bg4: '#FCD34D', bg5: '#F43F5E', bg6: '#9333EA', bg7: '#581C87', blur1: '#FDE047', blur2: '#F472B6', border: 'border-amber-400/60', bgBorder: 'bg-amber-400/60' },
  { name: 'Aurora', bg1: '#10B981', bg2: '#3B82F6', bg3: '#1E3A8A', bg4: '#34D399', bg5: '#2563EB', bg6: '#8B5CF6', bg7: '#4C1D95', blur1: '#6EE7B7', blur2: '#A78BFA', border: 'border-emerald-400/50', bgBorder: 'bg-emerald-400/50' },
  { name: 'Dark Void', bg1: '#111827', bg2: '#000000', bg3: '#030712', bg4: '#1F2937', bg5: '#0F172A', bg6: '#1E1B4B', bg7: '#000000', blur1: '#6366F1', blur2: '#EC4899', border: 'border-fuchsia-500/40', bgBorder: 'bg-fuchsia-500/40' },
  { name: 'Cosmic', bg1: '#312E81', bg2: '#831843', bg3: '#4C1D95', bg4: '#4F46E5', bg5: '#BE185D', bg6: '#D946EF', bg7: '#1E1B4B', blur1: '#818CF8', blur2: '#F472B6', border: 'border-purple-400/50', bgBorder: 'bg-purple-400/50' }
];

const MusicBackground = memo(({ themeIdx = 0 }) => {
  const t = themes[themeIdx] || themes[0];
  return (
    <div className="fixed inset-0 z-0 pointer-events-none transition-colors duration-1000">
      <div className="absolute inset-0 transition-all duration-1000" style={{ background: `radial-gradient(ellipse at center, ${t.bg1} 0%, ${t.bg2} 50%, ${t.bg3} 100%)` }}>
        <div className="absolute inset-0 opacity-60 mix-blend-overlay transition-all duration-1000" style={{ background: `linear-gradient(135deg, ${t.bg4} 0%, ${t.bg5} 40%, ${t.bg6} 70%, ${t.bg7} 100%)` }} />
        <div className="absolute inset-0 bg-[#041D24]/30" />
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] blur-[130px] rounded-full transition-colors duration-1000" style={{ backgroundColor: t.blur1, opacity: 0.1 }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] blur-[130px] rounded-full transition-colors duration-1000" style={{ backgroundColor: t.blur2, opacity: 0.15 }} />
      </div>
    </div>
  );
});

export default function Music() {
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('New');
  const [ytResults, setYtResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef(null);

  const musicPlayer = useMusicPlayer();
  const {
    playVideo, setIsExpanded, playlist: contextPlaylist,
    deviceSongs, devicePermission, isScanning, requestDevicePermission,
    handleDeviceFiles, refreshDeviceMusic, removeDeviceSong
  } = musicPlayer || {};
  const { user } = useAuth();
  const navigate = useNavigate();

  // Upload States
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [pendingUploadFile, setPendingUploadFile] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '' });

  const [themeIdx, setThemeIdx] = useState(0);
  const [showCapsule, setShowCapsule] = useState(false);

  const currentTheme = themes[themeIdx] || themes[0];
  const activeBorder = currentTheme.border;
  const activeBgBorder = currentTheme.bgBorder;
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'sutradharmadhusudan676@gmail.com').split(',').map((email) => email.trim().toLowerCase());
  const isAdmin = !!(user?.email && adminEmails.includes(user.email.toLowerCase()));

  const showToast = useCallback((message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 1800);
  }, []);

  const canDeleteSong = useCallback((song) => {
    if (!user || !song) return false;
    if (isAdmin) return true;
    if (song.source === 'device') return true;
    return song.source === 'local' && song.user_id === user.id;
  }, [isAdmin, user]);

  const parseBucketPathFromUrl = useCallback((publicUrl, bucketName) => {
    if (!publicUrl || !publicUrl.startsWith('http')) return null;
    try {
      const marker = `/${bucketName}/`;
      const parsed = new URL(publicUrl);
      const idx = parsed.pathname.indexOf(marker);
      if (idx === -1) return null;
      return decodeURIComponent(parsed.pathname.slice(idx + marker.length));
    } catch (err) {
      return null;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (contextPlaylist && contextPlaylist.length > 0) {
      setSongs(contextPlaylist);
      setFilteredSongs(contextPlaylist);
      setLoading(false);
    } else {
      fetchMusic();
    }
  }, [contextPlaylist]);

  async function fetchMusic() {
    setLoading(true);
    try {
      const cached = localStorage.getItem('macfeed_music_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        setSongs(parsed);
        setFilteredSongs(parsed);
        setLoading(false); // Show stale data immediately
      }
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('category', 'Music')
        .order('created_at', { ascending: false });
      const musicData = deduplicate(data || []);
      setSongs(musicData);
      setFilteredSongs(musicData);
      localStorage.setItem('macfeed_music_cache', JSON.stringify(musicData));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const scrapeGlobal = async (q) => {
    const strictQuery = (q.toLowerCase().includes('song') || q.toLowerCase().includes('music') || q.toLowerCase().includes('audio'))
      ? q
      : `${q} official music video`;

    // Backend Search ONLY (has disk cache)
    try {
      const { response, data } = await fetchJson(`${API_BASE_URL}/search?q=${encodeURIComponent(strictQuery)}`, {}, { timeoutMs: 10000, retryTimeoutMs: 5000, retries: 1 });
      if (response.ok && data?.results?.length > 0) {
        return data.results.map(v => ({
          id: `yt-${v.ytId || v.id}`,
          youtube_id: v.ytId || v.id, // Add snake_case version
          youtubeId: v.ytId || v.id,
          title: v?.title || 'Untitled Video',
          thumbnail_url: (v.thumbnail || v.thumbnail_url)?.replace('maxresdefault.jpg', 'mqdefault.jpg') || '',
          video_url: `https://www.youtube.com/embed/${v.ytId || v.id}`,
          source: 'youtube',
          category: 'Music',
          views: 0
        }));
      }
    } catch (e) { }

    return [];
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setYtResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const q = searchQuery.toLowerCase().includes('music') ? searchQuery : `${searchQuery} music video`;
        const results = await scrapeGlobal(q);
        setYtResults(results || []);
      } catch (err) {
        console.error('YouTube Search Failed:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleGlobalSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) setIsSearchFocused(true);
  };

  const uploadSongOnce = useCallback(async (file) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const freshSupabase = createClient(supabaseUrl, supabaseAnonKey);

    setUploadProgress(0);
    setUploadStatus('Extracting metadata...');
    setUploadProgress(15);

    const arrayBuffer = await file.arrayBuffer();
    const fileClone = new Blob([arrayBuffer], { type: file.type || 'audio/mpeg' });

    let title = file.name.replace(/\.[^/.]+$/, '');
    let artist = 'Unknown Artist';
    let thumbnailPublicUrl = '/default_music_cover.jpg';
    let coverFile = null;

    try {
      const metadata = await musicMetadata.parseBlob(fileClone);
      if (metadata.common.title) title = metadata.common.title;
      if (metadata.common.artist) artist = metadata.common.artist;

      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const pic = metadata.common.picture[0];
        const ext = pic.format.split('/')[1] || 'jpg';
        coverFile = {
          path: `${user?.id || 'anon'}/${Date.now()}.${ext}`,
          blob: new Blob([pic.data], { type: pic.format }),
          contentType: pic.format,
        };
      }
    } catch (metaErr) {
      // Continue with defaults when metadata parsing fails.
    }

    const audioFileName = `${user?.id || 'anon'}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    setUploadStatus('Uploading audio file... 15%');
    setUploadProgress(15);

    let pseudo = 15;
    const pseudoTimer = setInterval(() => {
      pseudo = Math.min(pseudo + 4, 82);
      setUploadProgress(pseudo);
      setUploadStatus(`Uploading audio file... ${pseudo}%`);
    }, 450);

    // Upload using the original File/Blob instead of ArrayBuffer to avoid fetch stream issues
    const { error: uploadErr } = await freshSupabase.storage
      .from('music')
      .upload(audioFileName, file, { upsert: true, contentType: file.type || 'audio/mpeg' });

    clearInterval(pseudoTimer);
    if (uploadErr) throw uploadErr;

    setUploadProgress(85);
    setUploadStatus('Uploading audio file... 85%');

    const { data: audioData } = freshSupabase.storage.from('music').getPublicUrl(audioFileName);

    setUploadStatus('Saving thumbnail...');
    setUploadProgress(90);
    if (coverFile) {
      const { error: coverErr } = await freshSupabase.storage
        .from('thumbnails')
        .upload(coverFile.path, coverFile.blob, { upsert: true, contentType: coverFile.contentType });
      if (!coverErr) {
        const { data } = freshSupabase.storage.from('thumbnails').getPublicUrl(coverFile.path);
        if (data?.publicUrl) thumbnailPublicUrl = data.publicUrl;
      }
    }
    setUploadProgress(95);

    setUploadStatus('Saving to library...');
    setUploadProgress(97);

    const newSong = {
      title: `${artist} - ${title}`,
      video_url: audioData?.publicUrl,
      thumbnail_url: thumbnailPublicUrl,
      source: 'local',
      category: 'Music'
    };

    const { data: existingSong } = await supabase
      .from('videos')
      .select('id')
      .eq('title', newSong.title)
      .limit(1);

    if (existingSong?.length) {
      showToast('This song is already in your library!');
      setUploadStatus('');
      setUploadProgress(0);
      setPendingUploadFile(null);
      return;
    }

    const { data: insertedData, error: dbErr } = await supabase.from('videos').insert([newSong]).select().single();
    if (dbErr) throw dbErr;

    setSongs(prev => {
      const next = [insertedData, ...prev];
      localStorage.setItem('macfeed_music_cache', JSON.stringify(next));
      return next;
    });
    setFilteredSongs(prev => [insertedData, ...prev]);

    setUploadStatus('✅ Upload successful!');
    setUploadProgress(100);
    setUploadError('');
    setPendingUploadFile(null);
    setTimeout(() => {
      setUploadStatus('');
      setUploadProgress(0);
    }, 2500);
  }, [user?.id]);

  const runUploadWithRetry = useCallback(async (file) => {
    setUploadError('');
    setPendingUploadFile(file);

    let lastError = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        setUploadProgress(0);
        await uploadSongOnce(file);
        return;
      } catch (err) {
        lastError = err;
        // If aborted, pause briefly before retrying; otherwise still retry with a small backoff
        if (attempt < 3) {
          const shortDelay = /aborted/i.test(err?.message || '') ? 1200 : 700;
          setUploadStatus(`Retrying upload (${attempt}/2)...`);
          setUploadProgress(0);
          await new Promise((res) => setTimeout(res, shortDelay));
        }
      }
    }

    // Fallback: try backend upload if client upload fails
    try {
      setUploadStatus('Trying server upload fallback...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user?.id || 'anon');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setUploadStatus('✅ Upload successful (server)!');
        setUploadProgress(100);
        setUploadError('');
        setPendingUploadFile(null);
        setTimeout(() => {
          setUploadStatus('');
          setUploadProgress(0);
        }, 2500);
        // Optionally, refresh song list here
        return;
      } else {
        throw new Error(result.error || 'Server upload failed');
      }
    } catch (serverErr) {
      const message = lastError?.message || serverErr?.message || 'Upload failed. Please try again.';
      setUploadError(`Could not upload song after 3 attempts. ${message}`);
      setUploadStatus('Upload failed');
      setUploadProgress(0);
    }
  }, [uploadSongOnce]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 45 * 1024 * 1024) {
      setUploadError('File exceeds 45MB limit. Please choose a smaller file.');
      setUploadStatus('Upload failed');
      setUploadProgress(0);
      if (e.target) e.target.value = '';
      return;
    }

    await runUploadWithRetry(file);
    if (e.target) e.target.value = '';
  };

  const handleDeleteLocalSong = async (song, e) => {
    e.stopPropagation();
    if (!canDeleteSong(song)) {
      showToast('Could not delete, try again');
      return;
    }
    if (!window.confirm('Delete this song?')) return;

    const prevSongs = songs;
    const prevFiltered = filteredSongs;

    setSongs((prev) => prev.filter((s) => s.id !== song.id));
    setFilteredSongs((prev) => prev.filter((s) => s.id !== song.id));

    if (song.id?.toString().startsWith('device-')) {
      await removeDeviceSong(song.id);
      showToast('Song removed from device');
      return;
    }

    try {
      const audioPath = parseBucketPathFromUrl(song.video_url, 'music');
      const thumbPath = parseBucketPathFromUrl(song.thumbnail_url, 'thumbnails');

      let deleteQuery = supabase.from('videos').delete();
      
      const targetYtId = song.youtube_id || song.youtubeId;
      
      if (targetYtId) {
        // Delete all instances of this YouTube song by its actual YouTube ID
        deleteQuery = deleteQuery.eq('youtube_id', targetYtId);
      } else if (song.source === 'youtube' && song.video_url?.includes('youtube.com')) {
        // Fallback: extract ID from URL if possible
        const match = song.video_url.match(/(?:embed\/|v=)([^&?/\s]+)/);
        const extractedId = match ? match[1] : null;
        if (extractedId) {
          deleteQuery = deleteQuery.eq('youtube_id', extractedId);
        } else {
          deleteQuery = deleteQuery.eq('video_url', song.video_url);
        }
      } else {
        // Local or specific ID
        deleteQuery = deleteQuery.eq('id', song.id);
      }

      const { error: deleteErr } = await deleteQuery;
      if (deleteErr) throw deleteErr;

      // Global State & Cache Deep-Clean (handles duplicates)
      if (musicPlayer?.removeOnlineSong) {
        await musicPlayer.removeOnlineSong(song.id, targetYtId);
      }

      // Storage cleanup is secondary - don't let it block the main deletion
      try {
        if (audioPath) {
          await supabase.storage.from('music').remove([audioPath]);
        }
        if (thumbPath && !thumbPath.includes('default_music_cover')) {
          await supabase.storage.from('thumbnails').remove([thumbPath]);
        }
      } catch (storageErr) {
        console.warn('Storage cleanup failed (non-critical):', storageErr);
      }

      const history = JSON.parse(localStorage.getItem('macfeed_history') || '[]');
      localStorage.setItem('macfeed_history', JSON.stringify(history.filter((h) => h.id !== song.id)));

      const liked = JSON.parse(localStorage.getItem('macfeed_liked') || '[]');
      localStorage.setItem('macfeed_liked', JSON.stringify(liked.filter((l) => l.id !== song.id)));

      showToast('Song deleted successfully');
    } catch (err) {
      console.error('Deletion error:', err);
      setSongs(prevSongs);
      setFilteredSongs(prevFiltered);
      showToast(`Could not delete: ${err.message || 'Permission Denied'}`);
    }
  };


  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSongs(songs);
      setYtResults([]);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = songs.filter(s => s?.title?.toLowerCase().includes(q));
      setFilteredSongs(filtered);
    }
  }, [searchQuery, songs]);

  const deduplicate = (arr) => {
    if (!arr) return [];
    const seen = new Set();
    return arr.filter(item => {
      const cleanUrl = item.video_url?.split('?')[0];
      const key = item.youtube_id || cleanUrl || item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const [historyTrigger, setHistoryTrigger] = useState(0);

  const getDisplaySongs = () => {
    if (searchQuery.trim()) return deduplicate([...filteredSongs, ...ytResults]);
    if (activeTab === 'History') {
      const history = JSON.parse(localStorage.getItem('macfeed_history') || '[]');
      return deduplicate(history.filter(h => h.category === 'Music')).slice(0, 20);
    }
    if (activeTab === 'Liked') {
      const liked = JSON.parse(localStorage.getItem('macfeed_liked') || '[]');
      return deduplicate(liked.filter(l => l.category === 'Music'));
    }
    if (activeTab === 'My Uploads') return deduplicate(songs.filter(s => s.source === 'local'));
    if (activeTab === 'Artists') return deduplicate(songs).slice().sort(() => Math.random() - 0.5);
    return deduplicate(filteredSongs);
  };

  const addToHistory = (songToSave) => {
    try {
      const history = JSON.parse(localStorage.getItem('macfeed_history') || '[]');
      const filtered = history.filter(h => h.id !== songToSave.id);
      filtered.unshift({
        ...songToSave,
        playedAt: new Date().toISOString(),
        category: 'Music'
      });
      localStorage.setItem('macfeed_history', JSON.stringify(filtered.slice(0, 100)));
      setHistoryTrigger(prev => prev + 1);
    } catch (e) {
      console.error('Failed to save history', e);
    }
  };

  const handleSongClick = async (song, list = displaySongs) => {
    if (isProcessing) return;

    // Repair device song URL if stale (e.g. from history/likes)
    let songToPlay = song;
    if (song?.source === 'device') {
      const fresh = deviceSongs.find(s => s.id === song.id);
      if (fresh) {
        songToPlay = fresh;
      }
    }

    if (songToPlay?.id?.toString().startsWith('yt-')) {
      setIsProcessing(true);
      const ytId = songToPlay.youtube_id || songToPlay.youtubeId || songToPlay.id.replace('yt-', '');
      try {
        const { data: existing } = await supabase.from('videos').select('*').eq('youtube_id', ytId).limit(1);
        if (existing && existing.length > 0) {
          playVideo(existing[0]);
          addToHistory(existing[0]);
          setIsExpanded(true);
        } else {
          // Prevent duplicates by checking again right before insert
          const { data: checkAgain } = await supabase.from('videos').select('id').eq('youtube_id', ytId).limit(1);
          if (checkAgain?.length) {
            playVideo(checkAgain[0]);
            setIsExpanded(true);
          } else {
            const { data: inserted } = await supabase.from('videos').insert([{
              title: songToPlay?.title || 'Untitled Video',
              video_url: `https://www.youtube.com/embed/${ytId}`,
              youtube_id: ytId,
              thumbnail_url: songToPlay.thumbnail_url,
              source: 'youtube',
              category: 'Music',
              views: 0
            }]).select('*').single();

            if (inserted) {
              playVideo(inserted);
              addToHistory(inserted);
              setIsExpanded(true);
            }
          }
        }
      } catch (e) {
        playVideo(songToPlay);
        setIsExpanded(true);
      } finally {
        setIsProcessing(false);
      }
    } else {
      playVideo(songToPlay);
      addToHistory(songToPlay);
      setIsExpanded(true);
    }
  };

  if (loading) return <Loader />;

  const displaySongs = getDisplaySongs();
  const heroSong = displaySongs.length > 0 ? displaySongs[0] : songs[0];
  const sideSongs = displaySongs.slice(0, 5);
  const bottomSongs = displaySongs.slice(5, 16);
  const rawHistory = JSON.parse(localStorage.getItem('macfeed_history') || '[]').filter(h => h.category === 'Music');
  const recentlyPlayed = deduplicate(rawHistory.length > 0 ? rawHistory : songs).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0F1115] text-white overflow-hidden relative font-sans selection:bg-purple-500/30">
      <MusicBackground themeIdx={themeIdx} />

      <div className="relative z-10 w-full h-full">
        {/* Floating Controls */}
        {/* Floating Controls Removed - Moved to Tabs */}

        {/* Hidden Input & Progress Bar ALWAYS MOUNTED */}
        {user && (
          <>
            <input
              id="music-upload-input"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                console.log("File selected via input onChange:", e.target.files);
                handleFileUpload(e);
              }}
              aria-label="Upload audio file"
            />
            {(uploadStatus || uploadError) && (
              <div className="fixed bottom-6 left-1/2 z-[9999] w-[92vw] max-w-md -translate-x-1/2 rounded-2xl border border-white/10 bg-[#0F1115]/95 p-4 shadow-2xl backdrop-blur-xl">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/80">{uploadError ? 'Upload error' : uploadStatus}</div>
                  <div className="text-xs font-black tabular-nums text-purple-300">{Math.round(uploadProgress)}%</div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-purple-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
                {uploadError ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-red-300">{uploadError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (pendingUploadFile) runUploadWithRetry(pendingUploadFile);
                      }}
                      className="rounded-lg border border-white/20 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10"
                    >
                      Retry
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}

        {toast.show ? (
          <div className="fixed top-6 left-1/2 z-[9999] -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-white backdrop-blur-md">
            {toast.message}
          </div>
        ) : null}

        {/* Device Music Hidden Input */}
        <input
          id="device-music-input"
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={(e) => handleDeviceFiles(e.target.files)}
          aria-label="Add Device Music"
        />

        <div className="w-full h-full bg-transparent flex flex-col overflow-hidden pt-8 md:pt-12">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-4 gap-4">
            <div ref={dropdownRef} className="relative w-full max-w-md z-[5000]">
              <form onSubmit={handleGlobalSearch} className={`flex items-center gap-4 bg-transparent backdrop-blur-md px-6 py-2.5 rounded-full border-2 ${activeBorder} transition-colors duration-500 w-full group`}>
                <button type="submit" className="outline-none">
                  <Search className="w-5 h-5 text-red-500 group-focus-within:text-red-400 hover:text-red-300 transition-colors cursor-pointer" />
                </button>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search Music & YouTube..."
                  className="bg-transparent border-none outline-none text-white text-[11px] font-black uppercase italic tracking-widest w-full placeholder:text-white/30"
                />
                {searchLoading && <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />}
              </form>
              <AnimatePresence>
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 bg-[#0F1115]/95 backdrop-blur-3xl border border-red-500/30 rounded-xl md:rounded-2xl shadow-2xl mt-2 overflow-hidden z-[5000]">
                    <div className="max-h-[60vh] overflow-y-auto pb-4 custom-scrollbar">
                      <div className="px-4 md:px-6 py-3 text-[10px] font-black text-white/50 uppercase tracking-[0.3em] border-b border-white/5">Results for "{searchQuery}"</div>

                      {filteredSongs.slice(0, 3).map((r) => (
                        <div key={'loc-' + r.id} onClick={() => { handleSongClick(r); setIsSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2 md:py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 group transition-all">
                          <div className="relative w-12 md:w-16 h-8 md:h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                            <img src={r.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-[10px] md:text-xs font-black truncate group-hover:text-red-400 transition-colors uppercase italic">{r.title}</p>
                            <span className="text-[7px] md:text-[8px] text-purple-400 font-black uppercase mt-0.5 inline-block bg-purple-500/10 px-1.5 py-0.5 rounded">MacFeed</span>
                          </div>
                          {canDeleteSong(r) && (
                            <button onClick={(e) => handleDeleteLocalSong(r, e)} className="p-2 bg-red-500/10 hover:bg-red-500/30 rounded text-red-500 transition-colors">
                              <Trash className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}

                      {ytResults.map((r, idx) => (
                        <div key={'yt-' + r.id + idx} onClick={() => { handleSongClick(r); setIsSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-2 md:py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 group transition-all">
                          <div className="relative w-12 md:w-16 h-8 md:h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
                            <img src={r.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-[10px] md:text-xs font-black truncate group-hover:text-red-400 transition-colors uppercase italic">{r.title}</p>
                            <span className="text-[7px] md:text-[8px] text-red-500 font-black uppercase mt-0.5 inline-block bg-red-500/10 px-1.5 py-0.5 rounded">YouTube</span>
                          </div>
                        </div>
                      ))}

                      {!searchLoading && filteredSongs.length === 0 && ytResults.length === 0 && (
                        <div className="p-8 text-center text-white/50 font-black uppercase italic tracking-[0.2em] text-xs">Searching Universe...</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex gap-4 md:gap-8 overflow-visible w-full md:w-auto items-center relative z-[4000]">
              <div className="relative shrink-0 flex items-center">
                <button onClick={() => setShowCapsule(!showCapsule)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                  <Settings className={`w-4 h-4 transition-transform duration-500 ${showCapsule ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {showCapsule && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: -10 }} className="absolute top-10 left-0 bg-[#0F1115] border border-white/10 shadow-2xl rounded-2xl flex flex-col gap-1 p-2 z-[4001]">
                      <button onClick={() => navigate('/')} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"><ArrowLeft className="w-4 h-4 rotate-180" /></button>
                      <button onClick={() => { setActiveTab('Liked'); setSearchQuery(''); setShowCapsule(false); }} className={`p-2 rounded-full transition-all ${activeTab === 'Liked' && !searchQuery ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}><Heart className={`w-4 h-4 ${activeTab === 'Liked' && !searchQuery ? 'fill-white' : ''}`} /></button>
                      <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"><Download className="w-4 h-4" /></button>
                      <button onClick={() => setThemeIdx(p => (p + 1) % themes.length)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"><Palette className="w-4 h-4" /></button>
                      {user && (
                        <button
                          onClick={() => {
                            const fileInput = document.getElementById('music-upload-input');
                            if (fileInput) fileInput.click();
                            setShowCapsule(false);
                          }}
                          className="w-8 h-8 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-4 md:gap-8 overflow-x-auto w-full md:w-auto no-scrollbar items-center">
                {['New', 'My Uploads', 'All Hits', 'Artists', 'History'].map((tab) => (
                  <button key={tab} onClick={() => { setActiveTab(tab); setSearchQuery(''); }} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all relative py-2 shrink-0 ${activeTab === tab && !searchQuery ? 'text-white' : 'text-white/30 hover:text-white'}`}>
                    {tab}
                    {activeTab === tab && !searchQuery && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto px-6 md:px-12 pb-12 no-scrollbar">
            {activeTab === 'My Uploads' && !searchQuery ? (
              <div className="w-full flex flex-col gap-8 pt-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase tracking-[0.3em] text-white/80 italic">My Uploads ({displaySongs.length})</h3>
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                </div>
                <div className={`flex flex-col gap-4 bg-white/5 p-6 md:p-8 rounded-[2.5rem] border ${activeBorder} transition-colors duration-500 shadow-2xl`}>
                  {displaySongs.length === 0 ? (
                    <div className="text-center text-white/50 font-black uppercase tracking-widest text-xs py-10">No Uploads Yet.</div>
                  ) : displaySongs.map((song, i) => (
                    <div key={song.id} onClick={() => handleSongClick(song)} className={`relative flex items-center justify-between group cursor-pointer active:scale-95 bg-white/5 p-4 rounded-2xl border ${activeBorder} transition-colors duration-500 hover:border-purple-500/50`}>
                      {canDeleteSong(song) && (
                        <button onClick={(e) => handleDeleteLocalSong(song, e)} className="absolute right-2 top-2 z-20 rounded-full bg-red-500/15 p-2 text-red-400 transition-colors hover:bg-red-500 hover:text-white">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="text-[10px] font-black uppercase text-white/30 w-6">{(i + 1).toString().padStart(2, '0')}</div>
                        <div className={`w-14 h-14 rounded-xl overflow-hidden bg-white/10 shrink-0 border ${activeBorder} transition-colors duration-500`}>
                          <img src={song.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" alt="" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black uppercase tracking-tighter truncate text-white/80 group-hover:text-white max-w-[200px] md:max-w-md">{song.title}</span>
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">Local Audio</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full border ${activeBorder} transition-colors duration-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white`}><Play className="w-4 h-4 fill-current translate-x-0.5" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-12 gap-6 lg:gap-10">
                {/* Left Side */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-12 pt-4">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between"><h3 className="text-base font-black uppercase tracking-[0.3em] text-white/80 italic">{searchQuery ? 'Results' : activeTab}</h3><Sparkles className="w-5 h-5 text-yellow-500" /></div>
                    <div className="space-y-6">
                      {sideSongs.map((song, i) => (
                        <div key={song.id} onClick={() => handleSongClick(song)} className="relative flex items-center gap-6 group cursor-pointer transition-transform active:scale-95">
                          {canDeleteSong(song) && (
                            <button onClick={(e) => handleDeleteLocalSong(song, e)} className="absolute right-0 top-0 z-20 rounded-full bg-red-500/15 p-2 text-red-400 transition-colors hover:bg-red-500 hover:text-white">
                              <Trash className="w-3 h-3" />
                            </button>
                          )}
                          <div className="text-[9px] font-black uppercase text-white/30 w-4">0{i + 2}</div>
                          <div className={`w-16 h-16 rounded-3xl overflow-hidden shrink-0 border ${activeBorder} transition-colors duration-500 bg-white/5`}><img src={song.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" /></div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black uppercase italic tracking-wider truncate mb-1">{song.title}</h4>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">{song.source === 'local' ? 'Local' : 'YouTube'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full border-2 ${activeBorder} transition-colors duration-500 flex items-center justify-center group-hover:border-purple-500 group-hover:bg-purple-500`}><Play className="w-4 h-4 fill-white" /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex items-center justify-between"><h3 className="text-base font-black uppercase tracking-[0.3em] text-white/80 italic">Recent</h3></div>
                    <div className={`space-y-5 bg-white/5 p-6 md:p-8 rounded-[2.5rem] border ${activeBorder} transition-colors duration-500 shadow-2xl`}>
                      {recentlyPlayed.map(song => (
                        <div key={song.id} onClick={() => handleSongClick(song)} className="relative flex items-center justify-between group cursor-pointer transition-transform active:scale-95">
                          {canDeleteSong(song) && (
                            <button onClick={(e) => handleDeleteLocalSong(song, e)} className="absolute right-0 top-0 z-20 rounded-full bg-red-500/15 p-2 text-red-400 transition-colors hover:bg-red-500 hover:text-white">
                              <Trash className="w-3 h-3" />
                            </button>
                          )}
                          <div className="flex items-center gap-5 min-w-0">
                            <div className={`w-12 h-12 rounded-2xl overflow-hidden bg-white/10 shrink-0 border ${activeBorder} transition-colors duration-500`}><img src={song.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" alt="" /></div>
                            <span className="text-[11px] font-black uppercase tracking-tighter truncate text-white/60 group-hover:text-white">{song.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full border ${activeBorder} transition-colors duration-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white`}><Play className="w-3.5 h-3.5 fill-current" /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div className="col-span-12 lg:col-span-7 space-y-12">
                  {heroSong && (
                    <div onClick={() => handleSongClick(heroSong)} className={`relative w-full h-[220px] md:h-[280px] rounded-[3.5rem] overflow-hidden cursor-pointer group border ${activeBorder} transition-all duration-500 shadow-2xl active:scale-[0.98] bg-white/5`}>
                      <img src={heroSong.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="w-full h-full object-cover object-center transition-transform duration-[3s] group-hover:scale-105" alt="" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8">
                        <div className="flex items-center gap-2 mb-2"><span className="bg-yellow-500 text-black px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest italic">Featured</span></div>
                        <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter leading-[1.1] mb-3 max-w-md">{heroSong.title}</h2>
                        <div className="flex gap-3">
                          <button className="bg-white text-black px-5 py-2 rounded-full font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:bg-yellow-500 transition-all shadow-xl">
                            <Play className="w-3 h-3 fill-black" /> Play Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-10 pb-10">
                    <div className="px-2"><h3 className="text-base font-black uppercase italic tracking-[0.4em] text-white/90">More Music</h3></div>
                    {!searchQuery && (
                      <div className="relative w-full h-[500px] flex items-center">
                        <div className="w-1/2 h-full flex flex-col items-center justify-center relative z-10 border-r border-white/5 hidden md:flex">
                          <img src="/macfeed-logo.png" className="w-32 h-32 md:w-48 md:h-48 drop-shadow-[0_0_30px_#a855f7]" alt="" />
                          <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">MAC<span className="text-purple-500">FEED</span></h2>
                        </div>
                        <div className="w-full md:w-1/2 h-full relative overflow-hidden flex items-center">
                          <Swiper modules={[Autoplay, FreeMode]} spaceBetween={30} slidesPerView={'auto'} loop={true} freeMode={true} autoplay={{ delay: 0, disableOnInteraction: false }} speed={5000} className="w-full px-4">
                            {songs.slice(0, 10).map((song, i) => (
                              <SwiperSlide key={`${song.id}-${i}`} className="!w-auto py-20">
                                <div onClick={() => handleSongClick(song)} className="relative w-36 h-44 md:w-56 md:h-64 cursor-pointer group transition-transform hover:scale-110 active:scale-95" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                  <div className={`absolute inset-0 ${activeBgBorder} transition-colors duration-500 group-hover:bg-purple-500 p-[2px]`} style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                    <div className="w-full h-full bg-[#0F1115] overflow-hidden relative" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                      <img src={song.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:brightness-110 transition-all duration-1000" alt="" />
                                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-30 px-4 text-center bg-black/40 backdrop-blur-[2px]">
                                        <h5 className="text-[10px] font-black uppercase text-white line-clamp-3">{song.title}</h5>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </SwiperSlide>
                            ))}
                          </Swiper>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6">
                      {bottomSongs.map((song) => (
                        <div key={song.id} onClick={() => handleSongClick(song)} className="w-[180px] md:w-[240px] shrink-0 group cursor-pointer transition-transform active:scale-95">
                          <div className={`aspect-[2/3] rounded-[2.5rem] overflow-hidden mb-4 relative border ${activeBorder} transition-colors duration-500 shadow-2xl bg-white/5`}>
                            <img src={song.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                            {canDeleteSong(song) && (
                              <button onClick={(e) => handleDeleteLocalSong(song, e)} className="absolute right-3 top-3 z-20 rounded-full bg-red-500/20 p-2 text-red-300 transition-all hover:bg-red-500 hover:text-white">
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-6">
                              <h5 className="text-[10px] font-black uppercase italic line-clamp-2 leading-tight mb-2">{song.title}</h5>
                              <div className="flex items-center justify-between">
                                <div className={`w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border ${activeBorder} transition-colors duration-500 group-hover:bg-purple-600`}><Play className="w-3.5 h-3.5 fill-white" /></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-12 space-y-10">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black uppercase italic tracking-[0.4em] text-white/90">My Device Music</h3>
                {devicePermission && (
                  <button
                    onClick={refreshDeviceMusic}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all group"
                  >
                    {isScanning ? (
                      <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Clock className="w-3 h-3 text-purple-400 group-hover:rotate-180 transition-transform duration-500" />
                    )}
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Refresh</span>
                  </button>
                )}
              </div>

              {(!devicePermission && deviceSongs.length === 0) ? (
                <div className={`p-10 rounded-[3rem] border-2 border-dashed ${activeBorder} bg-white/5 flex flex-col items-center justify-center text-center gap-6 group hover:bg-white/10 transition-all duration-500`}>
                  <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <MusicIcon className="w-10 h-10 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase italic tracking-wider text-white mb-2">Access Device Music</h4>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 max-w-xs">Allow MacFeed to scan and play music files directly from your device storage.</p>
                  </div>
                  <button
                    onClick={requestDevicePermission}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] transition-all active:scale-95"
                  >
                    Allow / Grant Permission
                  </button>
                </div>
              ) : (
                <>
                  {isScanning && deviceSongs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 animate-pulse">Scanning device for music...</p>
                    </div>
                  ) : deviceSongs.length === 0 ? (
                    <div className={`p-10 rounded-[3rem] border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center gap-6`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">No device music found or added.</p>
                      <button
                        onClick={() => document.getElementById('device-music-input').click()}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all group"
                      >
                        <Plus className="w-4 h-4 text-purple-400 group-hover:scale-125 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Add More Music</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-6 overflow-x-auto no-scrollbar pb-10">
                      {deviceSongs.map((song) => (
                        <div key={song.id} onClick={() => handleSongClick(song, deviceSongs)} className="w-[180px] md:w-[240px] shrink-0 group cursor-pointer transition-transform active:scale-95">
                          <div className={`aspect-[2/3] rounded-[2.5rem] overflow-hidden mb-4 relative border ${activeBorder} transition-colors duration-500 shadow-2xl bg-white/5`}>
                            <img src={song.thumbnail_url} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                            <button
                              onClick={(e) => { e.stopPropagation(); removeDeviceSong(song.id); }}
                              className="absolute right-3 top-3 z-20 rounded-full bg-red-500/20 p-2 text-red-300 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                              <h5 className="text-[10px] font-black uppercase italic line-clamp-2 leading-tight mb-1">{song.title}</h5>
                              <p className="text-[8px] font-bold text-white/40 uppercase mb-3 truncate">{song.artist}</p>
                              <div className="flex items-center justify-between">
                                <div className={`w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border ${activeBorder} transition-colors duration-500 group-hover:bg-purple-600`}><Play className="w-3.5 h-3.5 fill-white" /></div>
                                <span className="text-[8px] font-bold text-white/30 uppercase">{Math.floor(song.duration / 60)}:{Math.floor(song.duration % 60).toString().padStart(2, '0')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={() => document.getElementById('device-music-input').click()}
                        className="w-[180px] md:w-[240px] shrink-0 aspect-[2/3] rounded-[2.5rem] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/5 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Plus className="w-6 h-6 text-white/20 group-hover:text-purple-400 transition-colors" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/60">Add More</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
