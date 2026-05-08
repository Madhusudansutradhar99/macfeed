import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Analytics } from "@vercel/analytics/react";
import App from './App';
import './index.css';
import { fetchWithRetry } from './utils/request';

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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

// Build Trigger: 05/08/2026 13:25:31
