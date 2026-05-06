import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fallback ad shows MacFeed branding when no Supabase ad is found
const FALLBACK_AD = {
  id: 'macfeed-brand',
  image_url: '/macfeed-logo.png',
  link_url: '/',
  label: 'MacFeed',
  isBrand: true,
};

export default function AdBanner({ position = 'corner' }) {
  const [ad, setAd] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchAd() {
      const { data } = await supabase
        .from('ads')
        .select('*')
        .or(
          `position.eq.${position === 'banner' ? 'banner' : 'corner'},position.eq.${position === 'banner' ? 'top' : 'bottom-right'}`
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (data?.length) {
        setAd(data[0]);
      } else {
        // No ad from Supabase → show MacFeed brand placeholder
        setAd(FALLBACK_AD);
      }
      setLoaded(true);
    }
    fetchAd();
  }, []);

  if (!loaded || !ad || dismissed) return null;

  const isBrand = ad.isBrand;

  if (position === 'banner') {
    return (
      <div className="w-full max-w-5xl mx-auto my-8 relative rounded-xl overflow-hidden shadow-lg border border-primary transition-colors duration-500">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/90 text-white rounded-full p-1 transition"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
        {isBrand ? (
          <a
            href="/"
            className="block w-full bg-secondary p-6 flex flex-col items-center justify-center transition-colors duration-500"
          >
            <div className="flex items-center gap-4">
              <img src="/macfeed-logo.png" alt="MacFeed" className="w-12 h-12 object-contain" />
              <div>
                <div className="text-primary font-bold text-lg">MacFeed Entertainment Hub</div>
                <div className="text-secondary text-sm">
                  Watch unlimited movies and series ad-free!
                </div>
              </div>
            </div>
          </a>
        ) : (
          <>
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider z-10">
              Sponsored
            </div>
            <a
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <img
                src={ad.image_url}
                alt="Advertisement"
                className="w-full h-auto max-h-[150px] object-cover hover:brightness-95 transition"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 60, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 60 }}
        transition={{ delay: 1.5 }}
        className={`fixed bottom-6 right-6 z-40 rounded-2xl overflow-hidden shadow-2xl border border-primary transition-colors duration-500
          ${isBrand
            ? 'w-44 bg-secondary p-4 flex flex-col items-center gap-2'
            : 'max-w-[250px] bg-transparent'
          }`}
      >
        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 z-10 bg-black/60 hover:bg-black/90 text-white rounded-full p-1 transition"
          title="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>

        {isBrand ? (
          /* MacFeed brand placeholder */
          <a href="/" className="flex flex-col items-center gap-2 w-full">
            <img
              src="/macfeed-logo.png"
              alt="MacFeed"
              className="w-16 h-16 object-contain drop-shadow-lg"
            />
            <div className="text-center">
              <div className="text-primary font-bold text-sm">MacFeed</div>
              <div className="text-secondary text-[10px] mt-0.5">Your Entertainment Hub</div>
            </div>
            <div className="bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg" style={{ backgroundColor: 'var(--accent-color)' }}>
              Watch Now
            </div>
          </a>
        ) : (
          /* Real Supabase ad */
          <>
            <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider z-10">
              Ad
            </div>
            <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={ad.image_url}
                alt="Advertisement"
                className="w-full h-auto object-cover hover:brightness-90 transition"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </a>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
