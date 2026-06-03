import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Phone, Loader2, Plus } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function NewChatModal({ onClose, onChatCreated }) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick Add Contact Form States
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/chat/users');
      setSearchResults(data.users || []);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (userId) => {
    try {
      const { data } = await api.post('/chat', { userId });
      onChatCreated(data);
      onClose();
    } catch (e) {
      toast.error('Error starting chat');
    }
  };

  const handleCreateContactSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Name and mobile number are required');
      return;
    }

    setAdding(true);
    try {
      const { data } = await api.post('/chat/create-user', {
        name: newName,
        phone: newPhone
      });
      if (data.success) {
        toast.success(`Contact ${newName} created!`);
        onChatCreated(data.chat);
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create contact');
    } finally {
      setAdding(false);
    }
  };

  // Filter existing users by name, email, or mobile number
  const filteredUsers = searchResults.filter((u) => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone && u.phone.includes(search))
  );

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#17212b] rounded-2xl w-full max-w-md overflow-hidden border border-gray-800 shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#17212b]/80 sticky top-0 z-10">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            {isAddingContact ? 'Create New Contact' : 'New Chat'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {isAddingContact ? (
          /* ── QUICK CONTACT ADD FORM ── */
          <form onSubmit={handleCreateContactSubmit} className="p-5 space-y-4 overflow-y-auto">
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Contact Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Madhusudan"
                className="w-full bg-[#0e1621] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Mobile Number</label>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="e.g. +919999999999"
                className="w-full bg-[#0e1621] border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsAddingContact(false)}
                className="flex-1 py-2 rounded-xl bg-[#242f3d] hover:bg-[#2d3a4b] text-gray-300 text-xs font-bold transition-all border border-[#2b394a]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                {adding ? <Loader2 size={12} className="animate-spin" /> : 'Save & Chat'}
              </button>
            </div>
          </form>
        ) : (
          /* ── SEARCH EXISING CHATS ── */
          <div className="p-4 space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input
                placeholder="Search by Name or Mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0e1621] border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar min-h-[150px]">
              {loading ? (
                <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-blue-500" /></div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleStartChat(user._id)}
                    className="p-3 hover:bg-[#232e3c] rounded-xl cursor-pointer flex items-center gap-3 transition-colors border border-transparent hover:border-[#2b394a]"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {user.phone ? `📱 ${user.phone}` : `✉️ ${user.email}`}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                  <p>No matches in contacts.</p>
                </div>
              )}
            </div>

            {/* CTA to Create New Contact */}
            <div className="pt-3 border-t border-gray-800 bg-[#17212b] sticky bottom-0">
              <button
                type="button"
                onClick={() => {
                  setNewPhone(search.replace(/[^0-9+]/g, '')); // pre-fill search string if numeric
                  setIsAddingContact(true);
                }}
                className="w-full py-2.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/25 text-blue-400 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-blue-500/10"
              >
                <UserPlus size={14} /> Add New Contact by Mobile
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
