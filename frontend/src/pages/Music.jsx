import React, { useEffect, useState, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, ArrowLeft, Music as MusicIcon, Search, Flame, Clock, Sparkles,
  Download, Heart, ChevronLeft, ChevronRight, AlertTriangle, Folder, Upload, Settings, Trash, Maximize2, X, Palette, Plus, Menu
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
    const cached = localStorage.getItem('macfeed_music_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setSongs(parsed);
        setFilteredSongs(parsed);
        setLoading(false); // Skip loader if we have cache
      } catch (e) {
        localStorage.removeItem('macfeed_music_cache');
        setLoading(true);
      }
    } else {
      setLoading(true);
    }

    try {
      // Background fetch - only update if online
      if (!navigator.onLine && cached) return;
      let query = supabase
        .from('videos')
        .select('*')
        .eq('category', 'Music');

      if (user) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.is('user_id', null);
      }

      const { data } = await query.order('created_at', { ascending: false });
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
      category: 'Music',
      user_id: user?.id
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
    if (activeTab === 'Recent') {
      const history = JSON.parse(localStorage.getItem('macfeed_history') || '[]');
      return deduplicate(history.filter(h => h.category === 'Music')).slice(0, 20);
    }
    if (activeTab === 'Liked') {
      const liked = JSON.parse(localStorage.getItem('macfeed_liked') || '[]');
      return deduplicate(liked.filter(l => l.category === 'Music'));
    }
    if (activeTab === 'My Uploads') return deduplicate(songs.filter(s => s.source === 'local' && s.user_id === user?.id));
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
          playVideo(existing[0], list);
          addToHistory(existing[0]);
          setIsExpanded(true);
        } else {
          // Prevent duplicates by checking again right before insert
          const { data: checkAgain } = await supabase.from('videos').select('id').eq('youtube_id', ytId).limit(1);
          if (checkAgain?.length) {
            playVideo(checkAgain[0], list);
            setIsExpanded(true);
          } else {
            const { data: inserted } = await supabase.from('videos').insert([{
              title: songToPlay?.title || 'Untitled Video',
              video_url: `https://www.youtube.com/embed/${ytId}`,
              youtube_id: ytId,
              thumbnail_url: songToPlay.thumbnail_url,
              source: 'youtube',
              category: 'Music',
              views: 0,
              user_id: user?.id
            }]).select('*').single();

            if (inserted) {
              playVideo(inserted, list);
              addToHistory(inserted);
              setIsExpanded(true);
            }
          }
        }
      } catch (e) {
        playVideo(songToPlay, list);
        setIsExpanded(true);
      } finally {
        setIsProcessing(false);
      }
    } else {
      playVideo(songToPlay, list);
      addToHistory(songToPlay);
      setIsExpanded(true);
    }
  };

  if (loading) return <Loader />;

  const displaySongs = getDisplaySongs();
  const heroSong = (displaySongs.length > 0 ? displaySongs[0] : songs[0]) || {
    id: 'dummy-hero',
    title: 'THE NEW CIRCUS',
    thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    source: 'dummy'
  };
  const sideSongs = displaySongs.slice(0, 5);
  const bottomSongs = displaySongs.slice(5, 16);
  const rawHistory = JSON.parse(localStorage.getItem('macfeed_history') || '[]').filter(h => h.category === 'Music');
  const recentlyPlayed = deduplicate(rawHistory.length > 0 ? rawHistory : songs).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0F1115] text-white overflow-hidden relative font-sans selection:bg-purple-500/30">
      <MusicBackground themeIdx={themeIdx} />

      <div className="relative z-10 w-full h-screen">
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

        <div className="absolute inset-0 bg-transparent flex flex-col overflow-hidden p-0 m-0">
          <div className="w-full h-full relative overflow-hidden bg-[#120a0e] flex flex-col">
            {/* Background Blur */}
            <div className="absolute inset-0 pointer-events-none">
              <img src={heroSong?.thumbnail_url?.replace('maxresdefault.jpg', 'maxresdefault.jpg')} className="w-full h-full object-cover blur-3xl opacity-50 scale-110" alt="" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#120a0e] via-[#120a0e]/80 to-[#120a0e]" />
            </div>

            {/* Top Left Curved Menu Tab (VC) */}
            <div className="absolute top-0 left-12 md:left-16 w-[170px] md:w-[280px] h-10 md:h-12 bg-white z-[50] rounded-br-[1.5rem] flex items-center px-3 md:px-6 gap-2 md:gap-6 justify-between">
              <span className="font-black italic text-black text-base md:text-xl tracking-tighter shrink-0">VC</span>
              <div className="flex gap-2.5 md:gap-3 text-black/80 shrink-0">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-purple-600 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="4" /><circle cx="12" cy="12" r="3" /></svg></a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg></a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-red-600 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" /></svg></a>
              </div>
              {/* Inverted curve logic */}
              <div className="absolute top-0 -right-5 w-5 h-5 bg-transparent pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, transparent 20px, white 20.5px)' }} />
            </div>

            {/* Integrated Header Elements inside Card Top-Right */}
            <div className="absolute top-10 md:top-0 left-12 md:left-auto right-0 h-10 md:h-12 flex items-center pr-2 md:pr-6 gap-2 md:gap-6 z-[60] bg-black/60 md:bg-black/20 backdrop-blur-md md:rounded-bl-[1.5rem] border-b border-l border-white/10">
              <div className="flex gap-4 md:gap-6 overflow-x-auto flex-1 md:w-auto no-scrollbar items-center px-4 flex-nowrap">
                {['New', 'My Uploads', 'Device', 'All Hits', 'Artists', 'Recent'].map((tab) => (
                  <button key={tab} onClick={() => { setActiveTab(tab); setSearchQuery(''); }} className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all relative py-3 shrink-0 ${activeTab === tab && !searchQuery ? 'text-white' : 'text-white/40 hover:text-white'}`}>
                    {tab}
                    {activeTab === tab && !searchQuery && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-500" />}
                  </button>
                ))}
              </div>

              <div ref={dropdownRef} className="relative w-32 md:w-48 xl:w-64 shrink-0">
                <form onSubmit={handleGlobalSearch} className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 transition-colors w-full group">
                  <button type="submit" className="outline-none">
                    <Search className="w-3.5 h-3.5 text-white/50 group-focus-within:text-white hover:text-red-400 transition-colors cursor-pointer" />
                  </button>
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setIsSearchFocused(true)} placeholder="Search..." className="bg-transparent border-none outline-none text-white text-[9px] font-black uppercase italic tracking-widest w-full placeholder:text-white/30" />
                </form>
              </div>

              <div className="relative shrink-0 flex items-center pr-2">
                <button onClick={() => setShowCapsule(!showCapsule)} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all">
                  <Settings className={`w-3 h-3 transition-transform duration-500 ${showCapsule ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {showCapsule && (
                    <motion.div initial={{ opacity: 0, scale: 0.9, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 10 }} className="absolute top-8 right-0 bg-[#0F1115] border border-white/10 shadow-2xl rounded-xl flex flex-col gap-1 p-2 z-[4001]">
                      <button onClick={() => navigate('/')} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"><ArrowLeft className="w-3.5 h-3.5 rotate-180" /></button>
                      <button onClick={() => { setActiveTab('Liked'); setSearchQuery(''); setShowCapsule(false); }} className={`p-2 rounded-full transition-all ${activeTab === 'Liked' && !searchQuery ? 'bg-red-500 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}><Heart className={`w-3.5 h-3.5 ${activeTab === 'Liked' && !searchQuery ? 'fill-white' : ''}`} /></button>
                      <button onClick={() => setThemeIdx(p => (p + 1) % themes.length)} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"><Palette className="w-3.5 h-3.5" /></button>
                      {user && (
                        <button onClick={() => { const fileInput = document.getElementById('music-upload-input'); if (fileInput) fileInput.click(); setShowCapsule(false); }} className="w-7 h-7 p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer flex items-center justify-center">
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Left Side Vertical Menu */}
            <div className="absolute left-0 top-0 bottom-0 w-12 md:w-16 border-r border-white/10 flex flex-col items-center py-20 z-20 gap-10">
              <button onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <Menu className="w-5 h-5 text-white/80 cursor-pointer hover:text-white" />
              </button>
              <div className="flex flex-col gap-2">
                <div className="w-1.5 h-1.5 rounded-full border border-white/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                <div className="w-1.5 h-1.5 rounded-full border border-white/50" />
                <div className="w-1.5 h-1.5 rounded-full border border-white/50" />
              </div>
              <span className="text-[9px] font-black tracking-[0.4em] uppercase text-white/40 -rotate-90 mt-auto mb-10 whitespace-nowrap">Music</span>
            </div>

            {/* Main Content Layout - Tightened */}
            <div className="relative z-10 w-full h-full flex flex-col lg:flex-row items-center justify-between pl-12 md:pl-24 pr-0 md:pr-10 py-6 md:py-12 gap-6 lg:gap-12 pt-28 lg:pt-20 overflow-y-auto custom-scrollbar pb-24 lg:pb-12">
              {activeTab === 'New' && !searchQuery ? (
                <>
                  {/* Left: Text Content */}
                  <div className="flex-1 flex flex-col items-start gap-3 max-w-lg lg:max-w-xl shrink-0 px-4 md:px-0">
                    <p className="text-white/80 font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px]">Now Trending Globally</p>
                    <h1 className="text-4xl md:text-7xl lg:text-[6.5rem] font-black uppercase leading-[0.85] tracking-tighter text-white drop-shadow-2xl break-words w-full" style={{ fontFamily: 'Oswald, system-ui, sans-serif', transform: 'scaleY(1.1)' }}>
                      {heroSong?.title?.split(/[|\-]/)[0]?.trim().slice(0, 30)}
                    </h1>
                    <div className="flex items-center gap-3 mt-6">
                      <button onClick={() => handleSongClick(heroSong)} className="bg-[#ff0f39] text-white px-7 md:px-9 py-2.5 md:py-3 rounded-full font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-[0_0_15px_rgba(255,15,57,0.5)] hover:bg-[#ff3355] transition-all hover:scale-105 active:scale-95">
                        Play
                      </button>
                      <button onClick={() => handleSongClick(heroSong)} className="border border-white/50 text-white px-7 md:px-9 py-2.5 md:py-3 rounded-full font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-white/10 hover:border-white transition-all active:scale-95">
                        Download
                      </button>
                    </div>
                  </div>

                  {/* Right: Glassmorphic Card Tightened */}
                  <div className="w-full lg:w-[480px] xl:w-[560px] relative group shrink-0 mt-4 md:mt-6 lg:mt-0">
                    <div className="absolute -inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-none md:rounded-[3rem] blur-md opacity-30" />
                    <div className="relative w-full aspect-[4/3] md:aspect-[4/3] aspect-auto min-h-[260px] rounded-none md:rounded-[3rem] overflow-hidden bg-white/10 backdrop-blur-3xl border-y md:border md:border-white/50 p-0 md:p-4 shadow-2xl">
                      <div className="relative w-full h-full rounded-none md:rounded-[2.2rem] overflow-hidden bg-black border-none md:border md:border-white/20">
                        <img src={heroSong?.thumbnail_url?.replace('maxresdefault.jpg', 'maxresdefault.jpg')} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-1000" alt="" />

                        <div className="absolute top-0 left-0 p-5 md:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent w-full pointer-events-none">
                          <div className="flex items-center justify-between w-full mb-1">
                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-white drop-shadow-lg line-clamp-1">{heroSong?.title}</h3>
                            <div className="flex gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                              <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                              <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] md:text-[10px] text-white/80 uppercase font-black tracking-widest drop-shadow-md">2026</span>
                            <span className="text-white/40">|</span>
                            <span className="text-[9px] md:text-[10px] bg-[#ff0f39] text-white px-1.5 py-0.5 rounded font-black tracking-widest drop-shadow-md">+21</span>
                            <span className="text-white/40">|</span>
                            <span className="text-[9px] md:text-[10px] text-white/80 uppercase font-black tracking-widest drop-shadow-md">2h 5min</span>
                            <span className="text-white/40">|</span>
                            <span className="text-[9px] md:text-[10px] text-white/80 uppercase font-black tracking-widest drop-shadow-md">Violence</span>
                          </div>
                          <p className="text-[8px] md:text-[9px] text-white/60 mt-3 font-medium max-w-[80%] line-clamp-2 md:line-clamp-3 leading-relaxed">
                            If you meet them in the middle of the countryside, you will become their entertainment.
                          </p>
                        </div>

                        <div className="absolute bottom-0 left-0 p-5 md:p-6 w-full flex items-center justify-between bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
                          <div className="flex gap-3 pointer-events-auto">
                            <button onClick={() => handleSongClick(heroSong)} className="bg-[#ff0f39] text-white px-5 md:px-6 py-2.5 rounded-full font-black uppercase tracking-widest text-[9px] flex items-center gap-2 hover:bg-[#ff3355] shadow-lg active:scale-95 transition-all">
                              <Play className="w-3 h-3 fill-white" /> Watch Trailer
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setActiveTab('Liked'); setSearchQuery(''); }} className="w-9 h-9 rounded-full bg-[#ff0f39] flex items-center justify-center text-white hover:bg-[#ff3355] shadow-lg active:scale-95 transition-all">
                              <Heart className="w-4 h-4" />
                            </button>
                          </div>
                          <button onClick={() => handleSongClick(heroSong)} className="w-9 h-9 rounded-full bg-[#ff0f39] flex items-center justify-center text-white hover:bg-[#ff3355] shadow-lg active:scale-95 transition-all pointer-events-auto">
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : activeTab === 'Device' && !searchQuery ? (
                <div className="flex-1 w-full h-full flex flex-col bg-black/40 backdrop-blur-3xl rounded-3xl border border-white/10 p-6 md:p-10 ml-0 lg:ml-10 shadow-2xl">
                  <div className="flex items-center justify-between mb-8 shrink-0 border-b border-white/10 pb-4">
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-[0.3em] text-white/90 italic">Device Music</h3>
                    {devicePermission && (
                      <button onClick={refreshDeviceMusic} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all group">
                        {isScanning ? <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /> : <Clock className="w-3 h-3 text-purple-400 group-hover:rotate-180 transition-transform duration-500" />}
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Refresh</span>
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 md:pr-4">
                    {(!devicePermission && deviceSongs.length === 0) ? (
                      <div className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed ${activeBorder} bg-white/5 flex flex-col items-center justify-center text-center gap-4 md:gap-6 group hover:bg-white/10 transition-all duration-500 max-w-xl mx-auto mt-4 md:mt-10 mr-4 md:mr-auto`}>
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500"><MusicIcon className="w-8 h-8 md:w-10 md:h-10 text-purple-400" /></div>
                        <div><h4 className="text-base md:text-lg font-black uppercase italic tracking-wider text-white mb-2">Access Device Music</h4><p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/40 max-w-xs px-2">Allow MacFeed to scan and play music files directly from your device storage.</p></div>
                        <button onClick={requestDevicePermission} className="px-6 md:px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] transition-all active:scale-95 shrink-0">Allow / Grant Permission</button>
                      </div>
                    ) : (
                      <>
                        {isScanning && deviceSongs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 md:py-20 gap-4"><div className="w-10 h-10 md:w-12 md:h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /><p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/40 animate-pulse">Scanning device for music...</p></div>
                        ) : deviceSongs.length === 0 ? (
                          <div className={`p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/10 bg-white/5 flex flex-col items-center justify-center text-center gap-4 md:gap-6 max-w-xl mx-auto mt-4 md:mt-10 mr-4 md:mr-auto`}><p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/30 italic">No device music found or added.</p><button onClick={() => document.getElementById('device-music-input').click()} className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all group shrink-0"><Plus className="w-4 h-4 text-purple-400 group-hover:scale-125 transition-transform" /><span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/70">Add More Music</span></button></div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-max">
                            {deviceSongs.map((song) => (
                              <div key={song.id} onClick={() => handleSongClick(song, deviceSongs)} className="w-full shrink-0 group cursor-pointer transition-transform active:scale-95">
                                <div className={`aspect-[4/3] rounded-2xl overflow-hidden mb-2 relative border ${activeBorder} transition-colors duration-500 shadow-2xl bg-white/5`}>
                                  <img src={song.thumbnail_url} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                  <button onClick={(e) => { e.stopPropagation(); removeDeviceSong(song.id); }} className="absolute right-2 top-2 z-20 rounded-full bg-red-500/20 p-1.5 text-red-300 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"><Trash className="w-3 h-3" /></button>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
                                    <h5 className="text-[9px] font-black uppercase italic line-clamp-2 leading-tight mb-0.5">{song.title}</h5>
                                    <p className="text-[7px] font-bold text-white/40 uppercase mb-2 truncate">{song.artist}</p>
                                    <div className="flex items-center justify-between">
                                      <div className={`w-6 h-6 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border ${activeBorder} transition-colors duration-500 group-hover:bg-purple-600`}><Play className="w-2.5 h-2.5 fill-white translate-x-px" /></div>
                                      <span className="text-[7px] font-bold text-white/30 uppercase">{Math.floor(song.duration / 60)}:{Math.floor(song.duration % 60).toString().padStart(2, '0')}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div onClick={() => document.getElementById('device-music-input').click()} className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all group">
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform"><Plus className="w-4 h-4 text-white/20 group-hover:text-purple-400 transition-colors" /></div>
                              <span className="text-[8px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/60">Add More</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 w-full h-full flex flex-col bg-black/40 backdrop-blur-3xl rounded-3xl border border-white/10 p-6 md:p-10 ml-0 lg:ml-10 shadow-2xl">
                  <div className="flex items-center justify-between mb-8 shrink-0 border-b border-white/10 pb-4">
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-[0.3em] text-white/90 italic">{searchQuery ? `Search Results for "${searchQuery}"` : activeTab} <span className="text-white/30 text-sm ml-2">({displaySongs.length})</span></h3>
                    {searchQuery ? <Search className="w-5 h-5 text-red-500" /> : <Sparkles className="w-5 h-5 text-purple-500" />}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 flex flex-col gap-3">
                    {displaySongs.length === 0 ? (
                      <div className="w-full text-center text-white/50 font-black uppercase tracking-widest text-xs py-20">Nothing found in the void.</div>
                    ) : displaySongs.map((song, i) => (
                      <div key={song.id} onClick={() => handleSongClick(song)} className={`relative flex items-center justify-between group cursor-pointer active:scale-95 bg-white/5 p-4 rounded-2xl border ${activeBorder} transition-colors duration-500 hover:border-purple-500/50`}>
                        {canDeleteSong(song) && (
                          <button onClick={(e) => handleDeleteLocalSong(song, e)} className="absolute right-2 top-2 z-20 rounded-full bg-red-500/15 p-2 text-red-400 transition-colors hover:bg-red-500 hover:text-white">
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="flex items-center gap-5 min-w-0">
                          <div className="text-[10px] font-black uppercase text-white/30 w-6">{(i + 1).toString().padStart(2, '0')}</div>
                          <div className={`w-14 h-14 rounded-xl overflow-hidden bg-white/10 shrink-0 border border-white/10 transition-colors duration-500`}>
                            <img src={song.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg')} loading="lazy" decoding="async" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" alt="" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-black uppercase tracking-tighter truncate text-white/80 group-hover:text-white max-w-[200px] md:max-w-md">{song.title}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">{song.source === 'local' ? 'Local Audio' : song.source === 'youtube' ? 'YouTube' : 'Unknown'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full border ${activeBorder} transition-colors duration-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white`}><Play className="w-4 h-4 fill-current translate-x-0.5" /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
