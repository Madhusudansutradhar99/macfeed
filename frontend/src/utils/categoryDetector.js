// Auto-Categorization & Categorized Video Store

export const CATEGORIES = [
  'Movies',
  'Music',
  'Shorts',
  'Sports',
  'Series',
  'Drama',
  'Comedy',
  'Animation',
  'Action'
];

/**
 * Intelligently classifies any video into a category based on its title, query, and duration.
 */
export function detectCategory(video = {}, query = '') {
  const text = `${query} ${video.title || ''} ${video.category || ''} ${video.description || ''}`.toLowerCase();

  // 1. Music Detection
  const musicPatterns = [
    /\b(song|songs|music|audio|mp3|track|remix|singer|lyrics|vevo|album|soundtrack|dj|lofi|instrumental|acoustic|pop|rock|hiphop|hip hop|rap|gaana|bhajan|qawwali|beats|melody|karaoke|official audio|t-series|arijit|shreya|sonu nigam|badshah|honey singh|atif|sidhu)\b/i,
    /music video/i,
    /\(audio\)/i,
    /\[audio\]/i,
  ];
  if (musicPatterns.some(p => p.test(text))) {
    return 'Music';
  }

  // 2. Shorts Detection
  if (text.includes('#shorts') || text.includes('#short') || text.includes('reels') || text.includes('tiktok') || video.duration === 'Short') {
    return 'Shorts';
  }

  // 3. Sports Detection
  const sportsPatterns = [
    /\b(cricket|football|soccer|ipl|match|highlights|wicket|goal|super over|icc|fifa|t20|world cup|olympics|nba|wwe|tennis|badminton|batting|bowling|champions league)\b/i,
    /\bvs\b/i
  ];
  if (sportsPatterns.some(p => p.test(text))) {
    return 'Sports';
  }

  // 4. Series & Drama Detection
  const seriesPatterns = [
    /\b(drama|kdrama|k-drama|series|web series|episode|season|s0[1-9]|e0[1-9]|ep\s*\d+|serial|natok|tv show)\b/i
  ];
  if (seriesPatterns.some(p => p.test(text))) {
    return text.includes('drama') ? 'Drama' : 'Series';
  }

  // 5. Comedy
  if (/\b(comedy|funny|standup|stand-up|roast|prank|joke|memes)\b/i.test(text)) {
    return 'Comedy';
  }

  // 6. Animation
  if (/\b(anime|animation|animated|cartoon|pixar|disney|manga)\b/i.test(text)) {
    return 'Animation';
  }

  // 7. Movies Detection
  const moviePatterns = [
    /\b(movie|movies|film|cinema|trailer|teaser|blockbuster|full movie|action movie|bollywood|hollywood|dubbed|climax|hindi dubbed)\b/i
  ];
  if (moviePatterns.some(p => p.test(text))) {
    return 'Movies';
  }

  // Fallback category
  if (video.category && CATEGORIES.includes(video.category)) {
    return video.category;
  }

  return 'Movies'; // default fallback for long-form content
}

const STORAGE_KEY = 'macfeed_categorized_videos';

/**
 * Saves a list of videos after auto-categorizing each one.
 * Merges with existing categorized videos in localStorage and notifies subscribers.
 */
export function saveCategorizedVideos(videos = [], query = '') {
  if (!videos || !Array.isArray(videos) || videos.length === 0) return;

  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const existingMap = new Map(existing.map(v => [v.id || v.ytId, v]));

    videos.forEach(v => {
      const vidId = v.id || (v.ytId ? `yt-${v.ytId}` : null);
      if (!vidId) return;

      const detectedCat = detectCategory(v, query);
      const enhancedVideo = {
        ...v,
        id: vidId,
        category: detectedCat,
        savedAt: Date.now()
      };

      existingMap.set(vidId, enhancedVideo);
    });

    const updatedList = Array.from(existingMap.values()).slice(-200); // keep last 200 items
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

    // Dispatch global event so all pages instantly re-render with new categorized items
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('categorized-videos-updated', { detail: { count: updatedList.length } }));
    }
  } catch (err) {
    console.warn('Failed to save categorized videos:', err);
  }
}

/**
 * Retrieves categorized videos for a specific category.
 */
export function getCategorizedVideos(categoryName = '') {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!categoryName || categoryName.toUpperCase() === 'ALL') return all;

    const target = categoryName.toLowerCase();
    return all.filter(v => {
      const cat = (v.category || '').toLowerCase();
      if (target === 'movies') {
        return cat === 'movies' || cat === 'action' || cat === 'sci-fi' || cat === 'drama';
      }
      if (target === 'series') {
        return cat === 'series' || cat === 'drama';
      }
      return cat === target;
    });
  } catch (e) {
    return [];
  }
}

/**
 * Retrieves all categorized videos saved so far.
 */
export function getAllCategorizedVideos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}
