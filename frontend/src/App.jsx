import React, { useState, Suspense, lazy, useEffect, useRef } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import { MusicProvider } from './context/MusicContext';
import { VideoPlayerProvider } from './context/VideoPlayerContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './layout/MainLayout';
import MusicMiniPlayer from './components/MusicMiniPlayer';
import AuthModal from './components/AuthModal';
import AdBanner from './components/AdBanner';
import Loader from './components/Loader';
const LocalPlayerOverlay = lazy(() => import('./components/LocalPlayerOverlay'));
import InstallPWA from './components/InstallPWA';
import OfflineStatus from './components/OfflineStatus';
import StartupAnimation from './components/StartupAnimation';
import InstantFeedbackProvider from './components/InstantFeedbackProvider';

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

  // Use a ref for location to avoid listener duplication
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    const initNative = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // 1. Style Status Bar for True Immersive Look
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setStyle({ style: Style.Light }); // Light icons for Dark background
          
          // 2. Hide Splash Screen
          await SplashScreen.hide();
        } catch (e) {
          console.warn('Capacitor plugin error:', e);
        }
      }
    };

    initNative();
    CapacitorUpdater.notifyAppReady();

    // 3. Handle Back Button (Android) - Setup only once
    let backListener;
    const setupBackListener = async () => {
        if (Capacitor.isNativePlatform()) {
            backListener = await CapApp.addListener('backButton', ({ canGoBack }) => {
                const path = locationRef.current.pathname;
                if (!canGoBack || path === '/' || path === '/intro') {
                  CapApp.exitApp();
                } else {
                  navigate(-1);
                }
            });
        }
    };
    setupBackListener();
    
    // Preload chunks after a short delay to not block initial load
    const timer = setTimeout(preloadComponents, 3000);
    return () => {
        clearTimeout(timer);
        if (backListener) backListener.remove();
    };
  }, [navigate]); // navigate is stable

  return (
    <>
      {showSplash && <StartupAnimation onComplete={() => setShowSplash(false)} />}
      <MusicProvider>
        <VideoPlayerProvider>
          <InstantFeedbackProvider />
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/intro" element={<ErrorBoundary resetKey="intro"><IntroPage /></ErrorBoundary>} />
              <Route element={<MainLayout />}>
                <Route index element={<ErrorBoundary resetKey="home"><Home /></ErrorBoundary>} />
                <Route path="/watch/:id" element={<ErrorBoundary resetKey="watch"><VideoPlayerPage /></ErrorBoundary>} />
                <Route path="/movies" element={<ErrorBoundary resetKey="movies"><Movies /></ErrorBoundary>} />
                <Route path="/music" element={<ErrorBoundary resetKey="music"><Music /></ErrorBoundary>} />
                <Route path="/series" element={<ErrorBoundary resetKey="series"><Series /></ErrorBoundary>} />
                <Route path="/sports" element={<ErrorBoundary resetKey="sports"><Sports /></ErrorBoundary>} />
                <Route path="/sports/cricket" element={<ErrorBoundary resetKey="cricket"><CricketPage /></ErrorBoundary>} />
                <Route path="/sports/football" element={<ErrorBoundary resetKey="football"><FootballPage /></ErrorBoundary>} />
                <Route path="/shorts" element={<ErrorBoundary resetKey="shorts"><Shorts /></ErrorBoundary>} />
                <Route path="/trending" element={<ErrorBoundary resetKey="trending"><Trending /></ErrorBoundary>} />
                <Route path="/history" element={<ErrorBoundary resetKey="history"><History /></ErrorBoundary>} />
                <Route path="/liked" element={<ErrorBoundary resetKey="liked"><Liked /></ErrorBoundary>} />
                <Route path="/playlists" element={<ErrorBoundary resetKey="playlists"><Playlists /></ErrorBoundary>} />
                <Route path="/settings" element={<ErrorBoundary resetKey="settings"><Settings /></ErrorBoundary>} />
                <Route path="/shopping" element={<ErrorBoundary resetKey="shopping"><Shopping /></ErrorBoundary>} />
                <Route path="/downloads" element={<ErrorBoundary resetKey="downloads"><Downloads /></ErrorBoundary>} />
                <Route path="/admin" element={<ErrorBoundary resetKey="admin"><Admin /></ErrorBoundary>} />
                <Route path="/admin/ads" element={<ErrorBoundary resetKey="admanager"><AdManager /></ErrorBoundary>} />
                <Route path="/search" element={<ErrorBoundary resetKey="search"><SearchResults /></ErrorBoundary>} />
                <Route path="/smart-search" element={<ErrorBoundary resetKey="smartsearch"><SmartSearchPage /></ErrorBoundary>} />
              </Route>
            </Routes>
          </Suspense>
          {/* Global persistent overlays */}
          <MusicMiniPlayer />
          <LocalPlayerOverlay />
          <AuthModal />
          <InstallPWA />
          <OfflineStatus />
        </VideoPlayerProvider>
      </MusicProvider>
    </>
  );
}

// Trigger Vercel Build 3
