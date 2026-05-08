/**
 * Format support detection for local file playback
 */

/**
 * Check if a file format is supported by the browser
 * @param {File|string} fileOrPath - File object or file path/name
 * @returns {boolean} True if format is likely supported
 */
export const isFormatSupported = (fileOrPath) => {
  const filename = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath?.name || '';
  const ext = filename.toLowerCase().split('.').pop();
  
  // Supported container formats
  const supportedFormats = {
    // Video
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    'ts': 'video/mp2t',
    'm3u8': 'application/vnd.apple.mpegurl', // HLS
    'mpg': 'video/mpeg',
    'mpeg': 'video/mpeg',
    'mov': 'video/quicktime',
    'flv': 'video/x-flv',
    'avi': 'video/x-msvideo',
    'ogv': 'video/ogg',
    '3gp': 'video/3gpp',
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'aac': 'audio/aac',
    'm4a': 'audio/mp4',
    'weba': 'audio/webp'
  };
  
  if (!supportedFormats[ext]) {
    console.warn(`[Format] Unknown format: .${ext}`);
    return false;
  }
  
  try {
    const mimeType = supportedFormats[ext];
    // Test MIME type support
    const audio = document.createElement('audio');
    const video = document.createElement('video');
    
    const canPlay = 
      video.canPlayType(mimeType) !== '' ||
      audio.canPlayType(mimeType) !== '' ||
      ext === 'm3u8'; // HLS often requires hls.js plugin
    
    return canPlay;
  } catch (err) {
    console.debug(`[Format] Support check failed: ${err.message}`);
    return true; // Assume supported on error (fallback)
  }
};

/**
 * Detect if file is HLS (M3U8) based on extension or content
 * @param {File|string} fileOrPath - File object or path
 * @returns {boolean}
 */
export const isHlsFormat = (fileOrPath) => {
  const filename = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath?.name || '';
  return filename.toLowerCase().endsWith('.m3u8');
};

/**
 * Get MIME type for file
 * @param {string} filename - File name
 * @returns {string|null} MIME type or null
 */
export const getMimeType = (filename) => {
  const mimeMap = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    'ts': 'video/mp2t',
    'm3u8': 'application/vnd.apple.mpegurl',
    'mpg': 'video/mpeg',
    'mov': 'video/quicktime',
    'flv': 'video/x-flv',
    'avi': 'video/x-msvideo',
    'ogv': 'video/ogg',
    '3gp': 'video/3gpp',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'aac': 'audio/aac',
    'm4a': 'audio/mp4'
  };
  
  const ext = filename.toLowerCase().split('.').pop();
  return mimeMap[ext] || null;
};
