import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';

const mockCricketResults = [
  { home: 'India',    homeScore: 287, awayScore: 201, away: 'Australia', homeLogo: '🏏', awayLogo: '🏏' },
  { home: 'Pakistan', homeScore: 198, awayScore: 210, away: 'England',   homeLogo: '🏏', awayLogo: '🏏' },
  { home: 'Mumbai',   homeScore: 176, awayScore: 145, away: 'Chennai',   homeLogo: '🏏', awayLogo: '🏏' },
  { home: 'RCB',      homeScore: 210, awayScore: 208, away: 'KKR',       homeLogo: '🏏', awayLogo: '🏏' },
];
const mockFootballResults = [
  { home: 'Chelsea', homeScore: 1, awayScore: 3, away: 'Spurs',     homeLogo: '🔵', awayLogo: '⚪' },
  { home: 'Everton', homeScore: 1, awayScore: 3, away: 'Man City',  homeLogo: '🔵', awayLogo: '🩵' },
  { home: 'Arsenal', homeScore: 3, awayScore: 0, away: 'Watford',   homeLogo: '🔴', awayLogo: '🟡' },
  { home: 'Man Utd', homeScore: 2, awayScore: 1, away: 'Liverpool', homeLogo: '🔴', awayLogo: '🔴' },
];
const mockTable = [
  { pos: 1, team: 'Man City',  gd: 32, pts: 66, highlight: false },
  { pos: 2, team: 'Man Utd',   gd: 32, pts: 71, highlight: true  },
  { pos: 3, team: 'Liverpool', gd: 33, pts: 67, highlight: false  },
];
const mockNews = [
  { title: 'Star Player Breaks Season Record',      time: '2 hours ago' },
  { title: 'Team Announces Squad for Next Series',  time: '5 hours ago' },
  { title: 'Coach Praises Player Performance',      time: '1 day ago'   },
  { title: 'Injury Update: Full Recovery Expected', time: '2 days ago'  },
];

function getCricketSkills(position, runs) {
  const pos = (position || '').toLowerCase();
  if (pos.includes('bat')) return [
    { label: 'Batting',  pct: Math.min(90 + Math.floor(runs / 15), 99), color: '#facc15' },
    { label: 'Bowling',  pct: 22, color: '#60a5fa' },
    { label: 'Fielding', pct: 75, color: '#34d399' },
    { label: 'Keeping',  pct: 18, color: '#f472b6' },
  ];
  if (pos.includes('bowl')) return [
    { label: 'Batting',  pct: 28, color: '#facc15' },
    { label: 'Bowling',  pct: Math.min(88 + Math.floor(runs / 10), 99), color: '#60a5fa' },
    { label: 'Fielding', pct: 70, color: '#34d399' },
    { label: 'Economy',  pct: 85, color: '#f472b6' },
  ];
  if (pos.includes('all')) return [
    { label: 'Batting',  pct: 78, color: '#facc15' },
    { label: 'Bowling',  pct: 80, color: '#60a5fa' },
    { label: 'Fielding', pct: 82, color: '#34d399' },
    { label: 'Stamina',  pct: 90, color: '#f472b6' },
  ];
  if (pos.includes('keep') || pos.includes('wicket')) return [
    { label: 'Batting',  pct: 65, color: '#facc15' },
    { label: 'Bowling',  pct: 10, color: '#60a5fa' },
    { label: 'Keeping',  pct: 95, color: '#34d399' },
    { label: 'Reflexes', pct: 92, color: '#f472b6' },
  ];
  return [
    { label: 'Batting',  pct: 60, color: '#facc15' },
    { label: 'Bowling',  pct: 60, color: '#60a5fa' },
    { label: 'Fielding', pct: 65, color: '#34d399' },
    { label: 'Fitness',  pct: 75, color: '#f472b6' },
  ];
}

