import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Plus, Trash2, Folder, Film, Monitor, Upload, X, 
  Clock, HardDrive, LayoutGrid, List
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMusicPlayer } from '../context/MusicContext';
import {
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  removeVideoFromPlaylist,
} from '../utils/playlistStore';
import { motion, AnimatePresence } from 'framer-motion';
import SmartYoutubeSearch from '../components/SmartYoutubeSearch';

export default function Playlists() {
  const { user, setAuthModalOpen } = useAuth();
  const { playLocalFile } = useMusicPlayer();
  const navigate = useNavigate();
  
  const [activeView, setActiveView] = useState('Local'); // 'Local' or 'Playlists'
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [recentLocal, setRecentLocal] = useState([]);
  
  const fileInputRef = useRef(null);
  const fileRegistry = useRef(new Map());

  useEffect(() => {
    if (user) {
      setPlaylists(getPlaylists(user.id));
    } else {
      setPlaylists([]);
      setActivePlaylist(null);
    }
    // Load recent local files from localStorage metadata
    const localMeta = JSON.parse(localStorage.getItem('macfeed_recent_local') || '[]');
    setRecentLocal(localMeta);
  }, [user]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Save metadata for "Recent" list
      const newMeta = {
        id: Date.now(),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        date: new Date().toLocaleDateString()
      };
      
      // Store actual File object in memory registry
      fileRegistry.current.set(file.name, file);
      
      const updated = [newMeta, ...recentLocal.filter(f => f.name !== file.name)].slice(0, 8);
      localStorage.setItem('macfeed_recent_local', JSON.stringify(updated));
      setRecentLocal(updated);
      
      playLocalFile(file);
    }
  };

  const handleRecentPlay = (fileMeta) => {
    const actualFile = fileRegistry.current.get(fileMeta.name);
    if (actualFile) {
      playLocalFile(actualFile);
    } else {
      // Browser security clears memory on refresh. Need to re-select.
      alert(`Security: Please re-select "${fileMeta.name}" to play it again.`);
      fileInputRef.current.click();
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!user || !newPlaylistName.trim()) return;
    createPlaylist(user.id, newPlaylistName);
    setPlaylists(getPlaylists(user.id));
    setNewPlaylistName('');
  };

  return (
    <div className="min-h-screen bg-primary text-primary transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* ── HEADER & NAVIGATION ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div>
             <h1 className="text-4xl font-black uppercase italic tracking-tighter text-primary flex items-center gap-3">
               <Monitor className="w-10 h-10 text-accent" style={{ color: 'var(--accent-color)' }} /> MacFeed Library
             </h1>
             <p className="text-secondary text-xs font-black uppercase tracking-[0.3em] mt-2 italic">Local Media & Global Playlists</p>
          </div>

           <div className="flex bg-secondary backdrop-blur-xl p-1 rounded-2xl border border-primary shadow-2xl overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveView('Local')}
                className={`px-6 md:px-8 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeView === 'Local' ? 'bg-primary text-primary shadow-xl' : 'text-secondary hover:text-primary'}`}
              >
                Local Files
              </button>
              <button 
                onClick={() => setActiveView('Playlists')}
                className={`px-6 md:px-8 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeView === 'Playlists' ? 'bg-primary text-primary shadow-xl' : 'text-secondary hover:text-primary'}`}
              >
                My Playlists
              </button>
              <button 
                onClick={() => setActiveView('Smart')}
                className={`px-6 md:px-8 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${activeView === 'Smart' ? 'bg-primary text-primary shadow-xl' : 'text-secondary hover:text-primary'}`}
              >
                Smart Player
              </button>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {activeView === 'Local' ? (
            <motion.div 
              key="local" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* LARGE DROPZONE */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative w-full aspect-[21/9] md:aspect-[32/10] bg-secondary border-2 border-dashed border-primary rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all duration-700 shadow-2xl overflow-hidden"
              >
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" style={{ '--tw-gradient-from': 'var(--accent-color)' }} />
                 <div className="relative z-10 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all duration-700">
                      <Upload className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-primary mb-2">Open Local Media</h2>
                    <p className="text-secondary text-[10px] font-black uppercase tracking-[0.4em]">Drag & drop video files here or click to browse</p>
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="video/*,audio/*,.mkv,.avi,.mov,.wmv,.flv,.3gp,.flac,.wav,.ogg,.m4a" onChange={handleFileSelect} />
              </div>

              {/* RECENT LOCAL FILES */}
              <div>
                 <div className="flex items-center gap-4 mb-8">
                    <div className="h-[1px] flex-1 bg-primary/10" />
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-secondary flex items-center gap-2 italic"><Clock className="w-4 h-4" /> Recently Played</h3>
                    <div className="h-[1px] flex-1 bg-primary/10" />
                 </div>

                 {recentLocal.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 border border-primary rounded-[2rem] bg-secondary/30">
                      <HardDrive className="w-12 h-12 text-secondary mb-4 opacity-20" />
                      <p className="text-secondary text-[10px] font-bold uppercase tracking-widest">No local files played recently</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {recentLocal.map((file) => (
                        <motion.div 
                          key={file.id} whileHover={{ y: -10 }}
                          className="bg-secondary backdrop-blur-3xl border border-primary rounded-[2rem] p-6 group cursor-pointer hover:border-accent transition-all duration-500"
                          onClick={() => handleRecentPlay(file)}
                        >
                           <div className="w-14 h-14 rounded-2xl bg-primary/5 border border-primary flex items-center justify-center mb-6 group-hover:bg-accent group-hover:text-white transition-all">
                             <Film className="w-6 h-6" />
                           </div>
                           <h4 className="text-primary font-black uppercase italic text-sm line-clamp-2 leading-tight mb-2 group-hover:text-accent transition-colors">{file.name}</h4>
                           <div className="flex items-center justify-between mt-auto">
                              <span className="text-[9px] font-black text-secondary uppercase tracking-widest">{file.size}</span>
                              <span className="text-[9px] font-black text-secondary uppercase tracking-widest">{file.date}</span>
                           </div>
                        </motion.div>
                      ))}
                   </div>
                 )}
              </div>
            </motion.div>
          ) : activeView === 'Smart' ? (
            <motion.div 
              key="smart" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            >
               <SmartYoutubeSearch />
            </motion.div>
          ) : (
            <motion.div 
              key="playlists" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            >
              {/* PLAYLISTS SECTION */}
              {!user ? (
                 <div className="flex flex-col items-center justify-center py-32 text-center border border-primary rounded-[3rem] bg-secondary/30">
                   <Folder className="w-16 h-16 text-secondary mb-6 opacity-20" />
                   <h2 className="text-2xl font-black uppercase italic tracking-tighter text-primary mb-4">Cloud Playlists require an account</h2>
                   <button onClick={() => setAuthModalOpen(true)} className="bg-accent hover:opacity-90 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-2xl" style={{ backgroundColor: 'var(--accent-color)' }}>Sign In to MacFeed</button>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                   {/* Left: Playlist List */}
                   <div className="lg:col-span-4 space-y-6">
                      <form onSubmit={handleCreate} className="flex gap-2">
                         <input 
                           type="text" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)}
                           placeholder="CREATE NEW COLLECTION..."
                           className="flex-1 bg-secondary border border-primary rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest text-primary focus:outline-none focus:border-accent transition-all placeholder:text-secondary"
                         />
                         <button type="submit" className="bg-accent text-white p-4 rounded-2xl transition-all shadow-xl" style={{ backgroundColor: 'var(--accent-color)' }}><Plus className="w-5 h-5" /></button>
                      </form>
                      <div className="space-y-2">
                         {playlists.map(p => (
                           <div 
                             key={p.id} onClick={() => setActivePlaylist(p)}
                             className={`p-5 rounded-3xl cursor-pointer transition-all border flex items-center justify-between group ${activePlaylist?.id === p.id ? 'bg-accent text-white border-accent shadow-xl' : 'bg-secondary border-primary hover:bg-primary/5'}`}
                             style={activePlaylist?.id === p.id ? { backgroundColor: 'var(--accent-color)', borderColor: 'var(--accent-color)' } : {}}
                           >
                              <div>
                                 <div className={`font-black uppercase italic tracking-tighter text-lg ${activePlaylist?.id === p.id ? 'text-white' : 'text-primary'}`}>{p.name}</div>
                                 <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${activePlaylist?.id === p.id ? 'text-white/50' : 'text-secondary'}`}>{p.videos.length} ITEMS</div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); deletePlaylist(user.id, p.id); setPlaylists(getPlaylists(user.id)); }} className={`p-2 transition-colors opacity-0 group-hover:opacity-100 ${activePlaylist?.id === p.id ? 'text-white/40 hover:text-white' : 'text-secondary hover:text-red-500'}`}><Trash2 className="w-5 h-5" /></button>
                           </div>
                         ))}
                      </div>
                   </div>
                   {/* Right: Selected Playlist */}
                   <div className="lg:col-span-8">
                      {activePlaylist ? (
                        <div className="bg-secondary border border-primary rounded-[3rem] p-10 min-h-[600px] shadow-2xl relative overflow-hidden transition-colors duration-500">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[100px] pointer-events-none" style={{ backgroundColor: 'var(--accent-color)', opacity: 0.1 }} />
                           <div className="flex items-center justify-between mb-10">
                              <div>
                                 <h2 className="text-4xl font-black uppercase italic tracking-tighter text-primary mb-2">{activePlaylist.name}</h2>
                                 <span className="bg-accent/20 text-accent text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-accent/30" style={{ color: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>MACFEED COLLECTION</span>
                              </div>
                              {activePlaylist.videos.length > 0 && (
                                <button onClick={() => navigate(`/watch/${activePlaylist.videos[0].id}`)} className="flex items-center gap-3 bg-primary text-primary px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-accent hover:text-white transition-all shadow-xl">
                                  <Play className="w-5 h-5 fill-current" /> PLAY COLLECTION
                                </button>
                              )}
                           </div>
                           <div className="grid grid-cols-1 gap-4">
                              {activePlaylist.videos.map((v, i) => (
                                <div key={v.id} onClick={() => navigate(`/watch/${v.id}`)} className="flex items-center gap-6 p-4 rounded-3xl hover:bg-primary/5 transition-all group cursor-pointer border border-transparent hover:border-primary">
                                   <div className="text-secondary font-black italic text-2xl w-10 text-center opacity-30">{i+1}</div>
                                   <div className="w-32 aspect-video rounded-2xl overflow-hidden shrink-0 border border-primary">
                                      <img src={v.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <h4 className="text-primary font-black uppercase italic tracking-tight text-lg truncate group-hover:text-accent transition-colors">{v.title}</h4>
                                      <p className="text-secondary text-[9px] font-black uppercase tracking-[0.2em] mt-1">{v.category}</p>
                                   </div>
                                   <button onClick={(e) => { e.stopPropagation(); removeVideoFromPlaylist(user.id, activePlaylist.id, v.id); setActivePlaylist({...activePlaylist, videos: activePlaylist.videos.filter(vid => vid.id !== v.id)}); }} className="p-3 text-secondary hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><X className="w-5 h-5" /></button>
                                </div>
                              ))}
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[600px] border border-dashed border-primary rounded-[3rem] text-secondary">
                           <LayoutGrid className="w-16 h-16 mb-4 opacity-20" />
                           <p className="text-[10px] font-black uppercase tracking-[0.4em]">Select a collection to view its content</p>
                        </div>
                      )}
                   </div>
                 </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
