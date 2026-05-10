import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Star,
  Pin,
  X,
  Plus,
  BarChart3,
  Upload,
  ImageIcon,
  Link2,
  Tag,
  Clock,
  Film,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Megaphone,
  Check,
  AlertTriangle,
  Shield,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  'Movies',
  'Series',
  'Music',
  'Shorts',
  'Gaming',
  'Comedy',
  'Sports',
  'Vlogs',
  'Cartoon',
  'News',
  'Viral',
];
const AD_POSITIONS = ['bottom-right', 'banner', 'top'];

const inputCls =
  'w-full px-3 py-2.5 rounded-xl bg-secondary border border-primary text-primary placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm';
const labelCls = 'text-xs font-semibold text-secondary uppercase tracking-wider mb-1 block';

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm font-medium ${
        checked
          ? 'bg-purple-600/20 border-purple-500 text-purple-400'
          : 'bg-secondary border-primary text-secondary'
      }`}
    >
      {checked ? (
        <ToggleRight className="w-5 h-5 text-purple-400" />
      ) : (
        <ToggleLeft className="w-5 h-5" />
      )}
      {label}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-secondary border border-primary rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-primary">{value}</div>
        <div className="text-secondary text-sm">{label}</div>
      </div>
    </div>
  );
}

function VideoForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(
    initial || {
      title: '',
      video_url: '',
      youtube_id: '',
      thumbnail_url: '',
      category: CATEGORIES[0],
      duration: '',
      is_featured: false,
      is_pinned: false,
    }
  );
  const [isExtracting, setIsExtracting] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleAutoFill = async () => {
    if (!form.video_url.includes('youtube.com') && !form.video_url.includes('youtu.be')) return;
    setIsExtracting(true);
    const idMatch = form.video_url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
    );
    if (idMatch && idMatch[1]) {
      const id = idMatch[1];
      set('youtube_id', id);
      set('thumbnail_url', `https://img.youtube.com/vi/${id}/maxresdefault.jpg`);

      // Fetch Title
      try {
        const res = await fetch(
          `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`
        );
        const data = await res.json();
        if (data.title) set('title', data.title);
      } catch (e) {}

      // Fetch Duration
      try {
        const durationSeconds = await new Promise((resolve) => {
          const div = document.createElement('div');
          div.id = `temp-yt-${Date.now()}`;
          div.style.cssText =
            'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none';
          document.body.appendChild(div);
          let player;
          const done = (d) => {
            try {
              player.destroy();
            } catch (e) {}
            try {
              document.body.removeChild(div);
            } catch (e) {}
            resolve(d);
          };
          const init = () => {
            player = new window.YT.Player(div.id, {
              videoId: id,
              playerVars: { autoplay: 0, controls: 0 },
              events: {
                onReady: (e) => {
                  let check = setInterval(() => {
                    const dur = e.target.getDuration();
                    if (dur > 0) {
                      clearInterval(check);
                      done(dur);
                    }
                  }, 100);
                  setTimeout(() => {
                    clearInterval(check);
                    done(0);
                  }, 3000);
                },
                onError: () => done(0),
              },
            });
          };
          if (window.YT && window.YT.Player) init();
          else {
             setTimeout(init, 500);
          }
        });

        if (durationSeconds > 0) {
          const m = Math.floor(durationSeconds / 60);
          const s = Math.floor(durationSeconds % 60);
          set('duration', `${m}:${s.toString().padStart(2, '0')}`);
        }
      } catch (e) {}
    }
    setIsExtracting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ ...form });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Title *</label>
          <input
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Music/Video title"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Category *</label>
          <select
            required
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={labelCls}>
            <Film className="inline w-3 h-3 mr-1" />
            URL (Direct File or YouTube) *
          </label>
          <div className="flex gap-2">
            <input
              required
              value={form.video_url}
              onChange={(e) => set('video_url', e.target.value)}
              placeholder="https://... (mp3, mp4, or youtube link)"
              className={inputCls}
            />
            <button
              type="button"
              onClick={handleAutoFill}
              className="px-4 py-2 bg-red-600/20 text-red-400 rounded-xl border border-red-500/30 text-xs font-bold hover:bg-red-600/30 transition whitespace-nowrap"
            >
              {isExtracting ? '...' : 'Auto-Fill YT'}
            </button>
          </div>
        </div>
        <div>
          <label className={labelCls}>
             Thumbnail URL
          </label>
          <input
            value={form.thumbnail_url}
            onChange={(e) => set('thumbnail_url', e.target.value)}
            placeholder="https://..."
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>
            <Clock className="inline w-3 h-3 mr-1" />
            Duration
          </label>
          <input
            value={form.duration}
            onChange={(e) => set('duration', e.target.value)}
            placeholder="3:45"
            className={inputCls}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {form.category === 'Movies' ? (
          <button
            type="button"
            onClick={() => set('is_featured', !form.is_featured)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 transition-all text-sm font-black shadow-2xl ${
              form.is_featured
                ? 'bg-blue-500/20 border-blue-500 text-blue-300 scale-[1.02]'
                : 'bg-secondary border-primary text-secondary hover:border-blue-500/50'
            }`}
          >
            <Star className={`w-5 h-5 ${form.is_featured ? 'fill-blue-500 text-blue-500' : ''}`} />
            {form.is_featured ? '🎬 ON MOVIE HERO' : 'ADD TO MOVIE HERO'}
          </button>
        ) : (
          <Toggle
            checked={form.is_featured}
            onChange={(v) => set('is_featured', v)}
            label="Add to Top Header Hero"
          />
        )}
        <Toggle checked={form.is_pinned} onChange={(v) => set('is_pinned', v)} label="Pin to Top" />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
        >
          {loading ? (
            'Saving...'
          ) : (
            <>
              <Check className="w-4 h-4" /> Save Music/Video
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl bg-secondary border border-primary hover:bg-white/5 text-primary font-medium transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function YouTubeForm({ initial, onSubmit, onCancel, loading }) {
  const [ytUrl, setYtUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [form, setForm] = useState(
    initial || {
      title: '',
      video_url: '',
      youtube_id: '',
      thumbnail_url: '',
      category: CATEGORIES[0],
      duration: '',
      is_featured: false,
      is_pinned: false,
    }
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const fetchYoutubeDuration = (videoId) => {
    return new Promise((resolve) => {
      const div = document.createElement('div');
      div.id = `hidden-yt-${videoId}`;
      div.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none';
      document.body.appendChild(div);

      let player;
      const cleanup = (dur) => {
        try {
          if (player) player.destroy();
        } catch (e) {}
        try {
          document.body.removeChild(div);
        } catch (e) {}
        resolve(dur);
      };

      const initPlayer = () => {
        player = new window.YT.Player(div.id, {
          height: '10',
          width: '10',
          videoId: videoId,
          playerVars: { autoplay: 0, controls: 0 },
          events: {
            onReady: (e) => {
              let check = setInterval(() => {
                const dur = e.target.getDuration();
                if (dur > 0) {
                  clearInterval(check);
                  cleanup(dur);
                }
              }, 100);
              setTimeout(() => {
                clearInterval(check);
                cleanup(0);
              }, 3000);
            },
            onError: () => cleanup(0),
          },
        });
      };

      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 500);
      } else {
        initPlayer();
      }
    });
  };

  const handleYtExtract = async (url) => {
    setYtUrl(url);
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
    );
    if (match && match[1]) {
      const id = match[1];
      set('youtube_id', id);
      set('video_url', `https://www.youtube.com/embed/${id}`);
      set('thumbnail_url', `https://img.youtube.com/vi/${id}/maxresdefault.jpg`);

      setIsExtracting(true);
      const startTime = Date.now();
      let fullSuccess = false;

      try {
        const res = await fetch(
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`
        );
        const html = await res.text();
        const ytMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/);
        if (ytMatch && ytMatch[1]) {
          const json = JSON.parse(ytMatch[1]);
          const details = json.videoDetails;
          if (details) {
            fullSuccess = true;
            if (details.title) set('title', details.title);
          }
        }
      } catch (e) {}

      if (!fullSuccess) {
        try {
          const res = await fetch(
            `https://api.microlink.io/?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`
          );
          const json = await res.json();
          if (json.status === 'success' && json.data) {
            fullSuccess = true;
            if (json.data.title) set('title', json.data.title);
          }
        } catch (e) {}
      }

      if (!fullSuccess) {
        try {
          const noembed = await fetch(
            `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`
          );
          const ndata = await noembed.json();
          if (ndata && ndata.title) set('title', ndata.title);
        } catch (err) {}
      }

      try {
        const durationSeconds = await fetchYoutubeDuration(id);
        if (durationSeconds > 0) {
          const h = Math.floor(durationSeconds / 3600);
          const m = Math.floor((durationSeconds % 3600) / 60);
          const s = Math.floor(durationSeconds % 60);
          set(
            'duration',
            h > 0
              ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
              : `${m}:${s.toString().padStart(2, '0')}`
          );
        }
      } catch (e) {}

      const elapsed = Date.now() - startTime;
      if (elapsed < 1500) {
        await new Promise((r) => setTimeout(r, 1500 - elapsed));
      }

      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ ...form });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-2">
        <label className={labelCls}>Paste YouTube URL</label>
        <div className="relative">
          <input
            value={ytUrl}
            onChange={(e) => handleYtExtract(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className={`${inputCls} pr-12`}
          />
          {isExtracting && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <div
                className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-red-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
          )}
        </div>
      </div>

      {form.thumbnail_url && (
        <div className="w-full max-w-sm aspect-video bg-black rounded-xl overflow-hidden mb-2">
          <img src={form.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Title *</label>
          <input
            required
            value={isExtracting ? '...' : form.title}
            onChange={(e) => set('title', e.target.value)}
            disabled={isExtracting}
            className={`${inputCls} ${isExtracting ? 'animate-pulse text-purple-400' : ''}`}
          />
        </div>
        <div>
          <label className={labelCls}>Category *</label>
          <select
            required
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Embed URL (Auto)</label>
          <input
            required
            readOnly
            value={form.video_url}
            className={`${inputCls} opacity-50 cursor-not-allowed`}
          />
        </div>
        <div>
          <label className={labelCls}>Thumbnail URL</label>
          <input
            value={form.thumbnail_url}
            onChange={(e) => set('thumbnail_url', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Duration</label>
          <input
            value={isExtracting ? '...' : form.duration}
            onChange={(e) => set('duration', e.target.value)}
            disabled={isExtracting}
            className={`${inputCls} ${isExtracting ? 'animate-pulse text-purple-400' : ''}`}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {form.category === 'Movies' ? (
          <button
            type="button"
            onClick={() => set('is_featured', !form.is_featured)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border-2 transition-all text-sm font-black shadow-2xl ${
              form.is_featured
                ? 'bg-blue-500/20 border-blue-500 text-blue-300 scale-[1.02]'
                : 'bg-secondary border-primary text-secondary hover:border-blue-500/50'
            }`}
          >
            <Star className={`w-5 h-5 ${form.is_featured ? 'fill-blue-500 text-blue-500' : ''}`} />
            {form.is_featured ? '🎬 ON MOVIE HERO' : 'ADD TO MOVIE HERO'}
          </button>
        ) : (
          <Toggle
            checked={form.is_featured}
            onChange={(v) => set('is_featured', v)}
            label="Add to Top Header Hero"
          />
        )}
        <Toggle checked={form.is_pinned} onChange={(v) => set('is_pinned', v)} label="Pin to Top" />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold px-6 py-2.5 rounded-xl transition disabled:opacity-50"
        >
          {loading ? (
            'Saving...'
          ) : (
            <>
              <Check className="w-4 h-4" /> Save YouTube Video
            </>
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl bg-secondary border border-primary hover:bg-white/5 text-primary font-medium transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function Admin() {
  const { user } = useAuth();
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [uploadMode, setUploadMode] = useState('direct');
  const [videos, setVideos] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [adForm, setAdForm] = useState({
    image_url: '',
    link_url: '',
    position: AD_POSITIONS[0],
    is_active: true,
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refreshVideos = async () => {
    const { data } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });
    setVideos(data || []);
  };

  const refreshAds = async () => {
    const { data } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });
    setAds(data || []);
  };

  useEffect(() => {
    if (!authed) return;
    refreshVideos();
    refreshAds();
  }, [authed]);

  const handleLogin = (e) => {
    e.preventDefault();
    // SECURE: Use Email-based authorization. 
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || 'sutradharmadhusudan676@gmail.com').split(',');
    if (user && adminEmails.includes(user.email)) {
      setAuthed(true);
      setPwError(false);
    } else {
      setPwError(true);
      showToast('Unauthorized: You are not an admin', 'error');
    }
  };

  const handleUpload = async (data) => {
    setLoading(true);
    const { data: existing } = await supabase
      .from('videos')
      .select('id')
      .or(
        `video_url.eq.${data.video_url}${data.youtube_id ? `,youtube_id.eq.${data.youtube_id}` : ''}`
      )
      .limit(1);

    if (existing && existing.length > 0) {
      showToast('Video already exists in database!', 'error');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('videos').insert([data]);
    if (error) showToast('Upload failed: ' + error.message, 'error');
    else {
      showToast('Video uploaded!');
      setTab('videos');
      await refreshVideos();
    }
    setLoading(false);
  };

  const handleUpdate = async (formData) => {
    setLoading(true);
    const { id, created_at, tags, ...updateData } = formData;
    const { error } = await supabase.from('videos').update(updateData).eq('id', editing.id);

    if (error) {
      showToast('Update failed: ' + error.message, 'error');
    } else {
      showToast('Video updated!');
      setEditing(null);
      setTab('videos');
      await refreshVideos();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await supabase.from('videos').delete().eq('id', id);
    setDeleteId(null);
    showToast('Video deleted');
    await refreshVideos();
  };

  const handleToggle = async (id, field, val) => {
    await supabase
      .from('videos')
      .update({ [field]: val })
      .eq('id', id);
    await refreshVideos();
  };

  const handleAdSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('ads').insert([adForm]);
    if (error) showToast('Ad failed: ' + error.message, 'error');
    else {
      showToast('Ad added!');
      setAdForm({ image_url: '', link_url: '', position: AD_POSITIONS[0], is_active: true });
      await refreshAds();
    }
  };

  const handleAdToggle = async (id, val) => {
    await supabase.from('ads').update({ is_active: val }).eq('id', id);
    await refreshAds();
  };

  const handleAdDelete = async (id) => {
    await supabase.from('ads').delete().eq('id', id);
    showToast('Ad deleted');
    await refreshAds();
  };

  const stats = {
    total: videos.length,
    views: videos.reduce((a, v) => a + (v.views || 0), 0),
    featured: videos.filter((v) => v.is_featured).length,
  };

  if (!authed)
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary border border-primary p-10 rounded-[3rem] shadow-2xl flex flex-col gap-8 w-full max-w-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Shield className="w-32 h-32 text-accent" style={{ color: 'var(--accent-color)' }} />
          </div>

          <div className="text-center relative z-10">
            <div className="w-20 h-20 bg-accent/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-accent/20" style={{ borderColor: 'var(--accent-color)' }}>
               <Shield className="w-10 h-10 text-accent" style={{ color: 'var(--accent-color)' }} />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter text-primary uppercase leading-none mb-2">Secure Portal</h2>
            <p className="text-secondary text-[10px] font-black uppercase tracking-[0.4em] opacity-60">Admin Identity Verification</p>
          </div>

          <div className="bg-primary/5 border border-primary rounded-3xl p-6 relative z-10">
             <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-3 opacity-40 text-center">Active Identity</p>
             <div className="flex flex-col items-center gap-2">
                <span className="text-primary font-black uppercase italic tracking-tighter text-sm">{user ? user.email : 'NOT SIGNED IN'}</span>
                {!user && <p className="text-red-500 text-[8px] font-black uppercase tracking-widest">Please sign in with Google first</p>}
             </div>
          </div>

          <button 
            onClick={handleLogin}
            disabled={!user}
            className="w-full h-16 font-black uppercase text-[11px] tracking-[0.4em] rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-4 hover:brightness-110 disabled:opacity-50 disabled:grayscale"
            style={{ backgroundColor: 'var(--accent-color)', color: 'var(--bg-primary)' }}
          >
            AUTHORIZE ACCESS <ArrowRight className="w-5 h-5" />
          </button>

          {pwError && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                   <AlertTriangle className="w-4 h-4" /> ACCESS DENIED: UNAUTHORIZED EMAIL
                </p>
             </motion.div>
          )}
        </motion.div>
      </div>
    );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'videos', label: `Videos (${videos.length})`, icon: Film },
    { id: 'ads', label: 'Ad Manager', icon: Megaphone },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl font-medium text-white ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
          <p className="text-secondary text-sm mt-1">MacFeed Content Management</p>
        </div>
        <button
          onClick={() => setAuthed(false)}
          className="text-secondary hover:text-primary text-sm transition"
        >
          Logout
        </button>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${
              tab === t.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-secondary text-secondary hover:text-primary hover:bg-white/10'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Film} label="Total Videos" value={stats.total} color="bg-purple-600" />
            <StatCard
              icon={Eye}
              label="Total Views"
              value={stats.views >= 1000 ? (stats.views / 1000).toFixed(1) + 'K' : stats.views}
              color="bg-blue-600"
            />
            <StatCard icon={Star} label="Featured" value={stats.featured} color="bg-yellow-600" />
            <StatCard
              icon={Megaphone}
              label="Active Ads"
              value={ads.filter((a) => a.is_active).length}
              color="bg-pink-600"
            />
          </div>
          <div className="bg-secondary border border-primary rounded-2xl p-6">
            <h2 className="text-lg font-bold text-primary mb-4">Videos by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <div key={cat} className="bg-primary/5 rounded-xl p-3 text-center border border-primary">
                  <div className="text-2xl font-bold text-purple-400">{videos.filter(v => v.category === cat).length}</div>
                  <div className="text-secondary text-xs mt-1">{cat}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'upload' && (
        <div className="bg-secondary border border-primary rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-bold text-primary flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-400" /> Upload New Video
            </h2>
            <div className="flex bg-primary/10 p-1 rounded-xl">
              <button
                onClick={() => setUploadMode('direct')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${uploadMode === 'direct' ? 'bg-purple-600 text-white' : 'text-secondary hover:text-primary'}`}
              >
                Direct Upload
              </button>
              <button
                onClick={() => setUploadMode('youtube')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${uploadMode === 'youtube' ? 'bg-red-600 text-white' : 'text-secondary hover:text-primary'}`}
              >
                YouTube Embed
              </button>
            </div>
          </div>
          {uploadMode === 'direct' ? (
            <VideoForm
              onSubmit={(data) => handleUpload({ ...data, source: 'direct' })}
              loading={loading}
            />
          ) : (
            <YouTubeForm
              onSubmit={(data) => handleUpload({ ...data, source: 'youtube' })}
              loading={loading}
            />
          )}
        </div>
      )}

      {tab === 'videos' && (
        <div className="bg-secondary border border-primary rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-primary">Manage Videos</h2>
            <button
              onClick={() => setTab('upload')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-primary">
              <thead>
                <tr className="text-secondary text-xs uppercase tracking-wider border-b border-primary">
                  <th className="pb-3 text-left pl-2">Video</th>
                  <th className="pb-3 text-left">Category</th>
                  <th className="pb-3 text-center">Views</th>
                  <th className="pb-3 text-center">Featured</th>
                  <th className="pb-3 text-center">Pinned</th>
                  <th className="pb-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
                  <tr key={v.id} className="border-b border-primary hover:bg-primary/5 transition">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={v.thumbnail_url}
                          alt={v.title}
                          className="w-16 h-10 object-cover rounded-lg flex-shrink-0 bg-primary/20"
                        />
                        <span className="font-medium truncate max-w-[180px]">
                          {v.title}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                       <span className="bg-purple-600/20 text-purple-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit">
                          {v.category}
                        </span>
                    </td>
                    <td className="py-3 text-center text-secondary">{v.views || 0}</td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleToggle(v.id, 'is_featured', !v.is_featured)}
                        className={`p-1.5 rounded-lg transition ${v.is_featured ? 'text-yellow-400 bg-yellow-400/10' : 'text-secondary hover:text-primary'}`}
                      >
                        <Star className={`w-4 h-4 ${v.is_featured ? 'fill-yellow-400' : ''}`} />
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => handleToggle(v.id, 'is_pinned', !v.is_pinned)}
                        className={`p-1.5 rounded-lg transition ${v.is_pinned ? 'text-blue-400 bg-blue-400/10' : 'text-secondary hover:text-primary'}`}
                      >
                        <Pin className={`w-4 h-4 ${v.is_pinned ? 'fill-blue-400' : ''}`} />
                      </button>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditing(v);
                            setTab('edit');
                          }}
                          className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary/10 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(v.id)}
                          className="p-1.5 rounded-lg text-secondary hover:text-red-400 hover:bg-red-400/10 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'edit' && editing && (
        <div className="bg-secondary border border-primary rounded-2xl p-6">
          <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <Edit className="w-5 h-5 text-purple-400" /> Edit Video
          </h2>
          {editing.source === 'youtube' ? (
            <YouTubeForm
              initial={editing}
              onSubmit={handleUpdate}
              onCancel={() => {
                setEditing(null);
                setTab('videos');
              }}
              loading={loading}
            />
          ) : (
            <VideoForm
              initial={editing}
              onSubmit={handleUpdate}
              onCancel={() => {
                setEditing(null);
                setTab('videos');
              }}
              loading={loading}
            />
          )}
        </div>
      )}

      {tab === 'ads' && (
        <div className="flex flex-col gap-6">
          <div className="bg-secondary border border-primary rounded-2xl p-6">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" /> Add New Ad
            </h2>
            <form onSubmit={handleAdSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Image URL *</label>
                <input
                  required
                  value={adForm.image_url}
                  onChange={(e) => setAdForm((f) => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Link URL *</label>
                <input
                  required
                  value={adForm.link_url}
                  onChange={(e) => setAdForm((f) => ({ ...f, link_url: e.target.value }))}
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Position</label>
                <select
                  value={adForm.position}
                  onChange={(e) => setAdForm((f) => ({ ...f, position: e.target.value }))}
                  className={inputCls}
                >
                  {AD_POSITIONS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Toggle
                  checked={adForm.is_active}
                  onChange={(v) => setAdForm((f) => ({ ...f, is_active: v }))}
                  label="Active"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold px-6 py-2.5 rounded-xl hover:from-purple-500 hover:to-pink-500 transition"
                >
                  + Add Ad
                </button>
              </div>
            </form>
          </div>

          <div className="bg-secondary border border-primary rounded-2xl p-6">
            <h2 className="text-xl font-bold text-primary mb-4">All Ads ({ads.length})</h2>
            <div className="flex flex-col gap-3">
              {ads.map((ad) => (
                <div key={ad.id} className="flex items-center gap-4 bg-primary/5 rounded-xl p-3 border border-primary">
                  <img
                    src={ad.image_url}
                    alt=""
                    className="w-20 h-12 object-cover rounded-lg bg-primary/20 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <a
                      href={ad.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-sm truncate block hover:underline"
                    >
                      {ad.link_url}
                    </a>
                    <span className="text-xs text-secondary">{ad.position}</span>
                  </div>
                  <button
                    onClick={() => handleAdToggle(ad.id, !ad.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${ad.is_active ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-secondary'}`}
                  >
                    {ad.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleAdDelete(ad.id)}
                    className="text-secondary hover:text-red-400 transition p-1.5 rounded-lg hover:bg-red-400/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-secondary border border-primary rounded-2xl p-8 w-80 flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-primary">Delete Video?</h3>
                <p className="text-secondary text-sm mt-1">This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
