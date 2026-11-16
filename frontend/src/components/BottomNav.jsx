import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Film, Music, Zap, User, FolderOpen } from 'lucide-react';
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

  const navItems = [
    { label: 'Explore', path: '/', icon: Compass },
    { label: 'Movies', path: '/movies', icon: Film },
    { label: 'Local', path: '/playlists', icon: FolderOpen },
    { label: 'Music', path: '/music', icon: Music },
    { label: 'Profile', path: '/settings', icon: User, onClick: handleProfileClick },
  ];

  return (
    <nav className="lg:hidden fixed bottom-3 left-4 right-4 z-[5000] pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <div className="max-w-md mx-auto digen-pill-nav rounded-full px-2 py-1.5 flex items-center justify-around shadow-2xl pointer-events-auto border border-white/10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={item.onClick}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'digen-pill-active'
                  : 'digen-pill-inactive'
              }`}
            >
              <Icon className="w-4 h-4" />
              {isActive && <span className="text-[11px]">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
