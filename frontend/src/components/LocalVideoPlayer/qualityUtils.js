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
  playlistSelector: () => {
    const maxHeight = getMaxQualityHeight();
    return (playlists) => {
      if (!playlists || playlists.length === 0) return 0;
      // Select variant closest to (but not exceeding) max quality
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
  if (!videoEl || !MediaSource) return;
  try {
    // Hint for VP9/AV1 (modern codecs) to use hardware decoding
    const supported = MediaSource.isTypeSupported(
      'video/mp4; codecs="vp9, opus"'
    ) || MediaSource.isTypeSupported(
      'video/mp4; codecs="av01.0.08M.08, opus"'
    );
    if (supported) {
      videoEl.setAttribute('data-hw-decode', 'true');
    }
  } catch (err) {
    console.debug('[HW Decode] Not available:', err.message);
  }
};

/**
 * Request video frame callback for smooth playback monitoring
 * (used to detect stalls and trigger recovery)
 */
export const setupFrameCallbackMonitoring = (videoEl, onStall) => {
  if (!videoEl.requestVideoFrameCallback) return null;
  
  let lastTimestamp = 0;
  let stallCount = 0;
  
  const checkFrame = (now, metadata) => {
    // If currentTime hasn't advanced, we may be stalled
    if (Math.abs(metadata.presentedFrames - lastTimestamp) < 1) {
      stallCount++;
      if (stallCount > 3) onStall?.();
    } else {
      stallCount = 0;
    }
    lastTimestamp = metadata.presentedFrames;
    videoEl.requestVideoFrameCallback(checkFrame);
  };
  
  return videoEl.requestVideoFrameCallback(checkFrame);
};

/**
 * Memory pressure mitigation: Clear buffered segments beyond playhead
 */
export const mitigateMemoryPressure = (videoEl) => {
  if (!videoEl.buffered) return;
  try {
    const currentTime = videoEl.currentTime;
    const buffer = videoEl.buffered;
    
    // Purge segments >60s ahead of playhead
    for (let i = 0; i < buffer.length; i++) {
      if (buffer.start(i) > currentTime + 60) {
        // Some browsers allow removeAttribute to clean up, others don't
        // This is best-effort
        if (videoEl.sourceBuffer) {
          videoEl.sourceBuffer.remove(buffer.start(i), buffer.end(i));
        }
      }
    }
  } catch (err) {
    console.debug('[Memory] Cleanup unavailable:', err.message);
  }
};
