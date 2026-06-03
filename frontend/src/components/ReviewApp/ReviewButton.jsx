import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign } from 'lucide-react';

export default function ReviewButton() {
  return (
    <Link to="/review" className="inline-block">
      <button className="group relative px-4 py-2 md:px-5 md:py-2.5 bg-gradient-to-r from-[#ff007f] to-[#ec4899] text-white rounded-lg font-black text-[8px] md:text-[9px] uppercase tracking-widest shadow-[0_0_15px_rgba(255,0,127,0.3)] hover:shadow-[0_0_25px_rgba(255,0,127,0.6)] hover:scale-105 transition-all duration-300 overflow-hidden active:scale-95 border border-white/10">
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out animate-pulse" />
        <span className="relative flex items-center justify-center gap-1">
          <DollarSign className="w-3 h-3" />
          Review & Earn
        </span>
      </button>
    </Link>
  );
}
