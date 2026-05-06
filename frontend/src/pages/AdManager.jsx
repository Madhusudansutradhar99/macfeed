import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Trash2, Check, X, Megaphone, ImageIcon, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';

const positions = ['bottom-right', 'banner', 'top', 'bottom', 'corner'];

const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-secondary border border-primary text-primary placeholder-gray-500 focus:outline-none focus:border-purple-500 transition text-sm';
const labelCls = 'text-xs font-semibold text-secondary uppercase tracking-wider mb-1 block';

export default function AdManager() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState({
    image_url: '',
    link_url: '',
    position: 'banner',
    is_active: true,
  });

  useEffect(() => {
    async function fetchAds() {
      const { data } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false });
      setAds(data || []);
    }
    fetchAds();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await supabase.from('ads').insert([{ ...form }]);
    setForm({ image_url: '', link_url: '', position: 'banner', is_active: true });
    const { data } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });
    setAds(data || []);
  };

  const handleToggle = async (id, value) => {
    await supabase.from('ads').update({ is_active: value }).eq('id', id);
    const { data } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });
    setAds(data || []);
  };

  const handleDelete = async (id) => {
    await supabase.from('ads').delete().eq('id', id);
    const { data } = await supabase
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });
    setAds(data || []);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 bg-primary min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <Megaphone className="w-8 h-8 text-purple-500" />
        <h1 className="text-3xl font-black text-primary uppercase italic tracking-tighter">Ad Banner Manager</h1>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-secondary border border-primary p-8 rounded-[2rem] mb-12 shadow-2xl flex flex-col gap-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}><ImageIcon className="inline w-3 h-3 mr-1" /> Image URL</label>
            <input
              name="image_url"
              value={form.image_url}
              onChange={handleChange}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}><Link2 className="inline w-3 h-3 mr-1" /> Link URL</label>
            <input
              name="link_url"
              value={form.link_url}
              onChange={handleChange}
              placeholder="https://..."
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Position</label>
            <select
              name="position"
              value={form.position}
              onChange={handleChange}
              className={inputCls}
            >
              {positions.map((pos) => (
                <option key={pos}>{pos}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 text-primary font-bold cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="w-5 h-5 rounded-lg border-primary bg-secondary text-purple-600 focus:ring-purple-500"
              />{' '}
              Mark as Active
            </label>
          </div>
        </div>
        <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-xl font-bold w-full md:w-48 transition-all shadow-lg active:scale-95">
          + Add Advertisement
        </button>
      </motion.form>

      <div className="bg-secondary border border-primary p-8 rounded-[2rem] shadow-2xl">
        <h3 className="text-xl font-black text-primary mb-6 uppercase italic tracking-tighter">Current Campaigns</h3>
        <div className="flex flex-col gap-4">
          {ads.length === 0 ? (
             <div className="text-center py-12 text-secondary/40 font-bold uppercase tracking-widest italic">No ads found</div>
          ) : ads.map((ad) => (
            <div key={ad.id} className="flex items-center gap-5 bg-primary/5 border border-primary p-4 rounded-2xl group transition-all hover:bg-primary/10">
              <img src={ad.image_url} alt="Ad" className="w-24 h-14 object-cover rounded-xl shadow-lg" />
              <div className="flex-1 min-w-0">
                <div className="text-primary font-bold truncate text-sm">{ad.link_url}</div>
                <div className="text-[10px] text-secondary font-black uppercase tracking-widest mt-1 bg-primary/20 w-fit px-2 py-0.5 rounded-full">{ad.position}</div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleToggle(ad.id, !ad.is_active)}
                  className={`p-2 rounded-lg transition-all ${ad.is_active ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-secondary'}`}
                >
                  {ad.is_active ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => handleDelete(ad.id)}
                  className="p-2 rounded-lg text-secondary hover:text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
