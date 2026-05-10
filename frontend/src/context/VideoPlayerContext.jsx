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
  
  // YouTube player instance reference (shared across modes)
  const ytPlayerRef = useRef(null);

  // Set video and maximize (used by Watch page)
  const playVideo = useCallback((video, time = 0) => {
    setActiveVideo(video);
    setViewMode('full');
    setPlaying(true);
    setCurrentTime(time);
  }, []);

  const minimize = useCallback(() => {
    if (viewMode === 'full') setViewMode('mini');
  }, [viewMode]);

  const maximize = useCallback(() => {
    if (viewMode === 'mini') setViewMode('full');
  }, [viewMode]);

  const closePlayer = useCallback(() => {
    setViewMode('closed');
    setPlaying(false);
    setActiveVideo(null);
  }, []);

  const value = {
    activeVideo,
    viewMode,
    playing,
    muted,
    volume,
    currentTime,
    duration,
    ytPlayerRef,
    setPlaying,
    setMuted,
    setVolume,
    setCurrentTime,
    setDuration,
    playVideo,
    minimize,
    maximize,
    closePlayer,
  };

  return (
    <VideoPlayerContext.Provider value={value}>
      {children}
    </VideoPlayerContext.Provider>
  );
}
