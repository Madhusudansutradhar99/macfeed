import React from 'react';
import { Play } from 'lucide-react';

export default function AppCard({ app, onReviewClick }) {
  return (
    <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700 hover:border-blue-500/50 transition-colors group">
      <div className="flex gap-4 items-start">
        <div className="w-16 h-16 rounded-xl bg-gray-700 overflow-hidden flex-shrink-0">
          {app.icon ? (
            <img src={app.icon} alt={app.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-2xl">
              {app.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg line-clamp-1">{app.name}</h3>
          <p className="text-blue-400 font-semibold mt-1">Earn ₹{app.rewardAmount}</p>
        </div>
      </div>
      
      <p className="mt-4 text-sm text-gray-400 line-clamp-2">{app.instructions}</p>
      
      <div className="mt-5 flex gap-3">
        <a 
          href={app.playStoreLink} 
          target="_blank" 
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl font-medium transition-colors text-sm"
        >
          <Play size={16} /> Get App
        </a>
        <button 
          onClick={() => onReviewClick(app)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20 text-sm"
        >
          Submit Review
        </button>
      </div>
    </div>
  );
}
