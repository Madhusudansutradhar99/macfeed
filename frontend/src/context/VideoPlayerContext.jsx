import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const VideoPlayerContext = createContext(null);

export function useVideoMiniPlayer() {
  return useContext(VideoPlayerContext);
}

export function VideoPlayerProvider({ children }) {
  const [miniVideo, setMiniVideo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  // Store the desired resume time so we can seek after metadata loads
  const seekOnLoadRef = useRef(0);
  const shouldPlayOnLoadRef = useRef(false);

  // Open mini player with a video
  const openMini = useCallback((video, time = 0, isPlaying = true) => {
    // Store time & play intent so loadedmetadata can seek correctly
    seekOnLoadRef.current = time;
    shouldPlayOnLoadRef.current = isPlaying;
    setMiniVideo(video);
    setCurrentTime(time);
    setIsOpen(true);
    setPlaying(isPlaying);
  }, []);

  // Close mini player
  const closeMini = useCallback(() => {
    setIsOpen(false);
    setPlaying(false);
    setMiniVideo(null);
    setCurrentTime(0);
    setDuration(0);
    setProgress(0);
  }, []);

  // Restore from mini (return to full player)
  const restoreFromMini = useCallback(() => {
    // Save current state before closing
    const time = videoRef.current?.currentTime || currentTime;
    const wasPlaying = playing;
    const vid = miniVideo;
    setIsOpen(false);
    return { video: vid, time, playing: wasPlaying };
  }, [miniVideo, currentTime, playing]);

  // Sync video element when miniVideo changes
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !miniVideo) return;

    // For YouTube videos, the context videoRef is not used — skip
    if (miniVideo.source === 'youtube') return;

    vid.src = miniVideo.video_url || '';
    // Do NOT set currentTime here — wait for loadedmetadata
    vid.load();
    // currentTime will be applied in the onLoadedMetadata handler
  }, [miniVideo]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (playing) vid.play().catch(() => setPlaying(false));
    else vid.pause();
  }, [playing]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.volume = volume;
    vid.muted = muted;
  }, [volume, muted]);

  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid?.duration) return;
    setCurrentTime(vid.currentTime);
    setDuration(vid.duration);
    setProgress((vid.currentTime / vid.duration) * 100);
  };

  // After metadata loads, seek to the saved resume point then play
  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setDuration(vid.duration);
    const resumeTime = seekOnLoadRef.current;
    if (resumeTime > 0) {
      vid.currentTime = resumeTime;
      setCurrentTime(resumeTime);
      setProgress((resumeTime / vid.duration) * 100);
    }
    if (shouldPlayOnLoadRef.current) {
      vid.play().catch(() => setPlaying(false));
    }
    // Reset so subsequent loads don't re-seek
    seekOnLoadRef.current = 0;
    shouldPlayOnLoadRef.current = false;
  };

  const seek = (percent) => {
    const vid = videoRef.current;
    if (!vid?.duration) return;
    vid.currentTime = (percent / 100) * vid.duration;
  };

  const value = {
    miniVideo,
    isOpen,
    playing,
    muted,
    volume,
    currentTime,
    duration,
    progress,
    videoRef,
    setPlaying,
    setMuted,
    setVolume,
    openMini,
    closeMini,
    restoreFromMini,
    handleTimeUpdate,
    seek,
  };

  return (
    <VideoPlayerContext.Provider value={value}>
      <audio style={{ display: 'none' }} />
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {children}
    </VideoPlayerContext.Provider>
  );
}
