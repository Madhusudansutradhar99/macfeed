import React from 'react';
import { createPortal } from 'react-dom';

export default function Loader({ subtle }) {
  const content = (
    <div className={subtle ? "flex items-center justify-center p-8 w-full h-full min-h-[200px]" : "fixed inset-0 bg-[#0A0A0F] flex flex-col items-center justify-center z-[99999] overflow-hidden"}>
      <span className="custom-loader"></span>
      {!subtle && (
        <div className="mt-8 flex flex-col items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Initializing Experience</p>
        </div>
      )}
    </div>
  );

  if (subtle) {
    return content;
  }

  return createPortal(content, document.body);
}
