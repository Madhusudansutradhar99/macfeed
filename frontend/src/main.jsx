import React from 'react';
import ReactDOM from 'react-dom/client';
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

if (typeof window !== 'undefined' && !window.__macfeedNativeFetch) {
  window.__macfeedNativeFetch = window.fetch.bind(window);
  window.fetch = (input, init) => fetchWithRetry(input, init, { timeoutMs: 10000, retryTimeoutMs: 5000, retries: 1 });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);

// Build Trigger: 13/05/2026 21:40:00 - Native Final Transformation
