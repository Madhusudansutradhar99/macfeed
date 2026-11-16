import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, Music, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { user, setAuthModalOpen } = useAuth();

  const handleProfileClick = (e) => {
    if (!user) {
      e.preventDefault();
      setAuthModalOpen(true);
    }
  };

  const handleLibraryClick = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  return (
    <nav aria-label="Primary navigation" className="app-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-[6000]">
      <div className="relative mx-auto flex h-[68px] max-w-xl items-center justify-around px-8 bg-transparent">
        
        {/* Left: Library */}
        <button
          onClick={handleLibraryClick}
          aria-label="Open library"
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform duration-300 drop-shadow-md"
        >
          <Menu className="w-6 h-6 text-[var(--text-primary)] opacity-70 group-hover:opacity-100 group-hover:text-[var(--accent-color)] transition-colors" />
          <span className="text-[10px] font-bold text-[var(--text-primary)] opacity-60 tracking-wide">Library</span>
        </button>

        {/* Center: Music */}
        <NavLink
          to="/music"
          aria-label="Music"
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform duration-300 drop-shadow-md"
        >
          <Music className={`w-6 h-6 transition-all duration-300 ${location.pathname === '/music' ? 'text-[var(--accent-color)] drop-shadow-[0_0_8px_var(--accent-color)] scale-110' : 'text-[var(--text-primary)] opacity-70'}`} />
          <span className={`text-[10px] font-bold tracking-wide transition-colors ${location.pathname === '/music' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-primary)] opacity-60'}`}>Music</span>
        </NavLink>

        {/* Right: Profile */}
        <NavLink
          to="/settings"
          onClick={handleProfileClick}
          aria-label="Profile settings"
          className="flex flex-col items-center gap-1 group active:scale-90 transition-transform duration-300 drop-shadow-md"
        >
          <User className={`w-6 h-6 transition-all duration-300 ${location.pathname === '/settings' ? 'text-[var(--accent-color)] drop-shadow-[0_0_8px_var(--accent-color)] scale-110' : 'text-[var(--text-primary)] opacity-70'}`} />
          <span className={`text-[10px] font-bold tracking-wide transition-colors ${location.pathname === '/settings' ? 'text-[var(--text-primary)] opacity-100' : 'text-[var(--text-primary)] opacity-60'}`}>Profile</span>
        </NavLink>

      </div>
    </nav>
  );
}
