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
import { Filesystem } from '@capacitor/filesystem';
import { motion, AnimatePresence } from 'framer-motion';
import SmartYoutubeSearch from '../components/SmartYoutubeSearch';

export default function Playlists() {
  const { user, setAuthModalOpen } = useAuth();
  const { playLocalFile, playLocalSong } = useMusicPlayer();
  const navigate = useNavigate();
  
  const [activeView, setActiveView] = useState('Local');
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [recentLocal, setRecentLocal] = useState([]);
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const fileRegistry = useRef(new Map());

  useEffect(() => {
    if (user) {
      setPlaylists(getPlaylists(user.id));
    } else {
      setPlaylists([]);
      setActivePlaylist(null);
    }
    const localMeta = JSON.parse(localStorage.getItem('macfeed_recent_local') || '[]');
    setRecentLocal(localMeta);
  }, [user]);

  const clearRecent = () => {
    localStorage.removeItem('macfeed_recent_local');
    setRecentLocal([]);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files ? e.target.files[0] : (e.dataTransfer ? e.dataTransfer.files[0] : null);
    if (file) {
      const newMeta = {
        id: Date.now(),
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        date: new Date().toLocaleDateString()
      };
      fileRegistry.current.set(file.name, file);
      const updated = [newMeta, ...recentLocal.filter(f => f.name !== file.name)].slice(0, 8);
      localStorage.setItem('macfeed_recent_local', JSON.stringify(updated));
      setRecentLocal(updated);
      
      // Also add to permanent history for Downloads page
      const history = JSON.parse(localStorage.getItem('macfeed_local_history') || '[]');
      const entry = {
        id: newMeta.id,
        title: file.name,
        name: file.name,
        lastPlayed: Date.now(),
        source: 'local',
        path: file.path || null
      };
      const filtered = history.filter(h => h.name !== entry.name);
      filtered.unshift(entry);
      localStorage.setItem('macfeed_local_history', JSON.stringify(filtered.slice(0, 50)));

      playLocalFile(file);
      
      // Clear input to allow re-selection of the same file
      if (e.target) e.target.value = '';
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e);
  };

  const handleRecentPlay = (fileMeta) => {
    // If it has a path (Capacitor), use that
    if (fileMeta.path) {
        playLocalSong(fileMeta);
        return;
    }
    const actualFile = fileRegistry.current.get(fileMeta.name);
    if (actualFile) {
      playLocalFile(actualFile);
    } else {
      alert(`Accessing Archive: Please re-select "${fileMeta.name}" to restore file handle.`);
      // Fallback for recent play after refresh
      fileInputRef.current?.click();
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
    <>
       {/* ── MESH BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-50 dark:opacity-100">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[150px] animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/15 blur-[200px]" />
         <div className="absolute top-[30%] left-[40%] w-[20%] h-[20%] bg-accent/10 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-12 relative z-[100] pointer-events-auto">
        
        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div className="relative">
             <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-12 bg-accent rounded-full shadow-[0_0_20px_var(--accent-color)]" />
              <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.8] mb-2">
                <span className="text-primary">MACFEED</span><br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-purple-500 to-blue-400">LIBRARY</span>
              </h1>
              <p className="text-secondary opacity-30 text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] ml-1">
                 LOCAL MEDIA & GLOBAL PLAYLISTS
              </p>
          </div>

            <div className="flex bg-secondary backdrop-blur-3xl p-1 rounded-2xl border border-primary shadow-2xl w-full md:w-auto">
              {['Local', 'Playlists', 'Smart'].map((view) => (
                <button 
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group ${activeView === view ? 'text-primary' : 'text-secondary/40 hover:text-primary'}`}
                >
                  {activeView === view && (
                    <motion.div layoutId="nav-bg" className="absolute inset-0 bg-primary/10 dark:bg-white/10" />
                  )}
                  <span className="relative z-10">{view}</span>
                </button>
              ))}
           </div>
        </div>

        <AnimatePresence mode="wait">
          {activeView === 'Local' ? (
            <motion.div 
              key="local" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-24"
            >
             <div 
               onDragOver={onDragOver}
               onDragLeave={onDragLeave}
               onDrop={onDrop}
               className="relative w-full aspect-[2/1] md:aspect-[32/10] group cursor-pointer"
             >
               <input 
                 type="file" 
                 ref={fileInputRef}
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" 
                 accept="video/*,audio/*,.mkv,.ts,.m3u8,.mp4,.mp3,.webm" 
                 onChange={handleFileSelect} 
               />

               <div 
                 className={`relative w-full h-full bg-secondary/20 border rounded-[2.5rem] md:rounded-[5rem] flex flex-col items-center justify-center transition-all duration-1000 overflow-hidden shadow-2xl ${isDragging ? 'bg-accent/10 border-accent' : 'border-primary hover:bg-secondary/40 hover:border-accent/40'}`}
               >
                  <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent)] pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center text-center px-6 pointer-events-none">
                     <div className="relative mb-6 md:mb-10">
                        <div className={`w-16 h-16 md:w-32 md:h-32 rounded-[1.5rem] md:rounded-[3.5rem] bg-secondary border border-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-accent group-hover:text-white transition-all duration-1000 group-hover:rotate-[15deg] group-hover:shadow-[0_0_80px_rgba(var(--accent-rgb),0.4)] ${isDragging ? 'bg-accent text-white rotate-[15deg]' : 'text-primary'}`}>
                           <Upload className="w-6 h-6 md:w-12 md:h-12" />
                        </div>
                     </div>
                     
                     <h2 className="text-2xl md:text-5xl font-black uppercase italic tracking-tighter text-primary mb-2">
                        OPEN <span className="text-accent underline decoration-primary/10 underline-offset-8">LOCAL</span> MEDIA
                     </h2>
                     <p className="text-secondary opacity-30 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] max-w-xl leading-relaxed">
                        {isDragging ? 'RELEASE TO INITIALIZE' : 'DRAG & DROP VIDEO FILES HERE OR CLICK TO BROWSE'}
                     </p>
                  </div>
               </div>
             </div>

              <div className="relative">
                 <div className="flex items-center justify-between gap-6 mb-10">
                    <h3 className="text-[12px] font-black uppercase tracking-[0.6em] text-accent italic flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-accent animate-ping" /> Recent Archives
                    </h3>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                       {recentLocal.length > 0 && (
                          <button 
                            onClick={clearRecent}
                            className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-red-500/10 text-secondary hover:text-red-500 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border border-primary"
                          >
                             <Trash2 className="w-3 h-3" /> Clear
                          </button>
                       )}
                    </div>
                 </div>

                 {recentLocal.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-32 border border-primary rounded-[4rem] bg-secondary/20 backdrop-blur-sm">
                      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-8 opacity-20 border border-primary">
                         <HardDrive className="w-10 h-10 text-primary" />
                      </div>
                      <p className="text-secondary opacity-15 text-[11px] font-black uppercase tracking-[0.6em]">System Database Empty</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                      {recentLocal.map((file, idx) => (
                        <motion.div 
                          key={file.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                          whileHover={{ y: -10, scale: 1.02 }}
                          className="bg-secondary/40 backdrop-blur-3xl border border-primary rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 group cursor-pointer hover:border-accent/40 transition-all duration-500 shadow-2xl relative overflow-hidden"
                          onClick={() => handleRecentPlay(file)}
                        >
                           <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           
                           <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] bg-secondary border border-primary flex items-center justify-center mb-6 md:mb-10 group-hover:bg-accent/10 group-hover:border-accent/30 group-hover:text-accent transition-all duration-700">
                             <Film className="w-7 h-7 md:w-9 md:h-9 text-primary group-hover:text-accent" />
                           </div>
                           
                           <h4 className="text-primary font-black uppercase italic text-sm md:text-lg line-clamp-2 leading-[1.1] mb-6 md:mb-8 group-hover:text-accent transition-colors tracking-tight">
                              {file.name}
                           </h4>
                           
                           <div className="flex items-center justify-between border-t border-primary pt-6 md:pt-8">
                              <div className="flex flex-col gap-1">
                                 <span className="text-[7px] md:text-[9px] font-black text-secondary opacity-30 uppercase tracking-widest">Weight</span>
                                 <span className="text-[8px] md:text-[10px] font-black text-secondary uppercase tracking-widest">{file.size}</span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                 <span className="text-[7px] md:text-[9px] font-black text-secondary opacity-30 uppercase tracking-widest">Logged</span>
                                 <span className="text-[8px] md:text-[10px] font-black text-secondary uppercase tracking-widest">{file.date}</span>
                              </div>
                           </div>
                        </motion.div>
                      ))}
                   </div>
                 )}
              </div>
            </motion.div>
          ) : activeView === 'Smart' ? (
            <motion.div key="smart" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
               <SmartYoutubeSearch />
            </motion.div>
          ) : (
            <motion.div 
              key="playlists" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            >
              {!user ? (
                 <div className="flex flex-col items-center justify-center py-40 text-center border border-primary rounded-[5rem] bg-secondary/20 backdrop-blur-sm">
                   <LayoutGrid className="w-20 h-20 text-secondary opacity-10 mb-8" />
                   <h2 className="text-4xl font-black uppercase italic tracking-tighter text-primary mb-6">Cloud Sync Restricted</h2>
                   <p className="text-secondary opacity-30 text-[11px] font-black uppercase tracking-[0.4em] mb-10">Sign in to unlock global collections</p>
                   <button onClick={() => setAuthModalOpen(true)} className="bg-accent hover:opacity-90 text-white px-14 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] transition-all shadow-[0_0_50px_rgba(var(--accent-rgb),0.3)] hover:scale-105 active:scale-95">Identify Account</button>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                   <div className="lg:col-span-4 space-y-8">
                      <form onSubmit={handleCreate} className="relative group">
                         <input 
                           type="text" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)}
                           placeholder="NEW ARCHIVE NAME..."
                           className="w-full bg-secondary border border-primary rounded-[2rem] px-8 py-5 text-[11px] font-black uppercase tracking-widest text-primary focus:outline-none focus:border-accent transition-all placeholder:text-secondary opacity-50"
                         />
                         <button type="submit" className="absolute right-2 top-2 bottom-2 bg-accent text-white px-6 rounded-2xl transition-all hover:bg-white hover:text-black shadow-xl"><Plus className="w-5 h-5" /></button>
                      </form>
                      
                      <div className="space-y-4">
                         {playlists.map(p => (
                           <div 
                             key={p.id} onClick={() => setActivePlaylist(p)}
                             className={`p-8 rounded-[2.5rem] cursor-pointer transition-all border flex items-center justify-between group relative overflow-hidden ${activePlaylist?.id === p.id ? 'bg-secondary text-primary border-accent shadow-2xl scale-[1.02]' : 'bg-secondary/40 border-primary hover:border-accent/40'}`}
                           >
                              <div className="relative z-10">
                                 <div className={`font-black uppercase italic tracking-tighter text-2xl text-primary`}>{p.name}</div>
                                 <div className={`text-[10px] font-black uppercase tracking-widest mt-2 text-secondary opacity-40`}>{p.videos.length} SEGMENTS</div>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); deletePlaylist(user.id, p.id); setPlaylists(getPlaylists(user.id)); }} className={`p-3 rounded-xl transition-all opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-secondary hover:text-red-500`}><Trash2 className="w-5 h-5" /></button>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="lg:col-span-8">
                      {activePlaylist ? (
                        <div className="bg-secondary/20 border border-primary rounded-[4rem] p-12 min-h-[700px] shadow-2xl relative overflow-hidden backdrop-blur-3xl">
                           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent/5 blur-[150px] pointer-events-none" />
                           
                           <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                              <div>
                                 <span className="text-accent text-[10px] font-black uppercase tracking-[0.5em] mb-4 block italic">Collection Profile</span>
                                 <h2 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter text-primary leading-none">{activePlaylist.name}</h2>
                              </div>
                              {activePlaylist.videos.length > 0 && (
                                <button onClick={() => navigate(`/watch/${activePlaylist.videos[0].id}`)} className="flex items-center gap-4 bg-accent text-white px-10 py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:brightness-110 transition-all shadow-[0_20px_40px_rgba(var(--accent-rgb),0.2)] hover:scale-105 active:scale-95">
                                  <Play className="w-5 h-5 fill-current" /> Initialize Playback
                                </button>
                              )}
                           </div>

                           <div className="grid grid-cols-1 gap-6">
                              {activePlaylist.videos.map((v, i) => (
                                <div key={v.id} onClick={() => navigate(`/watch/${v.id}`)} className="flex items-center gap-8 p-6 rounded-[2.5rem] hover:bg-secondary/40 transition-all group cursor-pointer border border-transparent hover:border-primary">
                                   <div className="text-primary opacity-10 font-black italic text-4xl w-14 text-center group-hover:text-accent transition-colors">{String(i+1).padStart(2, '0')}</div>
                                   <div className="w-44 aspect-video rounded-[1.5rem] overflow-hidden shrink-0 border border-primary relative">
                                      <img src={v.thumbnail_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <Play className="w-8 h-8 text-white fill-white" />
                                      </div>
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <h4 className="text-primary font-black uppercase italic tracking-tight text-xl truncate group-hover:text-accent transition-colors">{v.title}</h4>
                                      <div className="flex items-center gap-4 mt-2">
                                         <span className="text-secondary opacity-30 text-[10px] font-black uppercase tracking-widest">{v.category}</span>
                                         <div className="w-1 h-1 rounded-full bg-secondary" />
                                         <span className="text-accent text-[9px] font-black uppercase tracking-widest italic">Ready to Stream</span>
                                      </div>
                                   </div>
                                   <button onClick={(e) => { e.stopPropagation(); removeVideoFromPlaylist(user.id, activePlaylist.id, v.id); setActivePlaylist({...activePlaylist, videos: activePlaylist.videos.filter(vid => vid.id !== v.id)}); }} className="p-4 rounded-2xl hover:bg-red-500/10 text-secondary opacity-10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><X className="w-6 h-6" /></button>
                                </div>
                              ))}
                              {activePlaylist.videos.length === 0 && (
                                <div className="py-20 text-center opacity-20">
                                   <LayoutGrid className="w-12 h-12 mx-auto mb-4" />
                                   <p className="text-[10px] font-black uppercase tracking-widest text-primary">No Items in Archive</p>
                                </div>
                              )}
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[700px] border border-dashed border-primary rounded-[4rem] text-primary opacity-10">
                           <LayoutGrid className="w-20 h-20 mb-8 opacity-20" />
                           <p className="text-[11px] font-black uppercase tracking-[0.6em]">Initialize archive selection</p>
                        </div>
                      )}
                   </div>
                 </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
