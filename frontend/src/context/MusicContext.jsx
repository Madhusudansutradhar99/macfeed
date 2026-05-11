import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import * as musicMetadata from 'music-metadata-browser';
import { getHandle, setHandle, saveTrack, getAllTracks, deleteTrack } from '../utils/db';
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') window.Buffer = window.Buffer || Buffer;

const MusicContext = createContext(null);

export function useMusicPlayer() {
  return useContext(MusicContext);
}

const deduplicate = (arr) => {
  if (!arr) return [];
  const seen = new Set();
  return arr.filter(item => {
    const cleanUrl = item.video_url?.split('?')[0];
    // Check for ID, then Youtube ID, then Title+Artist for device songs
    const key = item.id || item.youtube_id || (item.source === 'device' ? `${item.title}-${item.duration}` : cleanUrl);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const parseDuration = (duration) => {
  if (!duration) return 300; 
  if (typeof duration === 'number') return duration;
  if (typeof duration !== 'string') return 300;
  
  const parts = duration.split(':').map(p => parseInt(p, 10));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parseInt(duration, 10) || 300;
};

export function MusicProvider({ children }) {
  const [playlist, setPlaylist] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [playing, setPlaying] = useState(false); 
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300);
  
  const [activeLocalSong, setActiveLocalSong] = useState(null);
  const [isLocalPlayerOpen, setIsLocalPlayerOpen] = useState(false);
  const [playingLocal, setPlayingLocal] = useState(false);
  const [volumeLocal, setVolumeLocal] = useState(1);
  const [mutedLocal, setMutedLocal] = useState(false);

  // ── DEVICE MUSIC STATE ──────────────────────────────────────────────────
  const [deviceSongs, setDeviceSongs] = useState([]);
  const [devicePermission, setDevicePermission] = useState(localStorage.getItem('macfeed_device_permission') === 'granted');
  const [isScanning, setIsScanning] = useState(false);
  
  const audioRef = useRef();
  const currentSong = React.useMemo(() => {
    const raw = (playlist && playlist[currentIdx]) || null;
    if (raw?.source === 'device') {
      const fresh = deviceSongs.find(s => s.id === raw.id);
      if (fresh) return fresh;
    }
    return raw;
  }, [playlist, currentIdx, deviceSongs]);



  const loadStoredDeviceMusic = async () => {
    try {
      const storedTracks = await getAllTracks();
      if (storedTracks && storedTracks.length > 0) {
        const reconstructedSongs = storedTracks.map(track => {
          const blob = new Blob([track.audioData], { type: track.type || 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          
          let thumbnail_url = track.thumbnail_url;
          
          // Reconstruct thumbnail from stored binary data if it exists
          if (track.thumbnailData) {
            const thumbBlob = new Blob([track.thumbnailData], { type: 'image/jpeg' });
            thumbnail_url = URL.createObjectURL(thumbBlob);
          } else if (thumbnail_url?.startsWith('blob:')) {
            // Fallback for old records without binary thumb data
            thumbnail_url = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800';
          }

          return {
            ...track,
            video_url: url,
            thumbnail_url: thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800'
          };
        });
        setDeviceSongs(reconstructedSongs);
        if (reconstructedSongs.length > 0) setDevicePermission(true);
        
        // Repair current playlist with fresh URLs
        setPlaylist(prev => prev.map(item => {
          if (item.source === 'device') {
            const fresh = reconstructedSongs.find(s => s.id === item.id);
            return fresh || item;
          }
          return item;
        }));

        // Repair active local song if it's from device
        setActiveLocalSong(prev => {
          if (prev?.source === 'device') {
            const fresh = reconstructedSongs.find(s => s.id === prev.id);
            return fresh || prev;
          }
          return prev;
        });
      }

      const handle = await getHandle('musicFolder');
      if (handle) {
        try {
          const status = await handle.queryPermission({ mode: 'read' });
          if (status === 'granted') {
            await scanDirectory(handle);
            setDevicePermission(true);
          } else {
            // Don't set false if we already have songs from IDB
            if (reconstructedSongs.length === 0) setDevicePermission(false);
          }
        } catch(e) {
          if (reconstructedSongs.length === 0) setDevicePermission(false);
        }
      }
    } catch (e) {
      console.error('Failed to load stored device music:', e);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('macfeed_music_state');
    if (saved) {
      try {
        const { idx, list, song } = JSON.parse(saved);
        // Repair/Filter dead device links in hydrated list
        const repairedList = (list || []).map(item => {
          if (item.source === 'device') {
            // Keep the metadata but clear the dead blob URL
            // We'll rely on loadStoredDeviceMusic to provide fresh ones
            return { ...item, video_url: null };
          }
          return item;
        });
        
        if (repairedList.length) setPlaylist(repairedList);
        if (idx !== undefined) setCurrentIdx(idx);
        if (song) setActiveLocalSong(song.source === 'local' ? song : null);
      } catch (e) {}
    }

    supabase.from('videos').select('*').eq('category', 'Music').order('created_at', { ascending: false }).then(({ data }) => {
      if (data?.length) setPlaylist(prev => deduplicate([...prev, ...data]));
    });

    // Always attempt to load stored device music/files on mount
    loadStoredDeviceMusic();
  }, []);

  const scanDirectory = async (directoryHandle) => {
    setIsScanning(true);
    const songs = [];
    const supportedFormats = ['.mp3', '.m4a', '.aac', '.wav', '.flac', '.ogg', '.opus', '.wma', '.aiff'];

    try {
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === 'file') {
          const isSupported = supportedFormats.some(ext => entry.name.toLowerCase().endsWith(ext));
          if (isSupported) {
            const file = await entry.getFile();
            try {
              const metadata = await musicMetadata.parseBlob(file);
              let artworkUrl = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800';
              let thumbnailData = null;
              if (metadata.common.picture && metadata.common.picture[0]) {
                const pic = metadata.common.picture[0];
                thumbnailData = pic.data; // Uint8Array
                const blob = new Blob([pic.data], { type: pic.format });
                artworkUrl = URL.createObjectURL(blob);
              }

              songs.push({
                id: `device-${entry.name}-${file.lastModified}`,
                title: metadata.common.title || entry.name.replace(/\.[^/.]+$/, ''),
                artist: metadata.common.artist || 'Unknown Artist',
                album: metadata.common.album || 'Unknown Album',
                duration: metadata.common.duration || 0,
                thumbnail_url: artworkUrl,
                video_url: URL.createObjectURL(file),
                source: 'device',
                category: 'Device Music',
                file: file
              });
            } catch (err) {
              // Fallback for files with no metadata
              songs.push({
                id: `device-${entry.name}-${file.lastModified}`,
                title: entry.name.replace(/\.[^/.]+$/, ''),
                artist: 'Unknown Artist',
                duration: 0,
                thumbnail_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800',
                video_url: URL.createObjectURL(file),
                source: 'device',
                category: 'Device Music',
                file: file
              });
            }
          }
        }
      }
      setDeviceSongs(songs);
    } catch (e) {
      console.error('Directory scan failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeviceFiles = async (files, isRestore = false) => {
    setIsScanning(true);
    const songsToAdd = [];
    const fileList = Array.from(files);
    
    try {
      // Get all existing tracks once to avoid loop overhead
      const existingTracks = await getAllTracks();
      const existingIds = new Set(existingTracks.map(t => t.id));

      for (const file of fileList) {
        try {
          const trackId = `device-${file.name}-${file.size}-${file.lastModified}`;
          if (existingIds.has(trackId)) continue; // Skip if already in DB

          const arrayBuffer = await file.arrayBuffer();
          const metadata = await musicMetadata.parseBlob(file);
          let artworkUrl = 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800';
          let thumbnailData = null;
          
          if (metadata.common.picture && metadata.common.picture[0]) {
            const pic = metadata.common.picture[0];
            thumbnailData = pic.data;
            const blob = new Blob([pic.data], { type: pic.format });
            artworkUrl = URL.createObjectURL(blob);
          }

          // Optional: Upload to Supabase if logged in
          const user = (await supabase.auth.getUser())?.data?.user;
          if (user && thumbnailData) {
            try {
              const fileName = `${user.id}/${trackId}.jpg`;
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('music_thumbnails')
                .upload(fileName, thumbnailData, { upsert: true, contentType: 'image/jpeg' });
              
              if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                  .from('music_thumbnails')
                  .getPublicUrl(fileName);
                artworkUrl = publicUrl;
              }
            } catch (err) {
              console.warn('Supabase thumbnail upload failed:', err);
            }
          }

          const trackData = {
            id: trackId,
            title: metadata.common.title || file.name.replace(/\.[^/.]+$/, ''),
            artist: metadata.common.artist || 'Unknown Artist',
            album: metadata.common.album || 'Unknown Album',
            duration: metadata.common.duration || 0,
            thumbnail_url: artworkUrl,
            thumbnailData: thumbnailData, // Save binary data for offline persistence
            type: file.type,
            size: file.size,
            dateAdded: Date.now(),
            audioData: arrayBuffer,
            source: 'device',
            category: 'Device Music'
          };

          await saveTrack(trackData);

          const blob = new Blob([arrayBuffer], { type: file.type });
          const url = URL.createObjectURL(blob);

          songsToAdd.push({
            ...trackData,
            video_url: url
          });
        } catch (err) {
          console.error('Error processing file:', file.name, err);
        }
      }
      if (songsToAdd.length > 0) {
        setDeviceSongs(prev => deduplicate([...prev, ...songsToAdd]));
      }
    } catch (e) {
      console.error('File processing failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadStoredDeviceMusic();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (playlist.length > 0) {
      localStorage.setItem('macfeed_music_state', JSON.stringify({
        idx: currentIdx,
        list: playlist.slice(0, 50),
        song: activeLocalSong
      }));
    }
  }, [currentIdx, playlist, activeLocalSong]);

  useEffect(() => {
    // Reset progress display when song changes, but don't reset actual iframe
    setProgress(0);
    if (currentSong) {
      setDuration(parseDuration(currentSong.duration));
    }
    window._lastMusicTime = Date.now();
  }, [currentSong?.id]);

  const playVideo = (video) => {
    if (!video) return;
    const idx = playlist.findIndex((v) => v.id === video.id);
    if (idx >= 0) setCurrentIdx(idx);
    else {
      setPlaylist((prev) => deduplicate([video, ...prev]));
      setCurrentIdx(0);
    }
    setIsOpen(true);
    setPlaying(true);
    setPlayingLocal(false);
    window._lastMusicTime = Date.now();
  };

  // ── YouTube time sync ────────────────────────────────────────────────────
  // Send 'listening' to the iframe so YouTube pushes infoDelivery events.
  // YouTube automatically sends currentTime + duration in these events.
  useEffect(() => {
    if (currentSong?.source !== 'youtube') return;
    // Poll every 800ms — YouTube replies with infoDelivery containing real currentTime
    const interval = setInterval(() => {
      const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
      iframe?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 1 }), '*');
    }, 800);
    return () => clearInterval(interval);
  }, [currentSong?.id]);

  // Receive YouTube's infoDelivery events with real currentTime
  useEffect(() => {
    const onMsg = (e) => {
      if (!e.data) return;
      try {
        const d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (d.event === 'infoDelivery' && d.info) {
          if (typeof d.info.currentTime === 'number' && d.info.currentTime >= 0)
            setCurrentTime(d.info.currentTime);
          if (typeof d.info.duration === 'number' && d.info.duration > 0)
            setDuration(d.info.duration);
        }
        if (d.event === 'onStateChange') {
          if (d.info === 1) setPlaying(true);
          if (d.info === 2) setPlaying(false);
          if (d.info === 0) next();
        }
      } catch (_) {}
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  // ── MEDIA SESSION API (Background Notification Controls) ──────────────────
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    const updateMetadata = () => {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title,
        artist: currentSong.category || 'MacFeed',
        album: 'MacFeed Music',
        artwork: [
          { src: currentSong.thumbnail_url, sizes: '96x96', type: 'image/jpeg' },
          { src: currentSong.thumbnail_url, sizes: '128x128', type: 'image/jpeg' },
          { src: currentSong.thumbnail_url, sizes: '192x192', type: 'image/jpeg' },
          { src: currentSong.thumbnail_url, sizes: '256x256', type: 'image/jpeg' },
          { src: currentSong.thumbnail_url, sizes: '384x384', type: 'image/jpeg' },
          { src: currentSong.thumbnail_url, sizes: '512x512', type: 'image/jpeg' },
        ]
      });
    };

    updateMetadata();

    const actionHandlers = [
      ['play', () => { setPlaying(true); }],
      ['pause', () => { setPlaying(false); }],
      ['previoustrack', () => prev()],
      ['nexttrack', () => next()],
      ['seekto', (details) => {
        if (details.seekTime !== undefined) {
           const targetTime = details.seekTime;
           if (currentSong?.source === 'youtube') {
             document.querySelectorAll('iframe').forEach(f => {
               f.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [targetTime, true] }), '*');
             });
             setCurrentTime(targetTime);
           } else if (audioRef.current) {
             audioRef.current.currentTime = targetTime;
             setCurrentTime(targetTime);
           }
        }
      }]
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        // Fallback for older browsers
      }
    }

    // Force playback state sync
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';

    return () => {
      ['play', 'pause', 'previoustrack', 'nexttrack', 'seekto'].forEach(action => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch(e) {}
      });
    };
  }, [currentSong?.id, currentSong?.title, currentSong?.thumbnail_url, playing]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !duration) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(1, duration),
        playbackRate: 1,
        position: Math.min(duration, currentTime)
      });
    } catch (e) {}
  }, [currentTime, duration]);

  // Fallback for local (non-YouTube) audio
  const handleTimeUpdate = () => {
    if (currentSong?.source === 'youtube') return;
    const audio = audioRef.current;
    if (audio?.duration) {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
      if (audio.ended) next();
    }
  };

  useEffect(() => {
    if (duration > 0) {
      const p = (currentTime / duration) * 100;
      setProgress(Math.min(100, Math.max(0, p)));
    }
  }, [currentTime, duration]);

  const seek = (e) => {
    if (!e) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (!clientX) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    const targetTime = Math.max(0, Math.min(duration, pos * duration));

    if (currentSong?.source === 'youtube') {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(f => {
        f.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [targetTime, true] }), '*');
      });
      window._lastMusicTime = Date.now();
      setCurrentTime(targetTime);
    } else if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  const next = () => {
    if (playlist?.length) {
      setCurrentIdx((prevIdx) => (prevIdx + 1) % playlist.length);
    }
  };

  const prev = () => {
    if (playlist?.length) {
      setCurrentIdx((prevIdx) => (prevIdx - 1 + playlist.length) % playlist.length);
    }
  };

  const close = () => {
    setIsOpen(false);
    setIsExpanded(false);
    setPlaying(false);
  };

  const value = {
    playlist, currentSong, currentIdx, isOpen, setIsOpen, isExpanded, setIsExpanded,
    playing, setPlaying, volume, setVolume, muted, setMuted, progress, currentTime,
    duration, audioRef, handleTimeUpdate, seek, next, prev, close, playVideo,
    isLocalPlayerOpen, setIsLocalPlayerOpen, activeLocalSong, setActiveLocalSong,
    playingLocal, setPlayingLocal, volumeLocal, setVolumeLocal, mutedLocal, setMutedLocal,
    setCurrentTime, setDuration,
    playLocalFile: (file) => {
      if (!file) return;
      const url = URL.createObjectURL(file);
      const localVideo = {
        id: `local-${Date.now()}`, title: file.name, video_url: url,
        thumbnail_url: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800',
        source: 'local', category: 'Local', path: file.path || null,
        file: file
      };
      setActiveLocalSong(localVideo);
      setIsLocalPlayerOpen(true);
      setPlayingLocal(true);
      setPlaying(false);
    },
    playLocalSong: (song) => {
      if (!song) return;
      setActiveLocalSong(song);
      setIsLocalPlayerOpen(true);
      setPlayingLocal(true);
      setPlaying(false);
    },
    deviceSongs,
    devicePermission,
    isScanning,
    requestDevicePermission: async () => {
      localStorage.setItem('macfeed_device_permission', 'granted');
      setDevicePermission(true);
      
      try {
        const existingHandle = await getHandle('musicFolder');
        if (existingHandle) {
           const status = await existingHandle.requestPermission({ mode: 'read' });
           if (status === 'granted') {
               await scanDirectory(existingHandle);
               return;
           }
        }
      } catch(e) {}

      if ('showDirectoryPicker' in window) {
        try {
          const handle = await window.showDirectoryPicker();
          await setHandle('musicFolder', handle);
          await scanDirectory(handle);
        } catch (e) {
          console.error('Permission denied or picker closed', e);
        }
      } else {
        document.getElementById('device-music-input')?.click();
      }
    },
    handleDeviceFiles,
    removeDeviceSong: async (id) => {
      try {
        await deleteTrack(id);
        setDeviceSongs(prev => prev.filter(s => s.id !== id));
        
        // Clean up from History
        const history = JSON.parse(localStorage.getItem('macfeed_history') || '[]');
        const newHistory = history.filter(item => item.id !== id);
        localStorage.setItem('macfeed_history', JSON.stringify(newHistory));

        // Clean up from Likes
        const likes = JSON.parse(localStorage.getItem('macfeed_likes') || '{}');
        if (likes[id]) {
          delete likes[id];
          localStorage.setItem('macfeed_likes', JSON.stringify(likes));
        }

        // Clean up from Playlist
        setPlaylist(prev => prev.filter(item => item.id !== id));
        
      } catch (e) {
        console.error('Failed to delete track:', e);
      }
    },
    refreshDeviceMusic: () => {
      if (devicePermission) {
        loadStoredDeviceMusic();
      }
    }
  };

  useEffect(() => {
    // Request persistent storage
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(granted => {
        if (granted) console.log('[Storage] Persistent storage granted');
      });
    }
    loadStoredDeviceMusic();
  }, []);

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}
