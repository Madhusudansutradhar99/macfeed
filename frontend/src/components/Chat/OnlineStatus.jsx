import React from 'react';

export default function OnlineStatus({ isOnline }) {
  return (
    <div className="relative">
      <div className={`w-3 h-3 rounded-full border-2 border-gray-900 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
    </div>
  );
}
