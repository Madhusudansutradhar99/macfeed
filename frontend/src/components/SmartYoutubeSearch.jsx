import React, { useState, useEffect } from 'react';
import { Search, Play, X, AlertTriangle, Database } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const SmartYoutubeSearch = () => {
  const { user, setAuthModalOpen } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [saveStatus, setSaveStatus] = useState({});

  const determineCategory = (title, q) => {
    const text = (title + ' ' + q).toLowerCase();
    if (text.includes('movie') || text.includes('film') || text.includes('trailer')) return 'Movies';
    if (text.includes('song') || text.includes('music') || text.includes('lyrics')) return 'Music';
    if (text.includes('cricket') || text.includes('football') || text.includes('match') || text.includes('sports')) return 'Sports';
    if (text.includes('episode') || text.includes('series')) return 'Series';
    return 'Trending'; // Default category
  };

  const saveToDatabase = async (video) => {
    const category = determineCategory(video.title, query);
    
    try {
      setSaveStatus(prev => ({ ...prev, [video.id]: 'saving' }));
      
      const { error: dbError } = await supabase
        .from('videos')
        .upsert({
          youtube_id: video.youtubeId,
          title: video.title,
          thumbnail_url: video.thumbnail,
          video_url: `https://www.youtube.com/embed/${video.youtubeId}`,
          category: category,
          source: 'YouTube',
          views: Math.floor(Math.random() * 1000) // Initial placeholder views
        }, { onConflict: 'youtube_id' });

      if (dbError) throw dbError;
      
      setSaveStatus(prev => ({ ...prev, [video.id]: 'saved' }));
      console.log(`Saved to ${category} section!`);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus(prev => ({ ...prev, [video.id]: 'error' }));
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    saveToDatabase(video);
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setWarning(null);

    const localCacheKey = `yt_cache_${query.toLowerCase()}`;
    const localCached = localStorage.getItem(localCacheKey);
    
    if (localCached) {
      const { data, timestamp } = JSON.parse(localCached);
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        setResults(data);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Something went wrong');

      setResults(data.results);
      if (data.warning) setWarning(data.warning);

      localStorage.setItem(localCacheKey, JSON.stringify({
        data: data.results,
        timestamp: Date.now()
      }));

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 min-h-screen text-white">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black mb-6 italic uppercase tracking-tighter bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
          Global Search Engine
        </h1>
        
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search and Auto-Sync to Site..."
            className="w-full bg-[#111] border-2 border-white/10 rounded-2xl py-4 px-6 pl-14 text-lg focus:outline-none focus:border-purple-600 transition-all group-hover:border-white/20 shadow-2xl"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-xl transition-colors"
          >
            Find
          </button>
        </form>

        {warning && (
          <div className="mt-4 flex items-center justify-center gap-2 text-yellow-500 text-sm font-bold">
            <AlertTriangle className="w-4 h-4" /> {warning}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl text-red-500 mb-8 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-bold uppercase text-xs tracking-widest">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array(8).fill(0).map((_, i) => (
            <div key={i} className="aspect-video bg-white/5 rounded-2xl animate-pulse" />
          ))
        ) : (
          results.map((video) => (
            <div 
              key={video.id}
              onClick={() => handleVideoSelect(video)}
              className="group cursor-pointer bg-[#0f0f1a] border border-white/5 rounded-2xl overflow-hidden hover:border-purple-600/50 transition-all hover:-translate-y-1 shadow-lg"
            >
              <div className="relative aspect-video">
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-purple-600 p-3 rounded-full shadow-lg">
                    <Play className="w-6 h-6 fill-white" />
                  </div>
                </div>
                {saveStatus[video.id] === 'saved' && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                    <Database className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold line-clamp-2 leading-snug text-gray-200 group-hover:text-white mb-2">
                  {video.title}
                </h3>
                {saveStatus[video.id] === 'saving' && <span className="text-[10px] text-purple-400 animate-pulse uppercase font-black">Syncing to Site...</span>}
                {saveStatus[video.id] === 'saved' && <span className="text-[10px] text-green-400 uppercase font-black">Added to Library ✓</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedVideo(null)} />
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <button 
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartYoutubeSearch;
