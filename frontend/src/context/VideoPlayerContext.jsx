import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const VideoPlayerContext = createContext(null);

export function useVideoMiniPlayer() {
  return useContext(VideoPlayerContext);
}

export function VideoPlayerProvider({ children }) {
  const [activeVideo, setActiveVideo] = useState(null);
  const [viewMode, setViewMode] = useState('closed'); // 'full', 'mini', 'closed'
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Playlist support
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // YouTube player instance reference (shared across modes)
  const ytPlayerRef = useRef(null);

  // Set video and maximize (used by Watch page)
  const playVideo = useCallback((video, newPlaylist = [], index = -1) => {
    setActiveVideo(video);
    if (newPlaylist.length > 0) {
      setPlaylist(newPlaylist);
      if (index !== -1) {
        setCurrentIndex(index);
      } else {
        const idx = newPlaylist.findIndex(v => v.id === video.id);
        setCurrentIndex(idx);
      }
    }
    setViewMode('full');
    setPlaying(true);
    setCurrentTime(0);
  }, []);

  const playNext = useCallback(() => {
    if (playlist.length > 0 && currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextVideo = playlist[nextIndex];
      setActiveVideo(nextVideo);
      setCurrentIndex(nextIndex);
      setPlaying(true);
      setCurrentTime(0);
    }
  }, [playlist, currentIndex]);

  const playPrevious = useCallback(() => {
    if (playlist.length > 0 && currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevVideo = playlist[prevIndex];
      setActiveVideo(prevVideo);
      setCurrentIndex(prevIndex);
      setPlaying(true);
      setCurrentTime(0);
    }
  }, [playlist, currentIndex]);

  const closePlayer = useCallback(() => {
    setViewMode('closed');
    setPlaying(false);
    setActiveVideo(null);
    setPlaylist([]);
    setCurrentIndex(-1);
  }, []);

  const value = {
    activeVideo,
    viewMode,
    playing,
    muted,
    volume,
    currentTime,
    duration,
    playlist,
    currentIndex,
    ytPlayerRef,
    setPlaying,
    setMuted,
    setVolume,
    setCurrentTime,
    setDuration,
    playVideo,
    playNext,
    playPrevious,
    closePlayer,
  };

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}
