import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Plus, Check, X, Image as ImageIcon } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('reviews');
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [appForm, setAppForm] = useState({ name: '', playStoreLink: '', rewardAmount: '', instructions: '', targetType: 'group', targetUser: '', scrapedIcon: '' });
  const [appIcon, setAppIcon] = useState(null);
  const [addingApp, setAddingApp] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [revRes, payRes, appRes, usersRes] = await Promise.all([
        api.get('/reviews/all'),
        api.get('/payments/all'),
        api.get('/apps?admin=true'),
        api.get('/chat/users') // fetches users for dropdown
      ]);
      setReviews(revRes.data.reviews);
      setPayments(payRes.data.payments);
      setApps(appRes.data.apps);
      setUsersList(usersRes.data.users);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkPaste = async (url) => {
    setAppForm(prev => ({ ...prev, playStoreLink: url }));
    if (!url.includes('play.google.com/store/apps/details?id=')) return;

    setScraping(true);
    try {
      const { data } = await api.get(`/apps/scrape?url=${encodeURIComponent(url)}`);
      if (data.success) {
        setAppForm(prev => ({ ...prev, name: data.name, scrapedIcon: data.icon }));
        toast.success('App details auto-filled!');
      }
    } catch (error) {
      toast.error('Failed to scrape app details. Please enter manually.');
    } finally {
      setScraping(false);
    }
  };

  const handleAppSubmit = async (e) => {
    e.preventDefault();
    setAddingApp(true);
    const formData = new FormData();
    Object.keys(appForm).forEach(key => formData.append(key, appForm[key]));
    if (appIcon) formData.append('icon', appIcon);

    try {
      await api.post('/apps', formData);
      toast.success('App added successfully');
      setAppForm({ name: '', playStoreLink: '', rewardAmount: '', instructions: '', targetType: 'group', targetUser: '', scrapedIcon: '' });
      setAppIcon(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add app');
    } finally {
      setAddingApp(false);
    }
  };

  const handleReviewAction = async (id, action) => {
    try {
      if (action === 'approve') {
        await api.put(`/reviews/${id}/approve`);
      } else {
        const note = prompt('Enter reason for rejection:');
        if (!note) return;
        await api.put(`/reviews/${id}/reject`, { adminNote: note });
      }
      toast.success(`Review ${action}d`);
      fetchData();
    } catch (error) {
      toast.error(`Failed to ${action} review`);
    }
  };

  const handlePaymentAction = async (id, status) => {
    try {
      const txId = prompt('Enter transaction ID (or leave blank):') || '';
      await api.put(`/payments/${id}/process`, { status, transactionId: txId });
      toast.success(`Payment marked as ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const tabs = [
    { id: 'reviews', label: 'Pending Reviews' },
    { id: 'payments', label: 'Payment Requests' },
    { id: 'apps', label: 'Manage Apps' }
  ];

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading Admin Panel...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-6 px-4 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          
          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Pending Reviews</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                      <th className="p-3">User</th>
                      <th className="p-3">App</th>
                      <th className="p-3">Screenshot</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.filter(r => r.status === 'pending').map(r => (
                      <tr key={r._id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="p-3">{r.userId?.name} <br/><span className="text-xs text-gray-400">{r.userId?.email}</span></td>
                        <td className="p-3 font-medium">{r.appId?.name}</td>
                        <td className="p-3">
                          <a href={r.screenshotUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                            <ImageIcon size={16}/> View
                          </a>
                        </td>
                        <td className="p-3">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-500">Pending</span>
                        </td>
                        <td className="p-3 flex justify-end gap-2">
                          <button onClick={() => handleReviewAction(r._id, 'approve')} className="p-2 bg-green-600 hover:bg-green-500 rounded-lg text-white" title="Approve">
                            <Check size={18}/>
                          </button>
                          <button onClick={() => handleReviewAction(r._id, 'reject')} className="p-2 bg-red-600 hover:bg-red-500 rounded-lg text-white" title="Reject">
                            <X size={18}/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Pending Payments</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                      <th className="p-3">User</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Method & Details</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.filter(p => p.status === 'pending' || p.status === 'processing').map(p => (
                      <tr key={p._id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="p-3">{p.userId?.name}</td>
                        <td className="p-3 font-bold text-green-400">₹{p.amount}</td>
                        <td className="p-3">
                          <span className="uppercase text-xs font-bold text-gray-400">{p.method}</span>
                          <p className="text-sm font-mono mt-1">{p.accountDetails}</p>
                        </td>
                        <td className="p-3 flex justify-end gap-2">
                          <button onClick={() => handlePaymentAction(p._id, 'completed')} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium">
                            Mark Paid
                          </button>
                          <button onClick={() => handlePaymentAction(p._id, 'rejected')} className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-medium">
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'apps' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-gray-900 p-6 rounded-2xl border border-gray-700 h-fit">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20}/> Add New App</h3>
                <form onSubmit={handleAppSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Play Store Link (Auto-fills details)</label>
                    <input 
                      required 
                      placeholder="https://play.google.com/store/apps/details?id=..." 
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm" 
                      value={appForm.playStoreLink} 
                      onChange={e => handleLinkPaste(e.target.value)}
                    />
                    {scraping && <p className="text-xs text-blue-400 mt-1 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Scraping Play Store...</p>}
                  </div>

                  {(appForm.name || appForm.scrapedIcon) && (
                    <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl border border-gray-700">
                      {appForm.scrapedIcon && <img src={appForm.scrapedIcon} alt="Icon" className="w-12 h-12 rounded-lg" />}
                      <div className="flex-1">
                        <input 
                          required 
                          placeholder="App Name" 
                          className="w-full bg-transparent border-none focus:ring-0 px-0 py-0 text-sm font-bold text-white" 
                          value={appForm.name} 
                          onChange={e => setAppForm({...appForm, name: e.target.value})}
                        />
                        <p className="text-xs text-green-400">Auto-generated</p>
                      </div>
                    </div>
                  )}

                  {!appForm.name && !scraping && (
                    <input required placeholder="App Name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm" value={appForm.name} onChange={e => setAppForm({...appForm, name: e.target.value})}/>
                  )}

                  <input required type="number" placeholder="Reward Amount (₹)" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm" value={appForm.rewardAmount} onChange={e => setAppForm({...appForm, rewardAmount: e.target.value})}/>
                  <textarea required placeholder="Instructions for review..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm min-h-[100px]" value={appForm.instructions} onChange={e => setAppForm({...appForm, instructions: e.target.value})}></textarea>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Target Audience</label>
                    <select className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm" value={appForm.targetType} onChange={e => setAppForm({...appForm, targetType: e.target.value})}>
                      <option value="group">Everyone (Group)</option>
                      <option value="personal">Specific User (Personal)</option>
                    </select>
                  </div>

                  {appForm.targetType === 'personal' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Select User</label>
                      <select required className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm" value={appForm.targetUser} onChange={e => setAppForm({...appForm, targetUser: e.target.value})}>
                        <option value="">-- Choose User --</option>
                        {usersList.map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!appForm.scrapedIcon && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Custom App Icon (Optional)</label>
                      <input type="file" onChange={e => setAppIcon(e.target.files[0])} className="text-sm"/>
                    </div>
                  )}

                  <button type="submit" disabled={addingApp} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl flex justify-center mt-2">
                    {addingApp ? <Loader2 className="animate-spin" size={20}/> : 'Publish App'}
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2">
                <h3 className="text-lg font-bold mb-4">Active Apps</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {apps.map(app => (
                    <div key={app._id} className="bg-gray-900 p-4 rounded-xl border border-gray-700 flex gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                        {app.icon && <img src={app.icon} alt="" className="w-full h-full object-cover"/>}
                      </div>
                      <div>
                        <h4 className="font-bold">{app.name}</h4>
                        <p className="text-sm text-blue-400">Reward: ₹{app.rewardAmount}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {app.targetType === 'personal' ? `Personal: ${app.targetUser?.name || 'Assigned User'}` : 'Global Group App'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