function getFootballSkills(position, goals) {
  const pos = (position || '').toLowerCase();
  if (pos.includes('forward') || pos.includes('striker')) return [
    { label: 'Shooting',  pct: Math.min(88 + Math.floor(goals / 5), 99), color: '#d31c23' },
    { label: 'Pace',      pct: 85, color: '#facc15' },
    { label: 'Dribbling', pct: 80, color: '#60a5fa' },
    { label: 'Defending', pct: 30, color: '#34d399' },
  ];
  if (pos.includes('mid')) return [
    { label: 'Passing',  pct: 93, color: '#d31c23' },
    { label: 'Vision',   pct: Math.min(85 + Math.floor(goals / 3), 99), color: '#facc15' },
    { label: 'Stamina',  pct: 88, color: '#60a5fa' },
    { label: 'Shooting', pct: 70, color: '#34d399' },
  ];
  if (pos.includes('defend')) return [
    { label: 'Defending', pct: Math.min(90 + Math.floor(goals / 2), 99), color: '#d31c23' },
    { label: 'Tackling',  pct: 91, color: '#facc15' },
    { label: 'Heading',   pct: 85, color: '#60a5fa' },
    { label: 'Pace',      pct: 72, color: '#34d399' },
  ];
  if (pos.includes('goal') || pos.includes('keeper')) return [
    { label: 'Reflexes', pct: 95, color: '#d31c23' },
    { label: 'Handling', pct: 93, color: '#facc15' },
    { label: 'Kicking',  pct: 80, color: '#60a5fa' },
    { label: 'Diving',   pct: 92, color: '#34d399' },
  ];
  return [
    { label: 'Pace',      pct: 75, color: '#d31c23' },
    { label: 'Passing',   pct: 75, color: '#facc15' },
    { label: 'Shooting',  pct: 72, color: '#60a5fa' },
    { label: 'Defending', pct: 70, color: '#34d399' },
  ];
}

