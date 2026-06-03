import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ChatGroupModal({ onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/chat/users');
        setSearchResults(data.users);
      } catch (e) {
        toast.error('Failed to load users');
      }
    };
    fetchUsers();
  }, []);

  const handleGroupCreate = async (e) => {
    e.preventDefault();
    if (!groupName || selectedUsers.length === 0) {
      toast.error('Please enter a group name and select at least 1 user');
      return;
    }
    try {
      const { data } = await api.post('/chat/group', {
        name: groupName,
        users: JSON.stringify(selectedUsers.map((u) => u._id)),
      });
      toast.success('Group Created!');
      onGroupCreated(data);
      onClose();
    } catch (e) {
      toast.error('Failed to create group');
    }
  };

  const handleUserSelect = (userToAdd) => {
    if (selectedUsers.some((u) => u._id === userToAdd._id)) return;
    setSelectedUsers([...selectedUsers, userToAdd]);
  };

  const handleDelete = (delUser) => {
    setSelectedUsers(selectedUsers.filter((sel) => sel._id !== delUser._id));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#17212b] rounded-2xl w-full max-w-md overflow-hidden border border-gray-800 shadow-2xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Create New Group</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <input
            placeholder="Group Name"
            className="w-full bg-[#0e1621] border border-gray-700 rounded-xl px-4 py-2 text-white"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
            <input
              placeholder="Search Users..."
              className="w-full bg-[#0e1621] border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((u) => (
              <span key={u._id} className="bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                {u.name} <X size={12} className="cursor-pointer hover:text-white" onClick={() => handleDelete(u)} />
              </span>
            ))}
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1">
            {searchResults
              .filter((u) => u.name.toLowerCase().includes(search.toLowerCase()))
              .map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className="p-2 hover:bg-[#232e3c] rounded-lg cursor-pointer flex items-center gap-3 text-sm text-gray-300"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">{user.name.charAt(0)}</div>
                  <div>
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button onClick={handleGroupCreate} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl">
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
