/**
 * Quality utilities for adaptive bitrate and performance optimization
 */

/**
 * Get maximum quality height based on device memory and viewport
 * @returns {number} Max quality height in pixels
 */
export const getMaxQualityHeight = () => {
  // Check device memory if available (Chrome 63+)
  const deviceMemory = navigator.deviceMemory || 4;
  const viewport = window.innerHeight;
  
  // Constrain to device capabilities
  if (deviceMemory <= 2) {
    return Math.min(viewport, 480); // 480p on low-end devices
  } else if (deviceMemory <= 4) {
    return Math.min(viewport, 720); // 720p on mid-range
  }
  
  return Math.min(viewport, 1080); // Full HD on capable devices
};

/**
 * Get VHS (HLS) quality configuration for mobile optimization
 * @returns {Object} HLS config object for video.js HLS plugin
 */
export const getHlsConfig = () => ({
  overrideNative: true,
  enableLowInitialPlaylist: true,
  lowInitialPlaylistSize: 2,
  smoothQualityChange: true,
  handleManifestRedirects: true,
  // ── ULTRA-STABLE 8K ENGINE (VLC-STYLE) ──
  maxBufferLength: 180,        // 3 minutes forward buffer
  maxMaxBufferLength: 300,     // Allow up to 5 minutes
  maxBufferSize: 1024 * 1024 * 1024, // 1GB dedicated RAM for 8K fragments
  maxBufferHole: 0.5,          // Larger tolerance for segment gaps
  lowBufferWatchdogPeriod: 0.1,
  highBufferWatchdogPeriod: 0.5,
  nudgeOffset: 0.1,
  nudgeMaxRetry: 20,
  backBufferLength: 10,        // Keep a tiny bit of history for seeking
  fragLoadingMaxRetry: 10,     // Very aggressive retries
  manifestLoadingMaxRetry: 10,
  levelLoadingMaxRetry: 10,
  enableWorker: true,          // Use worker to avoid blocking the main thread
  lowLatencyMode: false,       // Priority: STABILITY over latency
  stable: true,                // Force stable manifest parsing
  playlistSelector: () => {
    const maxHeight = getMaxQualityHeight();
    return (playlists) => {
      if (!playlists || playlists.length === 0) return 0;
      let bestIdx = 0;
      for (let i = 0; i < playlists.length; i++) {
        const height = playlists[i].attributes?.RESOLUTION?.height || 0;
        if (height <= maxHeight) bestIdx = i;
      }
      return bestIdx;
    };
  }
});

/**
 * Apply hardware decoding hints via Media Source Extensions
 */
export const applyHardwareDecodingHints = (videoEl) => {
  if (!videoEl) return;
  try {
    videoEl.setAttribute('data-hw-decode', 'true');
    videoEl.style.transform = 'translateZ(0)'; // Force dedicated plane
    videoEl.style.willChange = 'transform';
    videoEl.setAttribute('fetchpriority', 'high');
    videoEl.setAttribute('preload', 'auto');
    videoEl.setAttribute('decoding', 'async');
  } catch (err) {}
};

/**
 * Request video frame callback for smooth playback monitoring
 */
export const setupFrameCallbackMonitoring = (videoEl, onStall) => {
  if (!videoEl.requestVideoFrameCallback) return null;
  let lastTimestamp = 0;
  let stallCount = 0;
  const checkFrame = (now, metadata) => {
    if (Math.abs(metadata.presentedFrames - lastTimestamp) < 1) {
      stallCount++;
      if (stallCount > 5) onStall?.(); // 5 frames dropped = stall
    } else {
      stallCount = 0;
    }
    lastTimestamp = metadata.presentedFrames;
    videoEl.requestVideoFrameCallback(checkFrame);
  };
  return videoEl.requestVideoFrameCallback(checkFrame);
};

/**
 * Memory pressure mitigation: Clear segments BEHIND the playhead
 */
export const mitigateMemoryPressure = (videoEl) => {
  if (!videoEl.buffered || !videoEl.sourceBuffer) return;
  try {
    const currentTime = videoEl.currentTime;
    const buffer = videoEl.buffered;
    // Purge everything more than 5 seconds behind the playhead
    for (let i = 0; i < buffer.length; i++) {
      if (buffer.end(i) < currentTime - 5) {
        videoEl.sourceBuffer.remove(buffer.start(i), buffer.end(i));
      }
    }
  } catch (err) {}
};
