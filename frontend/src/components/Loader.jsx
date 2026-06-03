import React from 'react';

export default function Loader({ subtle }) {
  if (subtle) {
    return (
      <div className="flex items-center justify-center p-8 w-full h-full min-h-[160px] gap-3">
        <div className="relative w-10 h-10 shrink-0">
          {/* Inner floating energy element */}
          <img
            src="/loader_energy.png"
            alt="Energy loading"
            className="w-full h-full object-contain logo-float-active select-none pointer-events-none"
          />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/50 animate-pulse">Synchronizing...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-transparent py-16 relative overflow-hidden">
      {/* Background ambient glow blob */}
      <div className="absolute w-[280px] h-[280px] bg-cyan-500/10 blur-[100px] rounded-full animate-pulse z-0 pointer-events-none" />

      <div className="relative flex flex-col items-center z-10 scale-90 sm:scale-100">
        <div className="relative w-36 h-36 flex items-center justify-center">
          
          {/* Rotating Hologram Rings */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400/30 energy-glow-active" 
            style={{ animationDuration: '12s' }}
          />
          <div 
            className="absolute inset-3 rounded-full border border-dashed border-[#ff007f]/25 energy-glow-active" 
            style={{ animationDuration: '8s', animationDirection: 'reverse' }}
          />
          <div 
            className="absolute inset-6 rounded-full border-2 border-[#00f2fe]/10" 
          />

          {/* Centered Floating Chrome Energy Emblem */}
          <img
            src="/loader_energy.png"
            alt="Energy Loader"
            className="relative z-10 w-24 h-24 object-contain select-none pointer-events-none logo-float-active"
          />
        </div>

        {/* Loading text and progress indicator */}
        <div className="mt-8 flex flex-col items-center max-w-[200px] w-full">
          <h3 className="text-white font-black text-xs tracking-[0.4em] uppercase text-center animate-pulse">
            LOADING CONTENT
          </h3>
          
          {/* Cyberpunk energy bar indicator */}
          <div className="mt-3 w-40 h-[2px] bg-white/5 relative overflow-hidden rounded-full border border-white/5">
            <div 
              className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-[#00f2fe] to-transparent animate-shimmer"
              style={{
                animation: 'shimmer-bar 1.8s infinite ease-in-out'
              }}
            />
          </div>

          <span className="mt-3 text-[7.5px] font-black uppercase tracking-[0.3em] text-[#00f2fe]/50 text-center">
            Establishing Secure Stream
          </span>
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
