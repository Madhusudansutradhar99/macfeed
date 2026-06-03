import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, User as UserIcon, ArrowLeft, Settings, Trash2, LogOut, Shield, Search, MessageCircle } from 'lucide-react';
import { ReviewAuthContext } from '../../context/ReviewAuthContext';
import { useAuth } from '../../context/AuthContext';
import ChatGroupModal from './ChatGroupModal';
import NewChatModal from './NewChatModal';

export const getSender = (loggedUser, users) => {
  if (!users || users.length === 0) return 'Unknown User';
  
  const loggedUserId = loggedUser?._id ? loggedUser._id.toString() : '';
  const otherUser = users.find(u => {
    const uId = typeof u === 'object' ? (u?._id ? u._id.toString() : '') : u.toString();
    return uId !== loggedUserId;
  });
  
  if (!otherUser) {
    const singleUser = users[0];
    return typeof singleUser === 'object' ? (singleUser?.name || 'Unknown User') : singleUser.toString();
  }
  
  if (typeof otherUser === 'object') {
    return otherUser.name || otherUser.email || 'Unknown User';
  }
  return otherUser.toString();
};

export const getSenderEmail = (loggedUser, users) => {
  if (!users || users.length === 0) return '';
  
  const loggedUserId = loggedUser?._id ? loggedUser._id.toString() : '';
  const otherUser = users.find(u => {
    const uId = typeof u === 'object' ? (u?._id ? u._id.toString() : '') : u.toString();
    return uId !== loggedUserId;
  });
  
  if (!otherUser) {
    const singleUser = users[0];
    return typeof singleUser === 'object' ? (singleUser?.email || '') : '';
  }
  
  if (typeof otherUser === 'object') {
    return otherUser.email || '';
  }
  return '';
};

