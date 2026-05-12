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

// Build Trigger: 05/08/2026 13:25:31

// Build Trigger: 05/08/2026 13:25:31
