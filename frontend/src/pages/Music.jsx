import React, { useEffect, useState, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, ArrowLeft, Music as MusicIcon, Search, Flame, Clock, Sparkles,
  Download, Heart, ChevronLeft, ChevronRight, AlertTriangle, Folder, Upload, Settings
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
import 'swiper/css';
import 'swiper/css/free-mode';
import { fetchJson } from '../utils/request';

if (typeof window !== 'undefined') window.Buffer = window.Buffer || Buffer;

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Memoized Background to prevent flickering on every click
const MusicBackground = memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none">
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at center, #2B9EAD 0%, #0D6B7A 50%, #094F5C 100%)'
      }}
    >
      <div
        className="absolute inset-0 opacity-60 mix-blend-overlay"
        style={{
          background: 'linear-gradient(135deg, #0A5C6B 0%, #1A8A95 40%, #2BA8B5 70%, #0D6670 100%)'
        }}
      />
      <div className="absolute inset-0 bg-[#041D24]/30" />
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#4AACB8]/10 blur-[130px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#0A5C6B]/15 blur-[130px] rounded-full" />
    </div>
  </div>
));

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

  const { playVideo, setIsExpanded, playlist: contextPlaylist } = useMusicPlayer() || {};
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Upload States
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

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
      const { data } = await supabase
        .from('videos')
        .select('*')
        .eq('category', 'Music')
        .order('created_at', { ascending: false });
      const musicData = data || [];
      setSongs(musicData);
      setFilteredSongs(musicData);
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
          youtubeId: v.ytId || v.id,
          title: v?.title || 'Untitled Video',
          thumbnail_url: v.thumbnail || v.thumbnail_url,
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Supabase free tier typically has a 50MB limit. 
    if (file.size > 45 * 1024 * 1024) {
      setUploadStatus("Error: File exceeds 45MB limit.");
      setTimeout(() => setUploadStatus(""), 5000);
      return;
    }

    try {
      setUploadStatus("Reading file...");
      setUploadProgress(5);
      
      // Read file into memory first to prevent any stream locks in the browser
      const arrayBuffer = await file.arrayBuffer();

      setUploadStatus("Extracting metadata...");
      setUploadProgress(10);
      
      let title = file.name.replace(/\.[^/.]+$/, "");
      let artist = "Unknown Artist";
      let thumbnailPublicUrl = "/default_music_cover.jpg";

      try {
        const metadata = await musicMetadata.parseBlob(file);
        if (metadata.common.title) title = metadata.common.title;
        if (metadata.common.artist) artist = metadata.common.artist;

        if (metadata.common.picture && metadata.common.picture.length > 0) {
          setUploadStatus("Uploading cover...");
          setUploadProgress(40);
          const pic = metadata.common.picture[0];
          const picBlob = new Blob([pic.data], { type: pic.format });
          const ext = pic.format.split('/')[1] || 'jpg';
          const coverFileName = `music-thumbnails/${user?.id || 'anon'}/${Date.now()}.${ext}`;
          
          const { error: coverErr } = await supabase.storage.from('thumbnails').upload(coverFileName, picBlob, { upsert: true, contentType: pic.format });
          if (!coverErr) {
            const { data } = supabase.storage.from('thumbnails').getPublicUrl(coverFileName);
            if (data?.publicUrl) thumbnailPublicUrl = data.publicUrl;
          }
        }
      } catch (metaErr) {
        console.warn("Metadata extraction failed, proceeding with defaults:", metaErr);
      }

      setUploadStatus("Uploading audio...");
      setUploadProgress(70);
      
      const audioFileName = `music/${user?.id || 'anon'}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      
      const { error: audioErr } = await supabase.storage.from('thumbnails').upload(audioFileName, arrayBuffer, {
        contentType: file.type || 'audio/mpeg',
        upsert: true
      });
      
      if (audioErr) {
        throw new Error("Audio upload failed: " + audioErr.message);
      }

      const { data: audioData } = supabase.storage.from('thumbnails').getPublicUrl(audioFileName);
      
      setUploadStatus("Saving to database...");
      setUploadProgress(90);

      const newSong = {
        title: `${artist} - ${title}`,
        video_url: audioData.publicUrl,
        thumbnail_url: thumbnailPublicUrl,
        source: 'local',
        category: 'Music'
      };

      const { data: insertedData, error: dbErr } = await supabase.from('videos').insert([newSong]).select().single();
      
      if (dbErr) throw dbErr;

      setSongs(prev => [insertedData, ...prev]);
      setFilteredSongs(prev => [insertedData, ...prev]);
      
      setUploadStatus("Done!");
      setUploadProgress(100);
      setTimeout(() => {
        setUploadStatus("");
        setUploadProgress(0);
      }, 3000);
      
    } catch (err) {
      console.error(err);
      setUploadStatus("Error: " + err.message);
      setTimeout(() => setUploadStatus(""), 5000);
    }
    
    // Reset file input
    e.target.value = '';
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

  const handleSongClick = async (song) => {
    if (isProcessing) return;
      if (song?.id?.toString().startsWith('yt-')) {
      setIsProcessing(true);
      const ytId = song.youtubeId || song.id.replace('yt-', '');
      try {
        const { data: existing } = await supabase.from('videos').select('*').eq('youtube_id', ytId).limit(1);
        if (existing && existing.length > 0) {
          playVideo(existing[0]);
          addToHistory(existing[0]);
          setIsExpanded(true);
        } else {
          const { data: inserted } = await supabase.from('videos').insert([{
            title: song?.title || 'Untitled Video', video_url: song.video_url, youtube_id: ytId,
            thumbnail_url: song.thumbnail_url, source: 'youtube', category: 'Music', views: 0
          }]).select('*');
          if (inserted && inserted.length > 0) {
            playVideo(inserted[0]);
            addToHistory(inserted[0]);
            setIsExpanded(true);
          } else {
            playVideo(song);
            addToHistory(song);
            setIsExpanded(true);
          }
        }
      } catch (e) {
        playVideo(song);
        addToHistory(song);
        setIsExpanded(true);
      } finally {
        setIsProcessing(false);
      }
    } else {
      playVideo(song);
      addToHistory(song);
      setIsExpanded(true);
    }
  };

  if (loading) return <Loader />;

  const displaySongs = getDisplaySongs();
  const heroSong = displaySongs.length > 0 ? displaySongs[0] : songs[0];
  const sideSongs = displaySongs.slice(1, 4);
  const bottomSongs = displaySongs.slice(4, 16);
  const rawHistory = JSON.parse(localStorage.getItem('macfeed_history') || '[]').filter(h => h.category === 'Music');
  const recentlyPlayed = deduplicate(rawHistory.length > 0 ? rawHistory : songs).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#0F1115] text-white overflow-hidden relative font-sans selection:bg-purple-500/30">
      <MusicBackground />

      <div className="relative z-10 w-full h-full">
        {/* Floating Controls */}
        <motion.div
          drag dragMomentum={false}
          className="fixed right-6 md:right-10 top-[70%] flex flex-col gap-6 md:gap-8 items-center bg-white/10 backdrop-blur-3xl border border-white/20 py-5 md:py-6 px-3 rounded-full shadow-2xl z-[100] cursor-grab active:cursor-grabbing"
        >
          <button onClick={() => navigate('/')} className="p-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"><ArrowLeft className="w-5 h-5 rotate-180" /></button>
          <button onClick={() => { setActiveTab('Liked'); setSearchQuery(''); }} className={`p-2.5 rounded-full transition-all ${activeTab === 'Liked' && !searchQuery ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}><Heart className={`w-5 h-5 ${activeTab === 'Liked' && !searchQuery ? 'fill-white' : ''}`} /></button>
          <button className="p-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"><Download className="w-5 h-5" /></button>
          
          {user && (
            <div className="relative group">
              <label className="p-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer flex">
                <Upload className="w-5 h-5" />
                <input type="file" accept="audio/*" className="hidden" onChange={handleFileUpload} />
              </label>
              {uploadStatus && (
                <div className="absolute top-1/2 -translate-y-1/2 right-14 w-48 bg-[#0F1115] border border-white/10 rounded-xl p-3 shadow-2xl pointer-events-none">
                  <div className="text-[9px] text-white/70 font-black uppercase tracking-widest mb-2">{uploadStatus}</div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        <div className="w-full h-full bg-transparent flex flex-col overflow-hidden pt-8 md:pt-12">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between px-6 md:px-12 py-4 gap-4">
            <div ref={dropdownRef} className="relative w-full max-w-md z-[5000]">
              <form onSubmit={handleGlobalSearch} className="flex items-center gap-4 bg-transparent backdrop-blur-md px-6 py-2.5 rounded-full border-2 border-red-500 w-full group transition-all">
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
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 5 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 bg-[#0F1115]/95 backdrop-blur-3xl border border-red-500/30 rounded-2xl shadow-2xl mt-2 overflow-hidden z-[5000]">
                    <div className="max-h-[60vh] overflow-y-auto pb-4 custom-scrollbar">
                      <div className="px-6 py-3 text-[10px] font-black text-white/50 uppercase tracking-[0.3em] border-b border-white/5">Results for "{searchQuery}"</div>
                      
                      {filteredSongs.slice(0, 3).map((r) => (
                        <div key={'loc-'+r.id} onClick={() => { handleSongClick(r); setIsSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-4 px-6 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 group transition-all">
                          <div className="relative w-16 h-10 rounded overflow-hidden shrink-0">
                            <img src={r.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-black truncate group-hover:text-red-400 transition-colors uppercase italic">{r.title}</p>
                            <span className="text-[8px] text-purple-400 font-black uppercase mt-0.5 inline-block bg-purple-500/10 px-1 rounded">MacFeed</span>
                          </div>
                        </div>
                      ))}
                      
                      {ytResults.map((r, idx) => (
                        <div key={'yt-'+r.id+idx} onClick={() => { handleSongClick(r); setIsSearchFocused(false); setSearchQuery(''); }} className="flex items-center gap-4 px-6 py-3 hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 group transition-all">
                          <div className="relative w-16 h-10 rounded overflow-hidden shrink-0">
                            <img src={r.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-black truncate group-hover:text-red-400 transition-colors uppercase italic">{r.title}</p>
                            <span className="text-[8px] text-red-500 font-black uppercase mt-0.5 inline-block bg-red-500/10 px-1 rounded">YouTube</span>
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
            <div className="flex gap-4 md:gap-8 overflow-x-auto w-full md:w-auto no-scrollbar">
              {['New', 'All Hits', 'Artists', 'History'].map((tab) => (
                <button key={tab} onClick={() => { setActiveTab(tab); setSearchQuery(''); }} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all relative py-2 shrink-0 ${activeTab === tab && !searchQuery ? 'text-white' : 'text-white/30 hover:text-white'}`}>
                  {tab}
                  {activeTab === tab && !searchQuery && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />}
                </button>
              ))}
            </div>
          </div>

          <main className="flex-1 overflow-y-auto px-6 md:px-12 pb-12 no-scrollbar">
            <div className="grid grid-cols-12 gap-6 lg:gap-10">
              {/* Left Side */}
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-12 pt-4">
                <div className="space-y-8">
                  <div className="flex items-center justify-between"><h3 className="text-base font-black uppercase tracking-[0.3em] text-white/80 italic">{searchQuery ? 'Results' : activeTab}</h3><Sparkles className="w-5 h-5 text-yellow-500" /></div>
                  <div className="space-y-6">
                    {displaySongs.slice(0, 5).map(song => (
                      <div key={song.id} onClick={() => handleSongClick(song)} className="flex items-center gap-6 group cursor-pointer transition-transform active:scale-95">
                        <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden shrink-0 border border-white/10 shadow-xl bg-black">
                          <img src={song.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Play className="w-8 h-8 text-white fill-white" /></div>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black uppercase tracking-tight truncate group-hover:text-purple-400 transition-colors mb-2">{song.title}</h4>
                          <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">{song.source === 'youtube' ? 'YouTube' : 'MacFeed'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between"><h3 className="text-base font-black uppercase tracking-[0.3em] text-white/80 italic">Recent</h3></div>
                  <div className="space-y-5 bg-white/5 p-6 md:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                    {recentlyPlayed.map(song => (
                      <div key={song.id} onClick={() => handleSongClick(song)} className="flex items-center justify-between group cursor-pointer transition-transform active:scale-95">
                        <div className="flex items-center gap-5 min-w-0">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 shrink-0 border border-white/5"><img src={song.thumbnail_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all" alt="" /></div>
                          <span className="text-[11px] font-black uppercase tracking-tighter truncate text-white/60 group-hover:text-white">{song.title}</span>
                        </div>
                        <div className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all"><Play className="w-3.5 h-3.5 fill-current" /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="col-span-12 lg:col-span-7 space-y-12">
                {heroSong && (
                  <div onClick={() => handleSongClick(heroSong)} className="relative w-full h-[220px] md:h-[280px] rounded-[3.5rem] overflow-hidden cursor-pointer group border border-white/10 shadow-2xl transition-transform active:scale-[0.98]">
                    <img src={heroSong.thumbnail_url} className="w-full h-full object-cover object-center transition-transform duration-[3s] group-hover:scale-105" alt="" />
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
                                <div className="absolute inset-0 bg-white/10 group-hover:bg-purple-500 p-[2px]" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                  <div className="w-full h-full bg-[#0F1115] overflow-hidden relative" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                                    <img src={song.thumbnail_url} className="absolute inset-0 w-full h-full object-cover brightness-[0.4] group-hover:brightness-110 transition-all duration-1000" alt="" />
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
                        <div className="aspect-[2/3] rounded-[2.5rem] overflow-hidden mb-4 relative border border-white/5 shadow-2xl">
                          <img src={song.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent flex flex-col justify-end p-6">
                            <h5 className="text-[10px] font-black uppercase italic line-clamp-2 leading-tight mb-2">{song.title}</h5>
                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-purple-600 transition-all"><Play className="w-3.5 h-3.5 fill-white" /></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
