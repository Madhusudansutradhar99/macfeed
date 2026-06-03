import React, { useState, useEffect, useContext } from 'react';
import { ReviewAuthContext } from '../context/ReviewAuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Wallet, Clock, CheckCircle, CreditCard, Loader2, ArrowLeft, History, FileText } from 'lucide-react';

export default function UserDashboardPage() {
  const { user } = useContext(ReviewAuthContext);
  const [stats, setStats] = useState({ totalEarnings: 0, pendingAmount: 0, withdrawnAmount: 0 });
  const [reviews, setReviews] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Withdrawal Form States
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');
  const [accountDetails, setAccountDetails] = useState('');
  const [requesting, setRequesting] = useState(false);

  // Active Bot Section
  // Options: 'home', 'withdraw', 'history', 'reviews'
  const [activePanel, setActivePanel] = useState('home');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [meRes, revRes, payRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/reviews/my'),
        api.get('/payments/my')
      ]);
      setStats({
        totalEarnings: meRes.data.user.totalEarnings,
        pendingAmount: meRes.data.user.pendingAmount,
        withdrawnAmount: meRes.data.user.withdrawnAmount
      });
      setReviews(revRes.data.reviews);
      setPayments(payRes.data.payments);
    } catch (error) {
      toast.error('Failed to load bot data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (Number(withdrawAmount) > stats.pendingAmount) {
      toast.error('Amount exceeds pending balance');
      return;
    }
    setRequesting(true);
    try {
      await api.post('/payments/request', {
        amount: Number(withdrawAmount),
        method: withdrawMethod,
        accountDetails
      });
      toast.success('Withdrawal requested successfully');
      setWithdrawAmount('');
      setAccountDetails('');
      setActivePanel('home');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#0e1621] text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col h-full bg-[#0e1621] p-4 max-w-2xl mx-auto w-full z-10 text-left">
      
      {/* Bot Chat Stream */}
      <div className="flex-1 space-y-6 pb-20">
        
        {/* 🤖 Bot Intro Bubble */}
        <div className="flex gap-3 items-start">
          <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
            🤖
          </div>
          <div className="flex-1 bg-[#182533] border border-[#24313f] rounded-2xl rounded-tl-none p-4 shadow-lg text-xs leading-relaxed max-w-xl text-gray-200">
            <div className="flex items-center justify-between border-b border-[#1f2b38] pb-1.5 mb-2.5">
              <span className="font-bold text-green-400">MacFeed Wallet Bot</span>
              <span className="text-[10px] text-gray-500">System</span>
            </div>
            <p>Hello **{user?.name || 'User'}**! Welcome to your personal Wallet & Earnings Bot. Here you can check your live balance sheet and request instant payouts.</p>
          </div>
        </div>

        {/* 📊 Bot Stats Bubble (Shows user balance card) */}
        <div className="flex gap-3 items-start">
          <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md opacity-0">
            🤖
          </div>
          <div className="flex-1 bg-[#182533] border border-[#24313f] rounded-2xl rounded-tl-none p-4 shadow-lg max-w-xl text-left">
            <div className="flex items-center justify-between border-b border-[#1f2b38] pb-1.5 mb-3">
              <span className="text-xs font-bold text-green-400">Balance Overview</span>
              <span className="text-[10px] text-gray-500">Live</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[#101921] px-4 py-2.5 rounded-xl border border-[#202b36]">
                <span className="text-xs text-gray-400 flex items-center gap-1.5"><Wallet size={14} className="text-green-400" /> Total Earnings</span>
                <span className="text-sm font-bold text-white">₹{stats.totalEarnings}</span>
              </div>
              <div className="flex items-center justify-between bg-[#101921] px-4 py-2.5 rounded-xl border border-[#202b36]">
                <span className="text-xs text-gray-400 flex items-center gap-1.5"><Clock size={14} className="text-yellow-400" /> Pending Balance</span>
                <span className="text-sm font-bold text-white">₹{stats.pendingAmount}</span>
              </div>
              <div className="flex items-center justify-between bg-[#101921] px-4 py-2.5 rounded-xl border border-[#202b36]">
                <span className="text-xs text-gray-400 flex items-center gap-1.5"><CheckCircle size={14} className="text-blue-400" /> Withdrawn Cash</span>
                <span className="text-sm font-bold text-white">₹{stats.withdrawnAmount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── BOT MENU SECTIONS ── */}

        {/* HOME PANEL: Telegram Inline Keyboard Options */}
        {activePanel === 'home' && (
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md opacity-0">
              🤖
            </div>
            <div className="flex-1 max-w-xl">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 ml-1">Telegram Inline Actions</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setActivePanel('withdraw')}
                  disabled={stats.pendingAmount <= 0}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md"
                >
                  <CreditCard size={15} /> Payout Request
                </button>
                <button
                  onClick={() => setActivePanel('history')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1c2938] hover:bg-[#25364a] text-blue-400 hover:text-blue-300 text-xs font-bold transition-all border border-[#2b394a]"
                >
                  <History size={15} /> Payout History
                </button>
                <button
                  onClick={() => setActivePanel('reviews')}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1c2938] hover:bg-[#25364a] text-blue-400 hover:text-blue-300 text-xs font-bold transition-all border border-[#2b394a]"
                >
                  <FileText size={15} /> My Submissions
                </button>
              </div>
              
              {stats.pendingAmount <= 0 && (
                <p className="text-[10px] text-gray-500 mt-2 ml-1 italic">Note: Payout requests require a pending balance &gt; 0.</p>
              )}
            </div>
          </div>
        )}

        {/* WITHDRAW PANEL: Inline Payout Request Form */}
        {activePanel === 'withdraw' && (
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
              🤖
          </div>
            <div className="flex-1 bg-[#182533] border border-[#24313f] rounded-2xl rounded-tl-none p-4 shadow-lg max-w-xl">
              <div className="flex items-center justify-between border-b border-[#1f2b38] pb-1.5 mb-4">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5"><CreditCard size={14} /> Withdrawal Form</span>
                <button 
                  onClick={() => setActivePanel('home')}
                  className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft size={10} /> Back to Menu
                </button>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Amount to Payout (₹)</label>
                  <input
                    type="number"
                    max={stats.pendingAmount}
                    min="1"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#101921] border border-[#24313f] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder={`Max limit: ₹${stats.pendingAmount}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Transfer Method</label>
                  <select
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    className="w-full bg-[#101921] border border-[#24313f] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="bank">Bank Wire Transfer</option>
                    <option value="paypal">PayPal Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Details (UPI ID / Account Info)</label>
                  <textarea
                    required
                    rows="3"
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    className="w-full bg-[#101921] border border-[#24313f] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter UPI Address, bank account no. & IFSC, or PayPal email details..."
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActivePanel('home')}
                    className="flex-1 py-2.5 rounded-xl bg-[#242f3d] hover:bg-[#2d3a4b] text-gray-300 text-xs font-bold transition-all border border-[#2b394a]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={requesting || stats.pendingAmount <= 0}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    {requesting ? <Loader2 size={14} className="animate-spin" /> : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* HISTORY PANEL: Transaction History List */}
        {activePanel === 'history' && (
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
              🤖
            </div>
            <div className="flex-1 bg-[#182533] border border-[#24313f] rounded-2xl rounded-tl-none p-4 shadow-lg max-w-xl">
              <div className="flex items-center justify-between border-b border-[#1f2b38] pb-1.5 mb-3">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5"><History size={14} /> Payout Requests Log</span>
                <button 
                  onClick={() => setActivePanel('home')}
                  className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft size={10} /> Back to Menu
                </button>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {payments.map((p) => (
                  <div key={p._id} className="bg-[#101921] p-3 rounded-xl border border-[#1f2d3a] flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-white">₹{p.amount}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 uppercase">{p.method} • {new Date(p.requestedAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded
                        ${p.status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                          p.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 
                          'bg-yellow-500/10 text-yellow-400'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-6">No withdrawal requests found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS PANEL: Submitted Task Reviews Log */}
        {activePanel === 'reviews' && (
          <div className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
              🤖
            </div>
            <div className="flex-1 bg-[#182533] border border-[#24313f] rounded-2xl rounded-tl-none p-4 shadow-lg max-w-xl">
              <div className="flex items-center justify-between border-b border-[#1f2b38] pb-1.5 mb-3">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5"><FileText size={14} /> Submission Log</span>
                <button 
                  onClick={() => setActivePanel('home')}
                  className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft size={10} /> Back to Menu
                </button>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {reviews.map((r) => (
                  <div key={r._id} className="bg-[#101921] p-3 rounded-xl border border-[#1f2d3a] flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{r.appId?.name || 'App Review'}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Reward: ₹{r.appId?.rewardAmount || 0} • {new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded
                        ${r.status === 'approved' ? 'bg-green-500/10 text-green-400' : 
                          r.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 
                          'bg-yellow-500/10 text-yellow-400'}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-6">No task reviews submitted yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
