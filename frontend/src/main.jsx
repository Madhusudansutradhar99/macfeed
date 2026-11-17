import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Analytics } from "@vercel/analytics/react";
import App from './App';
import './index.css';
import { fetchWithRetry } from './utils/request';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready for offline use');
  },
});

const GOOGLE_CLIENT_ID = "688376851277-pjbf3re9lmphnoov37pmmdpo5bq6ee36.apps.googleusercontent.com";

// Lazy load Google Identity script only when needed
const loadGoogleIdentity = () => {
  if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) return;
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

// Lazy load YouTube IFrame API only when needed
const loadYouTubeAPI = () => {
  if (window.YT && window.YT.Player) return;
  if (document.querySelector('script[src*="youtube.com/iframe_api"]')) return;
  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  script.async = true;
  document.head.appendChild(script);
};

// Load on first interaction or idle time
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    requestIdleCallback(() => { loadGoogleIdentity(); loadYouTubeAPI(); }, { timeout: 2000 });
  });
} else {
  requestIdleCallback(() => { loadGoogleIdentity(); loadYouTubeAPI(); }, { timeout: 2000 });
}

if (typeof window !== 'undefined' && !window.__macfeedNativeFetch) {
  window.__macfeedNativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => fetchWithRetry(input, init, { timeoutMs: 10000, retryTimeoutMs: 5000, retries: 1 });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
      <Analytics />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

// Build Trigger: 13/05/2026 21:40:00 - Native Final Transformation
