import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [browserType, setBrowserType] = useState('other');

  useEffect(() => {
    // Detect browser platform for installation guidance
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
      setBrowserType('ios');
    } else if (ua.includes('chrome') || ua.includes('chromium')) {
      setBrowserType('chrome');
    } else {
      setBrowserType('other');
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not already running in standalone display mode and not recently dismissed
      if (!window.matchMedia('(display-mode: standalone)').matches && !localStorage.getItem('pwa_dismissed')) {
        setIsVisible(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Fallback: If after 4 seconds the browser event has not fired, show simulated prompt (if standalone check passes)
    const timer = setTimeout(() => {
      if (!deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches && !localStorage.getItem('pwa_dismissed')) {
        setIsVisible(true);
      }
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsVisible(false);
    } else {
      // No native prompt support (e.g. Safari iOS or dev mode): show custom manual guide modal
      setShowGuide(true);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Dismiss for 24 hours to avoid spamming the user on every reload
    localStorage.setItem('pwa_dismissed', Date.now().toString());
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && !showGuide && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-[320px] bg-[#17212b] border border-gray-800 rounded-3xl p-8 flex flex-col items-center text-center gap-5 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
              <button 
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 bg-[#242f3d] rounded-full text-gray-400 hover:text-white transition-all"
                title="Dismiss"
              >
                <X size={16} />
              </button>

              <img src="/macfeed-logo.png" className="w-16 h-16 object-contain rounded-2xl shadow-md border border-gray-800 bg-[#0e1621]" alt="MacFeed Logo" />
              
              <div className="flex flex-col gap-1">
                <h3 className="text-white text-xl font-black tracking-tight">Download MacFeed</h3>
                <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Install App on Home Screen</p>
              </div>

              <p className="text-xs text-gray-400 leading-relaxed">
                Get instant access, offline mode, and a smoother interface. Add MacFeed to your home screen now.
              </p>

              <button
                onClick={handleInstall}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase text-[11px] tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                Install App
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Install Guide Popup */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-[#17212b] border border-gray-800 rounded-3xl p-6 w-full max-w-[340px] shadow-2xl relative text-left">
              <button 
                onClick={() => { setShowGuide(false); setIsVisible(false); }}
                className="absolute top-4 right-4 p-2 bg-[#242f3d] rounded-full text-gray-400 hover:text-white transition-all"
                title="Close"
              >
                <X size={16} />
              </button>

              <h3 className="text-white text-md font-bold mb-4 flex items-center gap-2">
                📲 Installation Guide
              </h3>

              {browserType === 'ios' ? (
                <div className="space-y-4 text-xs text-gray-300">
                  <p>Safari on iOS does not support automatic downloads. Follow these quick steps to install:</p>
                  <ol className="list-decimal list-inside space-y-2.5">
                    <li>Tap the <span className="font-bold text-blue-400">Share button</span> (📤) in the bottom navigation bar.</li>
                    <li>Scroll down and select <span className="font-bold text-blue-400">Add to Home Screen</span> (➕).</li>
                    <li>Tap <span className="font-bold text-blue-400">Add</span> in the top-right corner.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-4 text-xs text-gray-300">
                  <p>Install the app manually from your browser menu:</p>
                  <ol className="list-decimal list-inside space-y-2.5">
                    <li>Tap the <span className="font-bold text-blue-400">Menu button</span> (three dots ⋮) in your browser.</li>
                    <li>Select <span className="font-bold text-blue-400">Install app</span> or <span className="font-bold text-blue-400">Add to Home Screen</span>.</li>
                    <li>Confirm the prompt.</li>
                  </ol>
                </div>
              )}

              <button
                onClick={() => { setShowGuide(false); setIsVisible(false); }}
                className="w-full mt-6 py-3 bg-[#242f3d] hover:bg-[#2d3a4b] text-gray-300 rounded-xl font-bold uppercase text-[10px] tracking-wider transition-all text-center"
              >
                Got It
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