export default function ChatList({ chats, setChats, onSelectChat, selectedChatId }) {
  const { user, logout } = useContext(ReviewAuthContext);
  const { setAuthModalOpen, logout: mainLogout } = useAuth();
  const navigate = useNavigate();
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' or 'review-tasks'

  const handleLogout = () => {
    logout();
    mainLogout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    if (confirm('WARNING: Are you sure you want to delete your account? This action is permanent.')) {
      try {
        const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiHost}/auth/delete-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (response.ok) {
          logout();
          mainLogout();
          navigate('/');
        } else {
          alert('Failed to delete account.');
        }
      } catch (e) {
        alert('Error connecting to authentication server.');
      }
    }
  };

  const formatChatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 1) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredChats = chats.filter((chat) => {
    const isReview = !!chat.isReviewChat;
    
    if (activeTab === 'chats' && isReview) return false;
    if (activeTab === 'review-tasks' && !isReview) return false;

    const name = !chat.isGroupChat ? getSender(user, chat.users) : (chat.chatName || 'Group');
    const latestMsg = chat.latestMessage ? chat.latestMessage.content : '';
    return name.toLowerCase().includes(search.toLowerCase()) || 
           latestMsg.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="w-full h-full border-r border-gray-700 bg-[#17212b] flex flex-col overflow-hidden">
      {/* Sidebar Header */}
      <div className="px-4 pt-4 pb-3 flex flex-col gap-3 border-b border-gray-800 bg-[#17212b]">
        <div className="flex items-center justify-between">
          {user ? (
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 w-full group cursor-pointer relative"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-inner transition-transform group-hover:scale-105">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-100 truncate leading-tight flex items-center gap-1">
                  {user.name}
                  {user.role === 'admin' && <Shield size={12} className="text-purple-400 shrink-0" />}
                </p>
                <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">{user.email}</p>
              </div>
              
              {/* Dropdown Menu on click/tap */}
              {showDropdown && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-11 left-0 w-52 bg-[#232e3c] border border-[#2b394a] rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <button onClick={() => { setShowDropdown(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#2b3847] text-gray-300 transition-colors text-xs font-medium border-b border-[#2b394a] text-left">
                    <Settings size={14} /> My Profile Settings
                  </button>
                  <button onClick={() => { setShowDropdown(false); handleDeleteAccount(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#2b3847] text-red-400 transition-colors text-xs font-medium border-b border-[#2b394a] text-left">
                    <Trash2 size={14} /> Delete Account
                  </button>
                  <button onClick={() => { setShowDropdown(false); handleLogout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#2b3847] text-red-400 transition-colors text-xs font-medium border-b border-[#2b394a] text-left">
                    <LogOut size={14} /> Log out
                  </button>
                  <button onClick={() => { setShowDropdown(false); navigate('/'); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#2b3847] text-gray-300 transition-colors text-xs font-medium text-left">
                    ← Main Site
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <h2 className="text-md font-black uppercase tracking-wider text-blue-400">Review & Earn</h2>
              <button 
                onClick={() => setAuthModalOpen(true)} 
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-colors shadow-lg shadow-blue-500/20"
              >
                Sign In
              </button>
            </div>
          )}
        </div>

        {/* Toolbar: Search, New Chat, New Group, Exit Buttons */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2 text-gray-500" size={14} />
            <input
              type="text"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#242f3d] border border-transparent rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/30 transition-all font-medium"
            />
          </div>
          <div className="flex gap-1 shrink-0">
            <button 
              onClick={() => setShowNewChatModal(true)} 
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="New Chat"
            >
              <UserIcon size={15} />
            </button>
            <button 
              onClick={() => setShowGroupModal(true)} 
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="New Group"
            >
              <Users size={15} />
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="px-2 py-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors border border-blue-500/20"
              title="Exit to Main Site"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Selector (Chats vs Review Panel) */}
      <div className="flex border-b border-gray-800 bg-[#17212b] shrink-0">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-colors relative ${
            activeTab === 'chats' 
              ? 'text-blue-400 hover:text-blue-300' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Chats
          {activeTab === 'chats' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('review-tasks')}
          className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider transition-colors relative ${
            activeTab === 'review-tasks' 
              ? 'text-purple-400 hover:text-purple-300' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Review Portal
          {activeTab === 'review-tasks' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400" />
          )}
        </button>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.map((chat) => (
          <div
            key={chat._id}
            onClick={() => onSelectChat(chat)}
            className={`p-3 cursor-pointer hover:bg-[#232e3c] transition-colors flex items-center gap-3 border-b border-gray-800/50 ${
              selectedChatId === chat._id ? 'bg-[#2b5278]' : ''
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
              {!chat.isGroupChat 
                ? getSender(user, chat.users).charAt(0).toUpperCase() 
                : (chat.chatName || 'Group').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="text-[15px] font-semibold text-gray-100 truncate">
                  {!chat.isGroupChat ? getSender(user, chat.users) : (chat.chatName || 'Group')}
                </h3>
                <span className="text-[10px] text-gray-500 shrink-0 font-medium font-sans">
                  {formatChatTime(chat.latestMessage?.createdAt || chat.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                {chat.latestMessage ? (
                  <p className="text-xs text-gray-400 truncate flex-1">
                    <span className="font-medium text-gray-300 font-sans">
                      {(typeof chat.latestMessage.senderId === 'object' 
                        ? chat.latestMessage.senderId?.name 
                        : chat.latestMessage.senderId) || 'User'}: 
                    </span> {chat.latestMessage.content}
                  </p>
                ) : (
                  <p className="text-xs text-blue-400 truncate flex-1 italic">Tap to start chatting</p>
                )}
                {chat.unreadCount > 0 && (
                  <span className="flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredChats.length === 0 && (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
            <MessageCircle size={32} className="opacity-20 text-gray-400" />
            <p className="text-sm font-medium">No chats yet.<br/>Start a new chat or create a group!</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showGroupModal && (
        <ChatGroupModal 
          onClose={() => setShowGroupModal(false)}
          onGroupCreated={(newGroup) => {
            setChats([newGroup, ...chats]);
            onSelectChat(newGroup);
          }}
        />
      )}

      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onChatCreated={(newChat) => {
            if (!chats.find((c) => c._id === newChat._id)) {
              setChats([newChat, ...chats]);
            }
            onSelectChat(newChat);
          }}
        />
      )}
    </div>
  );
}
