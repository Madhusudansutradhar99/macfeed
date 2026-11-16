import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import { Trophy, ArrowRight, Zap } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import { FALLBACK_VIDEOS } from '../data/fallbackVideos';
import { getCategorizedVideos } from '../utils/categoryDetector';

const DEFAULT_SPORTS = FALLBACK_VIDEOS.filter((v) => v.category === 'Sports');

function getMergedSports(dbList = []) {
  const searched = getCategorizedVideos('Sports');
  const existingIds = new Set(searched.map(m => m.id));
  const base = dbList.length > 0 ? dbList : DEFAULT_SPORTS;
  const unrepeated = base.filter(m => !existingIds.has(m.id));
  return [...searched, ...unrepeated];
}

export default function Sports() {
  const [loading, setLoading] = useState(false);
  const [sportsVideos, setSportsVideos] = useState(() => getMergedSports());
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('category', 'Sports')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setSportsVideos(getMergedSports(data));
        }
      } catch (err) {
        // use fallback
      } finally {
        setLoading(false);
      }
    }
    load();

    const handleUpdate = () => {
      setSportsVideos(prev => getMergedSports(prev));
    };
    window.addEventListener('categorized-videos-updated', handleUpdate);
    return () => window.removeEventListener('categorized-videos-updated', handleUpdate);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white pt-2 sm:pt-4 px-3 sm:px-6 max-w-7xl mx-auto pb-32">
      {/* --- Digen Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="digen-section-title text-xl sm:text-2xl md:text-3xl font-black">
              LIVE SPORTS & HIGHLIGHTS
            </h1>
            <span className="digen-badge-teal text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
              ⚡ Ultra Low Latency
            </span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm font-normal max-w-2xl">
            Cricket tournaments, world soccer leagues, and championship highlights with live stats and scorecards.
          </p>
        </div>

        <div className="text-xs text-gray-400 font-semibold">
          {sportsVideos.length} STREAMS READY
        </div>
      </div>

      {/* --- Featured Sports Portals (Cricket & Football) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Cricket Portal */}
        <div
          onClick={() => navigate('/sports/cricket')}
          className="digen-card relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden cursor-pointer group shadow-xl"
        >
          <img
            src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=1200"
            alt="Cricket"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <span className="digen-badge-amber text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase w-fit mb-2">
              🏏 Cricket Hub
            </span>
            <h2 className="text-2xl font-black text-white group-hover:text-[#f5b700] transition-colors leading-tight">
              IPL & World Cricket
            </h2>
            <p className="text-gray-300 text-xs font-normal mt-1 max-w-md">
              Live match replays, super-overs, and wicket highlights.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white mt-3 group-hover:translate-x-1 transition-transform">
              <span>Open Cricket Zone</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Football Portal */}
        <div
          onClick={() => navigate('/sports/football')}
          className="digen-card relative aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden cursor-pointer group shadow-xl"
        >
          <img
            src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1200"
            alt="Football"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <span className="digen-badge-teal text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase w-fit mb-2">
              ⚽ Football Arena
            </span>
            <h2 className="text-2xl font-black text-white group-hover:text-[#2dd4bf] transition-colors leading-tight">
              Champions League & Leagues
            </h2>
            <p className="text-gray-300 text-xs font-normal mt-1 max-w-md">
              Top league matches, goals of the week, and player compilations.
            </p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white mt-3 group-hover:translate-x-1 transition-transform">
              <span>Open Football Zone</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* --- Sports Stream Grid --- */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="digen-section-title text-base sm:text-lg">Recent Match Highlights</h3>
        <span className="digen-badge-teal text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
          All Sports
        </span>
      </div>

      {sportsVideos.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">No sports streams currently loaded.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {sportsVideos.map((video) => (
            <VideoCard key={video.id} video={video} variant="standard" />
          ))}
        </div>
      )}
    </div>
  );
}
