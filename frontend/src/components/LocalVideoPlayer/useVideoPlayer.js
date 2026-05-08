/**
 * Native / HLS hook using hls.js and MediaCapabilities probing
 */
import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { getMaxQualityHeight, getHlsConfig, applyHardwareDecodingHints, setupFrameCallbackMonitoring, mitigateMemoryPressure } from './qualityUtils';
import { isHlsFormat } from './formatChecker';
import { probeMediaCapabilities } from './probeMediaCapabilities';
import { Filesystem } from '@capacitor/filesystem';

export const useVideoPlayer = (videoRef, options = {}) => {
  const hlsRef = useRef(null);
  const frameCallbackRef = useRef(null);
  const memoryIntervalRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => {
    let objectUrl = null;
    let mounted = true;

    const setup = async () => {
      const video = videoRef?.current;
      if (!video || !mounted) return;

      try {
        applyHardwareDecodingHints(video);

        // Determine source from options.currentSong if provided
        let src = options?.src || options?.videoUrl || null;
        if (!src && options?.currentSong) {
          const s = options.currentSong;
          if (s.path) {
            const fileUri = await Filesystem.getUri({ path: s.path });
            src = fileUri.uri;
          } else if (s.file) {
            objectUrl = URL.createObjectURL(s.file);
            src = objectUrl;
          } else if (s.video_url) {
            src = s.video_url;
          }
        }
        if (!src) return;

        // Probe device capabilities
        const probe = await probeMediaCapabilities();
        const maxHeight = probe?.maxHeight || getMaxQualityHeight();

        // If HLS manifest, use hls.js (MSE) for adaptive switching
        if (isHlsFormat(src) || String(src).toLowerCase().endsWith('.m3u8')) {
          if (Hls.isSupported()) {
            // destroy previous instance
            if (hlsRef.current) {
              hlsRef.current.destroy();
              hlsRef.current = null;
            }
            const hls = new Hls({
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              ...getHlsConfig()
            });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              const levels = hls.levels || [];
              let chosen = -1;
              for (let i = 0; i < levels.length; i++) {
                const h = levels[i].height || 0;
                if (h <= maxHeight) chosen = i;
              }
              if (chosen >= 0) hls.currentLevel = chosen;
            });
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src; // native HLS (Safari)
          } else {
            // fallback: attempt to set src and let browser try
            video.src = src;
          }
        } else {
          // Non-HLS: native source (objectURL or http)
          video.src = src;
        }

        // Start buffer/monitoring
        frameCallbackRef.current = setupFrameCallbackMonitoring(video, () => {
          try { video.currentTime += 0.05; } catch (e) { /* best-effort */ }
        });

        memoryIntervalRef.current = setInterval(() => {
          mitigateMemoryPressure(video);
        }, 5000);

      } catch (err) {
        console.error('[useVideoPlayer] init failed:', err);
        errorRef.current = { message: err?.message || String(err) };
      }
    };

    setup();

    return () => {
      mounted = false;
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch (e) {}
        hlsRef.current = null;
      }
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl); } catch (e) {}
      }
      if (frameCallbackRef.current && videoRef?.current?.cancelVideoFrameCallback) {
        try { videoRef.current.cancelVideoFrameCallback(frameCallbackRef.current); } catch (e) {}
      }
      if (memoryIntervalRef.current) clearInterval(memoryIntervalRef.current);
    };
  }, [videoRef, options?.currentSong, options?.src]);

  return {
    hls: hlsRef.current,
    error: errorRef.current
  };
};

export default useVideoPlayer;
