// Network Awareness Utility for Performance Optimization

export function isSlowNetwork() {
  if (!navigator.connection) return false;
  const connection = navigator.connection;
  
  // Check for 2G/3G or effective type
  if (connection.effectiveType === '2g' || connection.effectiveType === '3g') return true;
  
  // Fallback: check saveData
  return connection.saveData === true;
}

export function getNetworkSpeed() {
  if (!navigator.connection) return 'fast';
  return navigator.connection.effectiveType || 'fast'; // '4g', '3g', '2g', '3g'
}

export function shouldAutoplay() {
  return !isSlowNetwork();
}

export function getImageQuality() {
  if (isSlowNetwork()) return 'low'; // Compressed/small images
  return 'high'; // Full quality images
}

export function getThumbnailUrl(url, quality = 'auto') {
  if (!url) return '';
  
  // For YouTube thumbnails, use hqdefault instead of maxresdefault on slow networks
  if (url.includes('ytimg.com')) {
    if (quality === 'low' || isSlowNetwork()) {
      return url.replace('maxresdefault', 'mqdefault').replace('hqdefault', 'mqdefault');
    }
  }
  
  return url;
}

// Monitor network changes
export function onNetworkChange(callback) {
  if (!navigator.connection) return;
  
  const connection = navigator.connection;
  const handleChange = () => {
    callback({
      speed: connection.effectiveType,
      slow: isSlowNetwork(),
      saveData: connection.saveData
    });
  };
  
  connection.addEventListener('change', handleChange);
  return () => connection.removeEventListener('change', handleChange);
}

// Preload critical domains based on network
export function prefetchCriticalResources() {
  if (isSlowNetwork()) return; // Don't prefetch on slow networks
  
  const links = [
    { rel: 'prefetch', href: 'https://www.youtube.com' },
    { rel: 'prefetch', href: 'https://s.ytimg.com' },
  ];
  
  links.forEach(link => {
    const element = document.createElement('link');
    element.rel = link.rel;
    element.href = link.href;
    document.head.appendChild(element);
  });
}
