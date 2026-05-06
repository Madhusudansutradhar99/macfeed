import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, FolderPlus, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getPlaylists, createPlaylist, addVideoToPlaylist } from '../utils/playlistStore';

export default function PlaylistSelector({ video, isOpen, onClose }) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (user && isOpen) {
      setPlaylists(getPlaylists(user.id));
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!user || !newPlaylistName.trim()) return;
    createPlaylist(user.id, newPlaylistName);
    setPlaylists(getPlaylists(user.id));
    setNewPlaylistName('');
  };

  const handleAddToPlaylist = (playlistId) => {
    if (!user || !video) return;
    addVideoToPlaylist(user.id, playlistId, video);
    setPlaylists(getPlaylists(user.id));
    setToast('Added to playlist!');
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-[#12121e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-purple-400" /> Save to Playlist
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 max-h-[300px] overflow-y-auto">
            {toast && (
              <div className="mb-4 text-center bg-green-500/20 text-green-400 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> {toast}
              </div>
            )}

            <div className="flex flex-col gap-2">
              {playlists.map((p) => {
                const isAdded = p.videos.some((v) => v.id === video.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => !isAdded && handleAddToPlaylist(p.id)}
                    disabled={isAdded}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                      isAdded
                        ? 'bg-purple-600/20 border-purple-500/50 cursor-default'
                        : 'bg-[#181828] border-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-white text-sm font-medium">{p.name}</span>
                    {isAdded && <Check className="w-4 h-4 text-purple-400" />}
                  </button>
                );
              })}
              {playlists.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No playlists found.</p>
              )}
            </div>
          </div>

          <form
            onSubmit={handleCreate}
            className="p-4 border-t border-white/10 bg-black/20 flex gap-2"
          >
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="New playlist name..."
              className="flex-1 bg-[#181828] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
              maxLength={30}
            />
            <button
              type="submit"
              disabled={!newPlaylistName.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