function SkillBar({ label, pct, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/50 text-[10px] uppercase tracking-wider font-bold w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}88` }}
        />
      </div>
      <span className="text-white font-black text-xs w-8 text-right">{pct}</span>
    </div>
  );
}

export default function PlayerDetailModal({ player, sport, accentColor, onClose, onPrev, onNext }) {
  if (!player) return null;

  const isFootball = sport === 'football';
  const acc = accentColor || (isFootball ? '#d31c23' : '#facc15');

  const playerName  = player.strPlayer || player.name || 'Player';
  const position    = player.strPosition || player.role || 'Athlete';
  const nationality = player.strNationality || 'Unknown';
  const goals       = player.intScoredGoals || player.score || 30;
  const assists     = player.intAssists || Math.floor(goals * 0.6);
  const matches     = player.intAppearances || goals + assists + 10;
  const thumb       = player.strThumb || player.strCutout || null;

  const skills    = isFootball ? getFootballSkills(position, goals) : getCricketSkills(position, goals);
  const bestSkill = [...skills].sort((a, b) => b.pct - a.pct)[0];
  const overall   = Math.round(skills.reduce((a, s) => a + s.pct, 0) / skills.length);
  const results   = isFootball ? mockFootballResults : mockCricketResults;

  const quotes = [
    `«The Invincible One» ${playerName}'s Stats Are Simply Stunning`,
    `«A True Legend» ${playerName} Dominates the ${isFootball ? 'Pitch' : 'Crease'}`,
    `«World Class» ${playerName} Sets New Records This Season`,
  ];
  const quote = quotes[Math.floor(playerName.length % 3)];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
        style={{ background: 'rgba(0,0,0,0.92)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="relative w-full max-w-6xl bg-[#12121e] rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.9)] my-4"
          onClick={e => e.stopPropagation()}
        >
          {/* TOP NAV */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0e0e1a]">
            <span className="font-black text-white text-lg tracking-tight">MACFEED <span style={{ color: acc }}>SPORTS</span></span>
            <div className="hidden md:flex items-center gap-8 text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">
              {(isFootball ? ['NFL','NBA','MLB','SOCCER'] : ['IPL','T20','TEST','ODI']).map(l => (
                <span key={l} className="hover:text-white cursor-pointer transition-colors">{l}</span>
              ))}
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* MAIN */}
          <div className="flex" style={{ minHeight: '500px' }}>

            {/* CENTER */}
            <div className="flex-1 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                style={{ width: '380px', height: '380px', background: `radial-gradient(circle, ${acc}44 0%, ${acc}11 55%, transparent 75%)`, boxShadow: `0 0 100px ${acc}33` }} />

              <div className="absolute top-0 left-0 right-0 bottom-16 flex items-center justify-center">
                {thumb ? (
                  <img src={thumb} className="h-[320px] object-contain drop-shadow-2xl z-10 relative" alt={playerName} onError={e => { e.target.style.display='none'; }} />
                ) : (
                  <div className="text-[8rem] select-none z-10 relative" style={{ filter: `drop-shadow(0 20px 40px ${acc}66)` }}>
                    {isFootball ? '⚽' : '🏏'}
                  </div>
                )}
              </div>

              {/* Team Badges */}
              <div className="absolute top-5 left-8 flex items-center gap-4 z-20">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-lg">{isFootball ? '⚽' : '🏏'}</div>
                  <span className="text-white/50 text-[9px] font-bold">41%</span>
                </div>
                <div className="h-7 w-px bg-white/20" />
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg" style={{ borderColor: acc, background: `${acc}22` }}>{isFootball ? '🔴' : '🟡'}</div>
                  <span className="text-[9px] font-bold" style={{ color: acc }}>55%</span>
                </div>
              </div>

              {/* Best Skill Badge */}
              <div className="absolute top-5 right-6 z-20">
                <span className="text-[9px] text-white/40 font-black uppercase tracking-widest block text-right mb-1">Best At</span>
                <div className="px-3 py-1.5 rounded-full font-black text-xs uppercase tracking-wide text-right" style={{ background: `${bestSkill.color}22`, color: bestSkill.color, border: `1px solid ${bestSkill.color}44` }}>
                  🏆 {bestSkill.label}
                </div>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 px-8 pb-5 z-20 bg-gradient-to-t from-[#12121e] via-[#12121e]/80 to-transparent pt-16">
                <h2 className="text-white text-lg font-black leading-tight max-w-xs mb-1">{quote}</h2>
                <p className="text-white/40 text-xs max-w-xs leading-relaxed mb-3">
                  {playerName} excels in {bestSkill.label.toLowerCase()}, making them one of the most impactful {position.toLowerCase()}s this season.
                </p>
                <div className="flex items-center gap-6 mb-3">
                  {[
                    { label: isFootball ? 'Goals' : 'Runs',   value: goals   },
                    { label: isFootball ? 'Assists' : 'Wkts', value: assists },
                    { label: 'Matches',                        value: matches },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-white font-black text-2xl leading-none">{s.value}</p>
                      <p className="text-white/40 text-[9px] uppercase tracking-widest mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest" style={{ color: acc }}>
                  READ MORE <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <button onClick={onPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4 text-white" />
              </button>
              <button onClick={onNext} className="absolute left-14 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/10 transition-colors">
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="hidden md:flex flex-col w-72 border-l border-white/10 overflow-y-auto bg-[#0e0e1a]" style={{ maxHeight: '580px' }}>

              {/* Player Info */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                    {thumb ? <img src={thumb} className="w-full h-full rounded-full object-cover" alt="" onError={e => e.target.style.display='none'} /> : (isFootball ? '⚽' : '🏏')}
                  </div>
                  <div>
                    <p className="text-white font-black text-sm leading-tight">{playerName}</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest">{position}</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded mt-1 inline-block" style={{ color: acc, background: `${acc}22` }}>{nationality}</span>
                  </div>
                </div>
              </div>

              {/* SKILL BREAKDOWN */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white font-black text-xs uppercase tracking-widest">
                    {isFootball ? '⚽ Skill Ratings' : '🏏 Speciality Ratings'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/40 text-[9px] uppercase">OVR</span>
                    <span className="font-black text-xl" style={{ color: acc }}>{overall}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {skills.map(s => <SkillBar key={s.label} {...s} />)}
                </div>
              </div>

              {/* Results */}
              <div className="p-4 border-b border-white/5">
                <p className="text-white font-black text-xs uppercase tracking-widest mb-3">Recent Results</p>
                <div className="flex flex-col gap-2">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] py-1 hover:bg-white/5 px-1 rounded cursor-pointer">
                      <div className="flex items-center gap-1.5 w-[80px]"><span>{r.homeLogo}</span><span className="text-white/70 truncate">{r.home}</span></div>
                      <span className="text-white font-black text-[10px]">{r.homeScore} - {r.awayScore}</span>
                      <div className="flex items-center gap-1.5 w-[80px] justify-end"><span className="text-white/70 truncate">{r.away}</span><span>{r.awayLogo}</span></div>
                    </div>
                  ))}
                </div>
                <button className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest" style={{ color: acc }}>
                  VIEW ALL <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* League Table */}
              <div className="p-4">
                <p className="text-white font-black text-xs uppercase tracking-widest mb-3">{isFootball ? 'Premier League' : 'IPL 2025'}</p>
                {mockTable.map((row, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded mb-1 text-[11px] cursor-pointer text-white/60 hover:bg-white/5"
                    style={row.highlight ? { background: acc, color: '#fff' } : {}}>
                    <span className="w-5 font-black">{row.pos}</span>
                    <span className="flex-1 font-bold">{row.team}</span>
                    <span className="w-6 text-right">{row.gd}</span>
                    <span className="w-6 text-right font-black">{row.pts}</span>
                  </div>
                ))}
                <button className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest" style={{ color: acc }}>
                  FULL TABLE <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* BOTTOM NEWS BAR */}
          <div className="border-t border-white/10 bg-[#0e0e1a] grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {mockNews.map((n, i) => (
              <div key={i} className="px-4 py-3 cursor-pointer hover:bg-white/5 group">
                <p className="text-white/30 text-[9px] uppercase tracking-widest mb-1">Sports · {n.time}</p>
                <p className="text-white text-[11px] font-bold leading-tight line-clamp-2 group-hover:opacity-80 transition-opacity">{n.title}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
