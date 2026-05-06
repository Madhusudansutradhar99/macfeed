import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import PremiumLoader from '../components/PremiumLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, TrendingUp, Users, X, Plus, ChevronRight, Target, Shield, Zap } from 'lucide-react';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const ACC = '#d31c23';

// API FETCHERS
async function fetchLiveFootball() {
  try {
    const res = await fetch('/api/sports/football/live');
    const json = await res.json();
    return (json.matches || []).map(m => ({
      id: m.id, league: m.league, home_team: m.home_team, away_team: m.away_team, score: m.score, status: 'LIVE', time: m.time
    }));
  } catch { return []; }
}

async function fetchUpcomingFootball() {
  try {
    const options = { method: 'GET', headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com' } };
    const res = await fetch('/api/football/football-popular-leagues', options);
    const json = await res.json();
    return (json.leagues || []).map(l => ({
      id: l.id, strEvent: l.name, dateEvent: 'Premier League', strTime: l.country, strHomeTeam: l.name, strAwayTeam: 'International', status: 'UPCOMING'
    }));
  } catch { return []; }
}

async function getRealFootballPlayer(name) {
  try {
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`);
    const json = await res.json();
    return json.player?.[0] || null;
  } catch { return null; }
}

const FALLBACK_FOOTBALLERS = [
  { name: 'Lionel Messi', role: 'Forward', img: 'https://www.thesportsdb.com/images/media/player/thumb/6m8n7p1511162624.jpg' },
  { name: 'Cristiano Ronaldo', role: 'Forward', img: 'https://www.thesportsdb.com/images/media/player/thumb/5z2v6n1511162744.jpg' },
  { name: 'Kylian Mbappe', role: 'Forward', img: 'https://www.thesportsdb.com/images/media/player/thumb/xk7u3h1511163486.jpg' },
  { name: 'Neymar Jr', role: 'Forward', img: 'https://www.thesportsdb.com/images/media/player/thumb/xuywqu1511163152.jpg' },
  { name: 'Kevin De Bruyne', role: 'Midfielder', img: 'https://www.thesportsdb.com/images/media/player/thumb/7619211522067746.jpg' },
  { name: 'Erling Haaland', role: 'Forward', img: 'https://www.thesportsdb.com/images/media/player/thumb/6t8o8p1511163012.jpg' }
];

export default function FootballPage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [featuredMatch, setFeaturedMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState('STATS');
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const start = Date.now();
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Load timeout')), 8000)
        );

        const dataPromise = Promise.all([
          fetchUpcomingFootball().catch(() => []),
          fetchLiveFootball().catch(() => []),
        ]);

        const [upcoming, live] = await Promise.race([dataPromise, timeoutPromise]);
        
        const all = [...live, ...upcoming];
        const finalMatches = all.length ? all : [
          { id: '1', league: 'Champions League', strHomeTeam: 'Man City', strAwayTeam: 'Real Madrid', status: 'LIVE', score: { home: '2', away: '1' }, time: '65' },
          { id: '2', league: 'Premier League', strHomeTeam: 'Liverpool', strAwayTeam: 'Chelsea', status: 'UPCOMING', dateEvent: 'Today', strTime: '22:00' }
        ];

        setMatches(finalMatches);
        const initial = finalMatches[0];
        setFeaturedMatch(initial);
        loadSquad(initial);
      } catch (err) {
        console.error("Football Load Error:", err);
        setMatches([
          { id: '1', league: 'Champions League', strHomeTeam: 'Man City', strAwayTeam: 'Real Madrid', status: 'LIVE', score: { home: '2', away: '1' }, time: '65' }
        ]);
      } finally {
        const end = Date.now();
        const diff = end - start;
        setLoading(false);
        
      }
    }
    load();
  }, []);

  async function loadSquad(match) {
    try {
      const team1 = match.home_team?.name || match.strHomeTeam;
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?t=${encodeURIComponent(team1)}`);
      const json = await res.json();
      
      let combined = json.player || [];
      if (combined.length < 3) {
        setPlayers(FALLBACK_FOOTBALLERS.map(p => ({
          strPlayer: p.name,
          strThumb: p.img,
          strDescription: 'Elite Global Footballer',
          strNationality: 'International',
          strPosition: p.role
        })));
        return;
      }

      setPlayers(combined.slice(0, 12).map(p => ({
        strPlayer: p.strPlayer,
        strThumb: p.strThumb || p.strCutout || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.strPlayer}`,
        strDescription: p.strDescriptionEN || 'Elite Football Professional',
        strNationality: p.strNationality,
        strPosition: p.strPosition || 'Player'
      })));
    } catch (err) {
      console.error("Squad Load Error:", err);
    }
  }

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <PremiumLoader />;

  return (
    <div className="min-h-screen bg-primary text-primary font-sans overflow-x-hidden pb-10 transition-colors duration-500">
      {/* ── DYNAMIC NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-4 bg-primary/95 backdrop-blur-md border-b border-primary">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sports')} className="p-2 rounded-xl bg-secondary border border-primary hover:bg-primary/10 transition-all text-primary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter uppercase leading-none text-primary">MACFEED <span style={{ color: ACC }}>PRO</span></span>
          </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2 px-4 py-2 bg-red-600/20 rounded-full border border-red-600/30 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-600" />
              <span className="text-[10px] font-black uppercase text-red-500 tracking-widest">LIVE EVENT</span>
           </div>
           <div className="hidden md:flex items-center gap-8 text-[10px] font-black tracking-widest uppercase text-secondary">
             <span onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="hover:text-primary cursor-pointer transition-colors" style={{ color: ACC }}>HOME</span>
             <span onClick={() => scrollTo('matches-section')} className="hover:text-primary cursor-pointer transition-colors">MATCHES</span>
             <span onClick={() => scrollTo('squad-section')} className="hover:text-primary cursor-pointer transition-colors">SQUAD</span>
           </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="relative w-full h-[75vh] flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1600" 
            className="w-full h-full object-cover brightness-[0.2]" alt="" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-transparent to-transparent" />
        </div>

        <div className="relative z-10 w-full px-6 md:px-16">
          {featuredMatch && (
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl">
              <div className="flex items-center gap-4 mb-6">
                <span className={`text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest ${featuredMatch.status === 'LIVE' ? 'bg-red-600 animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)] text-white' : 'bg-blue-600 text-white'}`}>
                  {featuredMatch.status}
                </span>
                <span className="text-secondary text-xs font-black uppercase tracking-widest">{featuredMatch.league || 'International'}</span>
              </div>

              <div className="flex items-center gap-12 md:gap-20 mb-10">
                <div className="flex flex-col">
                  <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-3 text-primary">{featuredMatch.home_team?.name?.split(' ')[0] || featuredMatch.strHomeTeam?.split(' ')[0]}</h2>
                  {featuredMatch.score && <div className="text-6xl font-black text-primary">{featuredMatch.score.home || '2'}</div>}
                </div>
                <div className="text-primary/10 text-4xl font-black italic">VS</div>
                <div className="flex flex-col">
                  <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-3 text-primary">{featuredMatch.away_team?.name?.split(' ')[0] || featuredMatch.strAwayTeam?.split(' ')[0]}</h2>
                  {featuredMatch.score && <div className="text-6xl font-black text-primary">{featuredMatch.score.away || '1'}</div>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5">
                <button onClick={() => setShowStats(true)} style={{ background: ACC }} className="text-white font-black uppercase text-[11px] tracking-widest px-10 py-5 rounded-2xl hover:opacity-90 transition-all shadow-xl">VIEW MATCH HUB</button>
                <button onClick={() => scrollTo('squad-section')} className="bg-secondary text-primary font-black uppercase text-[11px] tracking-widest px-10 py-5 rounded-2xl border border-primary hover:bg-primary/10 transition-all">TEAM SQUAD</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── MATCH CENTER ── */}
      <section className="px-6 md:px-16 py-20" id="matches-section">
        <div className="flex items-center gap-4 mb-12">
           <div className="h-0.5 w-10" style={{ background: ACC }} />
           <h2 className="text-3xl font-black italic uppercase tracking-tighter text-primary">MATCH <span style={{ color: ACC }}>CENTER</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((m, i) => (
            <motion.div key={i} 
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setFeaturedMatch(m); loadSquad(m); window.scrollTo({top:0, behavior:'smooth'}); }}
              className="bg-secondary border border-primary p-6 rounded-[2.5rem] cursor-pointer hover:bg-primary/5 transition-all relative overflow-hidden group shadow-xl hover:shadow-red-600/10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">{m.dateEvent}</span>
                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${m.status === 'LIVE' ? 'bg-red-600 animate-pulse text-white' : 'bg-primary/10 text-secondary'}`}>
                  {m.status}
                </span>
              </div>
              <div className="flex justify-between items-center font-black text-lg uppercase tracking-tighter text-primary">
                <span className="group-hover:text-red-600 transition-colors">{m.strHomeTeam?.split(' ')[0]}</span>
                <span className="text-primary/10 italic text-sm">VS</span>
                <span className="group-hover:text-red-600 transition-colors">{m.strAwayTeam?.split(' ')[0]}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── TEAM SQUAD ── */}
      <section className="px-6 md:px-16 py-20 bg-primary/5" id="squad-section">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none text-primary">TEAM <span style={{ color: ACC }}>SQUAD</span></h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Full Lineup for {featuredMatch?.strHomeTeam || 'Team'}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {players.map((p, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05 }} onClick={() => setSelectedPlayer(p)}
              className="relative group cursor-pointer aspect-[3/4.5] rounded-[2.5rem] overflow-hidden bg-secondary border border-primary shadow-2xl transition-colors duration-500">
              <img src={p.strThumb} className="w-full h-full object-cover brightness-75 group-hover:brightness-110 transition-all duration-700" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-red-600 text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: ACC }}>{p.strPosition}</p>
                <p className="text-base font-black uppercase leading-[0.9] text-white">{p.strPlayer.split(' ')[0]}<br/><span className="text-white/40">{p.strPlayer.split(' ')[1] || ''}</span></p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATS MODAL */}
      <AnimatePresence>
        {showStats && featuredMatch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-secondary w-full max-w-4xl h-[85vh] rounded-[3rem] overflow-hidden flex flex-col border border-primary shadow-2xl">
              <div className="p-8 bg-primary/20 border-b border-primary flex justify-between items-center text-primary">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <h3 className="font-black uppercase tracking-widest text-lg italic">Match Intelligence Hub</h3>
                </div>
                <button onClick={() => setShowStats(false)} className="p-3 bg-primary/5 hover:bg-red-600 rounded-full transition-all group">
                   <X className="w-7 h-7 text-primary" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar text-primary">
                <div className="p-8 bg-primary/5 rounded-3xl mb-10 text-center border border-primary">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-secondary mb-4">Current Scoreline</p>
                  <h4 className="text-6xl font-black text-primary mb-2" style={{ color: ACC }}>2 - 1</h4>
                  <p className="text-xs font-bold opacity-40 uppercase tracking-[0.2em] text-secondary">65' • Champions League • Second Half</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PLAYER MODAL */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="relative w-full max-w-5xl bg-secondary rounded-[3rem] overflow-hidden flex flex-col md:flex-row border border-primary shadow-2xl">
              <button onClick={() => setSelectedPlayer(null)} className="absolute top-8 right-8 z-50 p-3 bg-primary/5 hover:bg-primary/10 rounded-full transition-all text-primary"><X className="w-6 h-6" /></button>
              <div className="w-full md:w-5/12 aspect-[4/5]"><img src={selectedPlayer.strThumb} className="w-full h-full object-cover" alt="" /></div>
              <div className="flex-1 p-10 md:p-16 flex flex-col justify-center text-primary">
                 <span className="font-black text-xs uppercase tracking-[0.4em] mb-6" style={{ color: ACC }}>{selectedPlayer.strPosition}</span>
                 <h2 className="text-5xl md:text-7xl font-black italic uppercase leading-none mb-10">{selectedPlayer.strPlayer}</h2>
                 <p className="text-secondary text-base md:text-lg leading-relaxed mb-12 font-medium italic overflow-y-auto max-h-40 pr-4 custom-scrollbar">
                   {selectedPlayer.strDescription.slice(0, 400)}...
                 </p>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-primary/5 p-6 rounded-3xl text-center border border-primary"><p className="text-[9px] opacity-30 font-black uppercase mb-2 tracking-widest text-secondary">Nationality</p><p className="text-xl font-black uppercase italic text-primary">{selectedPlayer.strNationality}</p></div>
                    <div className="bg-primary/5 p-6 rounded-3xl text-center border border-primary"><p className="text-[9px] opacity-30 font-black uppercase mb-2 tracking-widest text-secondary">Status</p><p className="text-xl font-black uppercase" style={{ color: ACC }}>World Class</p></div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


