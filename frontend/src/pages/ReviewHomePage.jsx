import React, { useState, useEffect, useContext } from 'react';
import AppCard from '../components/ReviewApp/AppCard';
import ReviewModal from '../components/ReviewApp/ReviewModal';
import api from '../utils/api';
import { ReviewAuthContext } from '../context/ReviewAuthContext';
import { Search, Info, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function ReviewHomePage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(ReviewAuthContext);

  useEffect(() => {
    fetchApps();
  }, [user]);

  const fetchApps = async () => {
    try {
      const { data } = await api.get('/apps' + (user ? `?userId=${user._id}` : ''));
      setApps(data.apps);
    } catch (error) {
      console.error('Failed to fetch apps', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase()) ||
    (app.instructions && app.instructions.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0e1621] relative p-4 max-w-4xl mx-auto w-full z-10">
      
      {/* Welcome / Header Card */}
      <div className="mb-6 bg-[#182533] border border-[#24313f] rounded-2xl p-4 shadow-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
          <Info size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-white uppercase tracking-wider">📢 Review Tasks Channel</h1>
          <p className="text-xs text-gray-400 truncate mt-0.5">Welcome! Review the tasks below and upload screenshot proofs to earn cash instantly.</p>
        </div>
      </div>

      {/* Main Stream Area */}
      <div className="flex-1 space-y-6">
        
        {loading ? (
          // Loader Skeleton styled as Telegram post
          [1, 2, 3].map(i => (
            <div key={i} className="flex gap-3 items-start animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-800 shrink-0"></div>
              <div className="flex-1 bg-[#182533] border border-[#24313f] rounded-2xl rounded-tl-none p-4 space-y-3 max-w-xl">
                <div className="h-3 bg-gray-800 rounded w-1/4"></div>
                <div className="h-16 bg-[#101921] rounded-xl"></div>
                <div className="h-12 bg-gray-800 rounded-xl"></div>
              </div>
            </div>
          ))
        ) : filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <div key={app._id} className="flex gap-3 items-start">
              
              {/* Channel Megaphone Avatar */}
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
                📢
              </div>

              {/* Telegram Post Bubble */}
              <div className="flex-1 bg-[#182533] border border-[#24313f] rounded-2xl rounded-tl-none p-4 shadow-lg max-w-xl text-left">
                <div className="flex items-center justify-between border-b border-[#1f2b38] pb-2 mb-3">
                  <span className="text-xs font-bold text-blue-400">Review & Earn Channel</span>
                  <span className="text-[10px] text-gray-500">
                    {app.createdAt ? new Date(app.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM'}
                  </span>
                </div>

                {/* App Announcement Container */}
                <div className="space-y-4">
                  <div className="flex gap-3 items-center bg-[#101921] p-3 rounded-xl border border-[#202b36] shadow-inner">
                    <div className="w-14 h-14 rounded-xl bg-gray-800 shrink-0 overflow-hidden flex items-center justify-center text-white font-bold border border-gray-700">
                      {app.icon ? (
                        <img src={app.icon} alt="icon" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">{app.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{app.name}</h4>
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-green-400 mt-1 bg-green-500/10 px-2 py-0.5 rounded">
                        💰 Reward: ₹{app.rewardAmount} Cash
                      </div>
                    </div>
                  </div>

                  {/* Task Instructions */}
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-blue-400 mb-1.5">Task Instructions:</h5>
                    <p className="text-xs text-gray-300 bg-[#101921] p-3 rounded-xl border border-[#1f2b38] leading-relaxed whitespace-pre-line">
                      {app.instructions || 'Download the app, use it for 2 minutes and submit a 5-star review screenshot.'}
                    </p>
                  </div>
                </div>

                {/* Telegram Inline Button Row */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a 
                    href={app.playStoreLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#242f3d] hover:bg-[#2d3a4b] text-blue-400 hover:text-blue-300 text-xs font-bold transition-all border border-[#2b394a] text-center"
                  >
                    🔗 Download App
                  </a>
                  <button
                    onClick={() => {
                      if (!user) {
                        navigate('/review/login');
                      } else {
                        setSelectedApp(app);
                      }
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 active:scale-98"
                  >
                    📸 Submit Proof
                  </button>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-[#182533] border border-[#24313f] rounded-2xl text-gray-500 text-sm">
            No active review tasks found.
          </div>
        )}

      </div>

      {/* Review Proof Submission Modal */}
      {selectedApp && (
        <ReviewModal 
          app={selectedApp} 
          onClose={() => setSelectedApp(null)} 
          onSuccess={() => {
            setSelectedApp(null);
            fetchApps();
          }} 
        />
      )}

    </div>
  );
}
