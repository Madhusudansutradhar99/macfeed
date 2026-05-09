import React, { useState, Suspense, lazy, useEffect } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import { MusicProvider } from './context/MusicContext';
import { VideoPlayerProvider } from './context/VideoPlayerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './layout/MainLayout';
import MusicMiniPlayer from './components/MusicMiniPlayer';
import VideoGlobalMiniPlayer from './components/VideoGlobalMiniPlayer';
import AuthModal from './components/AuthModal';
import AdBanner from './components/AdBanner';
import Loader from './components/Loader';
import LocalPlayerOverlay from './components/LocalPlayerOverlay';
import InstallPWA from './components/InstallPWA';
import OfflineStatus from './components/OfflineStatus';
import StartupAnimation from './components/StartupAnimation';

// Lazy load pages for performance optimization
const Home = lazy(() => import('./pages/Home'));
const VideoPlayerPage = lazy(() => import('./pages/VideoPlayerPage'));
const Admin = lazy(() => import('./pages/Admin'));
const AdManager = lazy(() => import('./pages/AdManager'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Movies = lazy(() => import('./pages/Movies'));
const Music = lazy(() => import('./pages/Music'));
const Series = lazy(() => import('./pages/Series'));
const Sports = lazy(() => import('./pages/Sports'));
const CricketPage = lazy(() => import('./pages/CricketPage'));
const FootballPage = lazy(() => import('./pages/FootballPage'));
const Shorts = lazy(() => import('./pages/Shorts'));
const Trending = lazy(() => import('./pages/Trending'));
const Playlists = lazy(() => import('./pages/Playlists'));
const Settings = lazy(() => import('./pages/Settings'));
const Shopping = lazy(() => import('./pages/Shopping'));
const Downloads = lazy(() => import('./pages/Downloads'));
const History = lazy(() => import('./pages/History'));
const Liked = lazy(() => import('./pages/Liked'));
const SmartSearchPage = lazy(() => import('./pages/SmartSearchPage'));
const IntroPage = lazy(() => import('./pages/IntroPage'));

// Preload critical components after initial load
const preloadComponents = () => {
  const components = [
    () => import('./pages/Movies'),
    () => import('./pages/Music'),
    () => import('./pages/Series'),
    () => import('./pages/Sports'),
    () => import('./pages/Shorts'),
    () => import('./pages/Trending'),
    () => import('./pages/Playlists'),
    () => import('./pages/Settings'),
  ];
  components.forEach(c => c());
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setAuthModalOpen } = useAuth();
  
  // Redirect to intro if not logged in and trying to access the root
  useEffect(() => {
    if (!user && location.pathname === '/') {
      navigate('/intro', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // Strict Auth Guard: If no user and not on intro page, force open auth modal
  useEffect(() => {
    // Give auth a tiny delay to initialize from localStorage to avoid flashing modal
    const timer = setTimeout(() => {
      // Allow both /intro and exact match
      if (!user && location.pathname !== '/intro') {
        setAuthModalOpen(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [user, setAuthModalOpen, location.pathname]);

  useEffect(() => {
    CapacitorUpdater.notifyAppReady();
    // Preload chunks after a short delay to not block initial load
    const timer = setTimeout(preloadComponents, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showSplash && <StartupAnimation onComplete={() => setShowSplash(false)} />}
      <MusicProvider>
        <VideoPlayerProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/intro" element={<ErrorBoundary resetKey="intro"><IntroPage /></ErrorBoundary>} />
              <Route element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="/watch/:id" element={<VideoPlayerPage />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/music" element={<Music />} />
                <Route path="/series" element={<Series />} />
                <Route path="/sports" element={<Sports />} />
                <Route path="/sports/cricket" element={<CricketPage />} />
                <Route path="/sports/football" element={<FootballPage />} />
                <Route path="/shorts" element={<Shorts />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/history" element={<History />} />
                <Route path="/liked" element={<Liked />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/shopping" element={<Shopping />} />
                <Route path="/downloads" element={<Downloads />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/ads" element={<AdManager />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/smart-search" element={<SmartSearchPage />} />
              </Route>
            </Routes>
          </Suspense>
          {/* Global persistent overlays */}
          <VideoGlobalMiniPlayer />
          <MusicMiniPlayer />
          <LocalPlayerOverlay />
          <AdBanner />
          <AuthModal />
          <InstallPWA />
          <OfflineStatus />
        </VideoPlayerProvider>
      </MusicProvider>
    </>
  );
}

// Trigger Vercel Build 3
