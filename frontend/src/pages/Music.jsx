import React, { useEffect, useState, useRef, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, ArrowLeft, Music as MusicIcon, Search, Flame, Clock, Sparkles,
  Download, Heart, ChevronLeft, ChevronRight, AlertTriangle, Folder, Upload, Settings, Trash, Maximize2, X, Palette, Plus, Menu, Home
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
    <div className="min-h-screen bg-black text-white overflow-hidden relative font-sans flex h-screen">
      {/* Hidden Upload Input */}
      {user && (
        <input
          id="music-upload-input"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e)}
        />
      )}
      
      {/* Hidden Device Input */}
      <input
        id="device-music-input"
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => handleDeviceFiles(e.target.files)}
      />

      {/* Upload Toast */}
      {(uploadStatus || uploadError) && (
        <div className="fixed bottom-24 left-1/2 z-[9999] w-[90vw] max-w-sm -translate-x-1/2 rounded-md bg-[#282828] p-4 shadow-2xl border border-[#333]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="text-xs font-bold text-white">{uploadError ? 'Upload error' : uploadStatus}</div>
            <div className="text-xs font-bold text-[#1DB954]">{Math.round(uploadProgress)}%</div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#121212]">
            <div className="h-full rounded-full bg-[#1DB954] transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
          {uploadError && (
            <button
              onClick={() => pendingUploadFile && runUploadWithRetry(pendingUploadFile)}
              className="mt-3 text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {toast.show && (
        <div className="fixed top-6 left-1/2 z-[9999] -translate-x-1/2 rounded-md bg-[#282828] px-4 py-3 text-sm font-bold text-white shadow-xl">
          {toast.message}
        </div>
      )}

      {/* Left Sidebar */}
      <div className="w-64 bg-black flex-shrink-0 flex flex-col p-2 gap-2 hidden md:flex">
        {/* Navigation */}
        <div className="bg-[#121212] rounded-lg p-5 flex flex-col gap-5">
          <button onClick={() => { setActiveTab('New'); setSearchQuery(''); }} className={`flex items-center gap-4 text-sm font-bold transition-colors ${activeTab === 'New' && !searchQuery ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}>
            <Home className="w-6 h-6" /> Home
          </button>
          <button onClick={() => { setActiveTab('Search'); setIsSearchFocused(true); }} className={`flex items-center gap-4 text-sm font-bold transition-colors ${activeTab === 'Search' || searchQuery ? 'text-white' : 'text-[#b3b3b3] hover:text-white'}`}>
            <Search className="w-6 h-6" /> Search
          </button>
        </div>

        {/* Library */}
        <div className="bg-[#121212] rounded-lg flex-1 overflow-y-auto flex flex-col py-3">
          <div className="px-5 py-2 flex items-center gap-2 text-[#b3b3b3] font-bold hover:text-white transition-colors cursor-pointer" onClick={() => { setActiveTab('Liked'); setSearchQuery(''); }}>
            <Folder className="w-6 h-6" /> Your Library
          </div>
          
          <div className="mt-4 flex flex-col px-2 gap-2 overflow-y-auto custom-scrollbar-spotify">
            {/* Liked Songs */}
            <button onClick={() => { setActiveTab('Liked'); setSearchQuery(''); }} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${activeTab === 'Liked' && !searchQuery ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]'}`}>
              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-indigo-500 to-blue-300 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col items-start truncate">
                <span className={`text-sm font-bold truncate ${activeTab === 'Liked' && !searchQuery ? 'text-white' : 'text-white/90'}`}>Liked Songs</span>
                <span className="text-xs text-[#b3b3b3]">Playlist</span>
              </div>
            </button>

            {/* Other Library Tabs */}
            {[
              { id: 'Device', icon: <MusicIcon className="w-6 h-6 text-[#b3b3b3]" />, label: 'Device Music', desc: 'Local Storage' },
              { id: 'My Uploads', icon: <Upload className="w-6 h-6 text-[#b3b3b3]" />, label: 'My Uploads', desc: 'Playlist' },
              { id: 'Recent', icon: <Clock className="w-6 h-6 text-[#b3b3b3]" />, label: 'Recently Played', desc: 'History' },
              { id: 'Artists', icon: <Sparkles className="w-6 h-6 text-[#b3b3b3]" />, label: 'Artists', desc: 'Profile' }
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }} className={`flex items-center gap-3 p-2 rounded-md transition-colors ${activeTab === tab.id && !searchQuery ? 'bg-[#2a2a2a]' : 'hover:bg-[#1a1a1a]'}`}>
                <div className="w-12 h-12 rounded-md bg-[#282828] flex items-center justify-center shrink-0">
                  {tab.icon}
                </div>
                <div className="flex flex-col items-start truncate">
                  <span className={`text-sm font-bold truncate ${activeTab === tab.id && !searchQuery ? 'text-white' : 'text-white/90'}`}>{tab.label}</span>
                  <span className="text-xs text-[#b3b3b3]">{tab.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#121212] md:rounded-lg md:my-2 md:mr-2 flex flex-col overflow-hidden relative">
        
        {/* Top Nav */}
        <div className="h-16 sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 bg-[#121212]/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-[#b3b3b3] hover:text-white cursor-pointer hidden md:flex"><ChevronLeft className="w-5 h-5" /></button>
            <button className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-[#b3b3b3] hover:text-white cursor-pointer hidden md:flex"><ChevronRight className="w-5 h-5" /></button>
            
            <button className="md:hidden p-2 text-[#b3b3b3]" onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}><Menu className="w-6 h-6" /></button>

            {(activeTab === 'Search' || searchQuery || isSearchFocused) && (
              <form onSubmit={handleGlobalSearch} className="ml-2 md:ml-4 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3]" />
                <input 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="What do you want to play?" 
                  className="bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white text-sm rounded-full pl-10 pr-4 py-2.5 w-[220px] md:w-[350px] outline-none border-2 border-transparent focus:border-white transition-colors placeholder-[#b3b3b3]" 
                />
              </form>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <button onClick={() => { const fileInput = document.getElementById('music-upload-input'); if (fileInput) fileInput.click(); }} className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-sm hover:scale-105 transition-transform flex items-center gap-1.5 hidden md:flex">
                <Upload className="w-4 h-4" /> Upload
              </button>
            )}
            <button onClick={() => navigate('/')} className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:scale-105 transition-transform"><X className="w-5 h-5 text-[#b3b3b3] hover:text-white" /></button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-spotify pb-28">
          
          {/* Header Area (Gradient background) */}
          <div className="pt-8 pb-6 px-6 flex flex-col md:flex-row items-start md:items-end gap-6 bg-gradient-to-b from-[#4C1D95] to-[#121212] min-h-[250px] md:min-h-[300px]">
            <div className="w-40 h-40 md:w-56 md:h-56 shadow-[0_8px_24px_rgba(0,0,0,0.5)] shrink-0 bg-[#282828] relative group flex items-center justify-center overflow-hidden">
              {heroSong?.thumbnail_url ? (
                <img src={heroSong.thumbnail_url.replace('maxresdefault.jpg', 'mqdefault.jpg')} className="w-full h-full object-cover" alt="" />
              ) : (
                <MusicIcon className="w-16 h-16 text-[#b3b3b3]" />
              )}
            </div>
            <div className="flex flex-col gap-1 md:gap-2">
              <span className="text-xs md:text-sm font-bold text-white/90 uppercase tracking-wider">{searchQuery ? 'Search Results' : 'Playlist'}</span>
              <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter pb-1 md:pb-2 line-clamp-2 md:line-clamp-3">
                {searchQuery ? `"${searchQuery}"` : activeTab === 'New' ? 'MacFeed Hits' : activeTab === 'My Uploads' ? 'Your Uploads' : activeTab}
              </h1>
              <p className="text-sm text-white/70 font-medium flex items-center gap-1.5">
                <span className="font-bold text-white">MacFeed</span> • {displaySongs.length} songs
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="px-6 py-4 flex items-center gap-6 bg-black/20">
            <button onClick={() => displaySongs.length > 0 && handleSongClick(displaySongs[0])} className="w-14 h-14 rounded-full bg-[#1DB954] hover:bg-[#1fdf64] hover:scale-105 flex items-center justify-center transition-all shadow-[0_8px_8px_rgba(0,0,0,0.3)]">
              <Play className="w-6 h-6 fill-black text-black ml-1" />
            </button>
            {activeTab !== 'Liked' && !searchQuery && (
              <button onClick={() => setActiveTab('Liked')} className="text-[#b3b3b3] hover:text-white transition-colors">
                <Heart className="w-8 h-8" />
              </button>
            )}
            {(activeTab === 'Device') && (
              <button onClick={refreshDeviceMusic} className="text-[#b3b3b3] hover:text-white transition-colors" title="Refresh Device Music">
                <Clock className={`w-8 h-8 ${isScanning ? 'animate-spin text-[#1DB954]' : ''}`} />
              </button>
            )}
          </div>

          {/* Device Request View */}
          {activeTab === 'Device' && !devicePermission && deviceSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center mt-12 gap-6 px-6">
              <MusicIcon className="w-16 h-16 text-[#b3b3b3]" />
              <h3 className="text-2xl font-bold text-white">Access Device Music</h3>
              <p className="text-[#b3b3b3] max-w-sm">Allow MacFeed to scan and play audio files from your local storage directly in the app.</p>
              <button onClick={requestDevicePermission} className="px-8 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform">
                Grant Permission
              </button>
            </div>
          ) : (
            /* Tracklist Container */
            <div className="px-6 pb-12 mt-2">
              {/* Header Row */}
              <div className="grid grid-cols-[32px_minmax(150px,_4fr)_2fr_minmax(100px,_1fr)_48px] gap-4 px-4 py-2 border-b border-[#2a2a2a] text-[#b3b3b3] text-sm font-medium mb-4 sticky top-16 bg-[#121212]/95 backdrop-blur z-40">
                <div className="text-right flex items-center justify-end">#</div>
                <div className="flex items-center">Title</div>
                <div className="hidden md:flex items-center">Source</div>
                <div className="hidden md:flex items-center justify-end pr-8">Actions</div>
                <div className="flex items-center justify-end"><Clock className="w-4 h-4" /></div>
              </div>

              {/* Songs List */}
              {displaySongs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#b3b3b3]">
                  <span className="text-lg font-bold text-white mb-2">No tracks found</span>
                  <span>Try searching for something else or adding music.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {displaySongs.map((song, i) => (
                    <div key={song.id} onClick={() => handleSongClick(song)} className="grid grid-cols-[32px_minmax(150px,_4fr)_2fr_minmax(100px,_1fr)_48px] gap-4 px-4 py-2 rounded-md group items-center cursor-pointer hover:bg-white/10 transition-colors">
                      {/* Number / Play Button */}
                      <div className="text-[#b3b3b3] text-sm text-right flex items-center justify-end">
                        <span className="group-hover:hidden">{i + 1}</span>
                        <Play className="w-4 h-4 fill-white text-white hidden group-hover:block" />
                      </div>

                      {/* Title & Thumbnail */}
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img src={song.thumbnail_url?.replace('maxresdefault.jpg', 'mqdefault.jpg') || '/default_music_cover.jpg'} className="w-10 h-10 rounded-sm bg-[#282828] object-cover shrink-0" alt="" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-white text-base truncate font-normal group-hover:underline">{song.title}</span>
                          <span className="text-[#b3b3b3] text-sm truncate">{song.artist || (song.source === 'youtube' ? 'YouTube' : song.source === 'device' ? 'Device' : 'Local')}</span>
                        </div>
                      </div>

                      {/* Source */}
                      <div className="hidden md:flex text-[#b3b3b3] text-sm truncate items-center">
                        {song.source === 'local' ? 'Uploaded' : song.source === 'device' ? 'Local Storage' : 'Web Stream'}
                      </div>

                      {/* Actions */}
                      <div className="hidden md:flex items-center justify-end gap-3 pr-4">
                        {canDeleteSong(song) && (
                          <button onClick={(e) => handleDeleteLocalSong(song, e)} className="opacity-0 group-hover:opacity-100 text-[#b3b3b3] hover:text-white p-2">
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="text-[#b3b3b3] text-sm flex items-center justify-end">
                        {song.duration ? `${Math.floor(song.duration/60)}:${Math.floor(song.duration%60).toString().padStart(2,'0')}` : '3:45'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar-spotify::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar-spotify::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-spotify::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.3);
          border: 3px solid #121212;
          border-radius: 8px;
        }
        .custom-scrollbar-spotify:hover::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
