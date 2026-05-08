/**
 * Video.js React hook for enhanced local video playback
 * Controls: disabled (custom UI handled by LocalPlayerOverlay)
 * Optimized for mobile with RAM cap, quality adaptation, and stall recovery
 */

import { useEffect, useRef, useCallback } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { getMaxQualityHeight, getHlsConfig, applyHardwareDecodingHints, setupFrameCallbackMonitoring, mitigateMemoryPressure } from './qualityUtils';

/**
 * Video.js initialization hook
 * @param {React.MutableRefObject} videoRef - Ref to <video> element
 * @param {Object} options - Configuration options
 * @returns {Object} { player, error }
 */
export const useVideoPlayer = (videoRef, options = {}) => {
  const playerRef = useRef(null);
  const frameCallbackRef = useRef(null);
  const memoryIntervalRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => {
    const initializePlayer = async () => {
      if (!videoRef?.current || playerRef.current) return;

      try {
        const videoElement = videoRef.current;
        
        // Apply hardware decoding hints
        applyHardwareDecodingHints(videoElement);

        // Video.js configuration
        const playerOptions = {
          controls: false, // Custom controls in LocalPlayerOverlay
          autoplay: false,
          preload: 'metadata',
          playbackRates: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
          fluid: true,
          aspectRatio: '16:9',
          html5: {
            vhs: getHlsConfig(),
            nativeAudioTracks: true,
            nativeVideoTracks: true,
            nativeTextTracks: true
          },
          techOrder: ['html5'],
          ...options
        };

        // Initialize Video.js player
        const player = videojs(videoElement, playerOptions);
        playerRef.current = player;

        // Setup frame callback monitoring for stall detection
        player.ready(() => {
          frameCallbackRef.current = setupFrameCallbackMonitoring(
            videoElement,
            () => {
              console.warn('[Player] Stall detected, attempting recovery');
              const currentTime = player.currentTime();
              player.currentTime(currentTime + 0.1); // Micro-skip to unstick
            }
          );
        });

        // Set up memory pressure mitigation (every 5s)
        memoryIntervalRef.current = setInterval(() => {
          mitigateMemoryPressure(videoElement);
        }, 5000);

        // Handle player errors
        player.on('error', () => {
          const error = player.error();
          if (error) {
            console.error('[Player] Error:', error.code, error.message);
            errorRef.current = {
              code: error.code,
              message: error.message,
              type: error.type
            };
          }
        });

        // Log playback events
        player.on('play', () => console.debug('[Player] Playing'));
        player.on('pause', () => console.debug('[Player] Paused'));
        player.on('loadstart', () => console.debug('[Player] Loading'));
        player.on('canplay', () => console.debug('[Player] Can play'));
        player.on('playing', () => console.debug('[Player] Playing (event)'));

        // Capacity monitoring
        player.on('timeupdate', () => {
          const buffered = videoElement.buffered;
          if (buffered.length > 0) {
            const currentTime = videoElement.currentTime;
            const bufferedEnd = buffered.end(buffered.length - 1);
            const bufferAhead = bufferedEnd - currentTime;
            
            // Warn if buffer is too large (memory leak risk)
            if (bufferAhead > 300) {
              console.warn(`[Memory] Large buffer ahead: ${bufferAhead.toFixed(1)}s`);
            }
          }
        });

      } catch (err) {
        console.error('[Player] Initialization failed:', err);
        errorRef.current = { message: err.message };
      }
    };

    initializePlayer();

    // Cleanup on unmount
    return () => {
      if (frameCallbackRef.current && videoRef?.current?.cancelVideoFrameCallback) {
        videoRef.current.cancelVideoFrameCallback(frameCallbackRef.current);
      }
      if (memoryIntervalRef.current) {
        clearInterval(memoryIntervalRef.current);
      }
      if (playerRef.current) {
        playerRef.current.dispose?.();
        playerRef.current = null;
      }
    };
  }, [videoRef, options]);

  return {
    player: playerRef.current,
    error: errorRef.current
  };
};

export default useVideoPlayer;
