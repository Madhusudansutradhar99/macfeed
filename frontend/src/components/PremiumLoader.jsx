import React from 'react';

export default function PremiumLoader() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center overflow-hidden relative py-16 bg-transparent">
      {/* Heavy purple and pink ambient background glows */}
      <div className="absolute w-[320px] h-[320px] bg-[#ff007f]/5 blur-[120px] rounded-full animate-pulse top-1/4 left-1/3 z-0 pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full animate-pulse top-1/3 right-1/4 z-0 pointer-events-none" />
      
      {/* Mobile-optimized scaling container */}
      <div className="relative transform scale-75 sm:scale-100 flex flex-col items-center z-10">
        <div className="relative w-40 h-40 flex items-center justify-center">
          
          {/* Symmetrical Outer Rings (Premium Purple / Pink theme) */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-dashed border-[#ff007f]/30 energy-glow-active"
            style={{ animationDuration: '9s' }}
          />
          
          <div 
            className="absolute inset-3 rounded-full border border-dashed border-purple-500/25 energy-glow-active"
            style={{ animationDuration: '6s', animationDirection: 'reverse' }}
          />
          
          <div 
            className="absolute inset-6 rounded-full border border-white/5 bg-black/40 backdrop-blur-sm"
          />

          {/* Glowing radial core */}
          <div className="absolute inset-10 rounded-full bg-gradient-to-tr from-purple-500/10 to-[#ff007f]/10 blur-xl" />
          
          {/* Logo/Center energy image */}
          <img
            src="/loader_energy.png"
            alt="Premium Energy Loader"
            className="relative z-10 w-24 h-24 object-contain select-none pointer-events-none logo-float-active"
          />
        </div>

        {/* Loading Metadata */}
        <div className="mt-10 flex flex-col items-center">
          <h2 className="text-white font-black text-2xl tracking-[0.45em] italic uppercase text-center drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            MACFEED <span className="text-purple-500">PRO</span>
          </h2>
          
          {/* Cyberpunk energy bar indicator */}
          <div className="mt-4 w-48 h-[2px] bg-white/5 relative overflow-hidden rounded-full border border-white/5">
            <div 
              className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-[#ff007f] to-transparent animate-shimmer"
              style={{
                animation: 'shimmer-bar 1.5s infinite ease-in-out'
              }}
            />
          </div>
          
          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.55em] text-[#ff007f]/40 animate-pulse text-center">
            Establishing Secure Sync
          </p>
        </div>
      </div>

      {/* Inline styles for custom bar animation */}
      <style>{`
        @keyframes shimmer-bar {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
