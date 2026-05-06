export const getPlaylists = (userId) => {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(`macfeed_playlists_${userId}`) || '[]');
  } catch {
    return [];
  }
};

export const savePlaylists = (userId, playlists) => {
  if (!userId) return;
  localStorage.setItem(`macfeed_playlists_${userId}`, JSON.stringify(playlists));
};

export const createPlaylist = (userId, name) => {
  const playlists = getPlaylists(userId);
  const newPlaylist = {
    id: Date.now().toString(),
    name,
    videos: [],
    createdAt: new Date().toISOString(),
  };
  savePlaylists(userId, [...playlists, newPlaylist]);
  return newPlaylist;
};

export const addVideoToPlaylist = (userId, playlistId, video) => {
  const playlists = getPlaylists(userId);
  const updated = playlists.map((p) => {
    if (p.id === playlistId) {
      if (!p.videos.find((v) => v.id === video.id)) {
        return { ...p, videos: [...p.videos, video] };
      }
    }
    return p;
  });
  savePlaylists(userId, updated);
};

export const removeVideoFromPlaylist = (userId, playlistId, videoId) => {
  const playlists = getPlaylists(userId);
  const updated = playlists.map((p) => {
    if (p.id === playlistId) {
      return { ...p, videos: p.videos.filter((v) => v.id !== videoId) };
    }
    return p;
  });
  savePlaylists(userId, updated);
};

export const deletePlaylist = (userId, playlistId) => {
  const playlists = getPlaylists(userId);
  savePlaylists(
    userId,
    playlists.filter((p) => p.id !== playlistId)
  );
};
