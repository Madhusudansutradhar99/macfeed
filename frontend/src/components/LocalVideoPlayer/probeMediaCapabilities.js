/**
 * Probe MediaCapabilities to determine best starting resolution/codec
 * Returns an object {maxHeight, smooth} indicating suggested max height and whether playback should be smooth.
 */
export async function probeMediaCapabilities() {
  try {
    const deviceMemory = navigator.deviceMemory || 4;
    const viewport = Math.max(window.innerWidth, window.innerHeight) || 1080;

    // Default caps by deviceMemory
    let capByMemory = 1080;
    if (deviceMemory <= 2) capByMemory = 480;
    else if (deviceMemory <= 4) capByMemory = 720;
    else if (deviceMemory <= 8) capByMemory = 2160; // 4K
    else capByMemory = 4320; // 8K assumed for >8GB devices

    // Try MediaCapabilities API to detect actual decoding smoothness for a given resolution/codecs
    if (navigator.mediaCapabilities && navigator.mediaCapabilities.decodingInfo) {
      // Try a descending list of heights to find the highest smooth one
      const heights = [4320, 2160, 1440, 1080, 720, 480];
      for (const h of heights) {
        const config = {
          type: 'file',
          video: {
            contentType: 'video/mp4; codecs="avc1.42E01E"',
            width: Math.round((h * 16) / 9),
            height: h,
            bitrate: Math.round((h / 1080) * 8_000_000),
            framerate: 30
          }
        };
        try {
          // eslint-disable-next-line no-await-in-loop
          const info = await navigator.mediaCapabilities.decodingInfo(config);
          if (info && info.smooth && info.powerEfficient) {
            return { maxHeight: Math.min(h, capByMemory, viewport), smooth: true };
          }
        } catch (e) {
          // ignore and continue
        }
      }
      // If none reported smooth, fall back to memory heuristic
      return { maxHeight: Math.min(capByMemory, viewport), smooth: false };
    }

    // No API -> use heuristic
    return { maxHeight: Math.min(capByMemory, viewport), smooth: false };
  } catch (err) {
    console.debug('[probeMediaCapabilities] failed:', err.message);
    return { maxHeight: 720, smooth: false };
  }
}
