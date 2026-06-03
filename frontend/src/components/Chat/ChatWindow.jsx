import React, { useState, useEffect, useRef, useContext } from 'react';
import { Send, ArrowLeft, Sun, Moon, Paperclip, Trophy, Loader2, Sparkles, X, Trash2, Plus, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { ReviewAuthContext } from '../../context/ReviewAuthContext';
import { SocketContext } from '../../context/SocketContext';
import MessageBubble from './MessageBubble';
import OnlineStatus from './OnlineStatus';
import { getSender } from './ChatList';

export default function ChatWindow({ chat, onBack }) {
  const { user } = useContext(ReviewAuthContext);
  const socket = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [theme, setTheme] = useState('dark');
  
  // Upload, App Task, and Group Member States
  const [uploading, setUploading] = useState(false);
  const [activeTaskApp, setActiveTaskApp] = useState(null);
  const [showAppTaskModal, setShowAppTaskModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [apps, setApps] = useState([]);

  const [showAddMemberSection, setShowAddMemberSection] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // In-Modal Add App States
  const [showAddAppForm, setShowAddAppForm] = useState(false);
  const [newPlayStoreLink, setNewPlayStoreLink] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [newAppReward, setNewAppReward] = useState('');
  const [newAppInstructions, setNewAppInstructions] = useState('');
  const [newAppScrapedIcon, setNewAppScrapedIcon] = useState('');
  const [fetchingInfo, setFetchingInfo] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  let typingTimeout = useRef(null);

  const isReviewPortalChat = chat && (chat.isReviewChat || chat._id === 'chat-support-1');

  useEffect(() => {
    if (chat) {
      fetchMessages();
    }
  }, [chat]);

  useEffect(() => {
    if (socket && chat) {
      socket.emit('join chat', chat._id);

      const messageHandler = (message) => {
        if (message.chat._id === chat._id) {
          setMessages((prev) => [...prev, message]);
          api.put(`/chat/read/${chat._id}`).catch((err) => console.error(err));
          socket.emit('read messages', { chatId: chat._id, userId: user._id });
        }
      };

      const readHandler = ({ chatId: readChatId }) => {
        if (readChatId === chat._id) {
          setMessages((prev) =>
            prev.map((msg) => {
              const senderIdStr = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId?._id;
              return senderIdStr === user._id ? { ...msg, isRead: true } : msg;
            })
          );
        }
      };

      const messageDeleteHandler = ({ messageId }) => {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      };

      const typingHandler = () => setIsTyping(true);
      const stopTypingHandler = () => setIsTyping(false);

      socket.on('message recieved', messageHandler);
      socket.on('messages read', readHandler);
      socket.on('message deleted', messageDeleteHandler);
      socket.on('typing', typingHandler);
      socket.on('stop typing', stopTypingHandler);

      return () => {
        socket.off('message recieved', messageHandler);
        socket.off('messages read', readHandler);
        socket.off('message deleted', messageDeleteHandler);
        socket.off('typing', typingHandler);
        socket.off('stop typing', stopTypingHandler);
      };
    }
  }, [socket, chat, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/chat/message/${chat._id}`);
      setMessages(data.messages);
      socket?.emit('join chat', chat._id);

      await api.put(`/chat/read/${chat._id}`);
      socket?.emit('read messages', { chatId: chat._id, userId: user._id });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage;
    setNewMessage('');
    if (socket) socket.emit('stop typing', chat._id);

    try {
      const { data } = await api.post('/chat/message', { chatId: chat._id, content });
      setMessages((prev) => [...prev, data.message]);
      if (socket) {
        socket.emit('new message', data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
      setNewMessage(content);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/chat/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (data.success) {
        let textContent = activeTaskApp 
          ? `Submitted review screenshot for app: ${activeTaskApp.name}` 
          : 'Shared a screenshot';
        
        const isRedirected = !isReviewPortalChat && activeTaskApp;

        const messagePayload = {
          chatId: chat._id,
          content: textContent,
          attachmentUrl: data.url
        };

        if (activeTaskApp) {
          messagePayload.appTaskId = activeTaskApp._id;
        }

        if (isRedirected) {
          messagePayload.sendToReviewPortal = true;
        }

        const msgRes = await api.post('/chat/message', messagePayload);
        
        if (!isRedirected) {
          setMessages((prev) => [...prev, msgRes.data.message]);
        }
        
        if (socket) {
          socket.emit('new message', msgRes.data.message);
        }
        
        toast.success(isRedirected 
          ? 'Review screenshot submitted to Review Portal!' 
          : (activeTaskApp ? 'Review screenshot uploaded!' : 'Screenshot sent!'));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to upload screenshot');
    } finally {
      setUploading(false);
      setActiveTaskApp(null);
      e.target.value = '';
    }
  };

  const openAppTaskModal = async () => {
    setShowAppTaskModal(true);
    setShowAddAppForm(false);
    try {
      const { data } = await api.get('/apps?admin=true');
      setApps(data.apps || data || []);
    } catch (e) {
      toast.error('Failed to load apps');
    }
  };

  const handleSendAppTask = async (app) => {
    setShowAppTaskModal(false);
    try {
      const { data } = await api.post('/chat/message', {
        chatId: chat._id,
        content: `App review task: Install ${app.name} & upload proof.`,
        appTaskId: app._id
      });
      setMessages((prev) => [...prev, data.message]);
      if (socket) {
        socket.emit('new message', data.message);
      }
      toast.success('App review task sent!');
    } catch (e) {
      toast.error('Failed to send app review task');
    }
  };

  const handleDeleteChat = async () => {
    if (confirm('Are you sure you want to delete this conversation? This will clear all messages and cannot be undone.')) {
      try {
        await api.delete(`/chat/${chat._id}`);
        toast.success('Chat deleted successfully');
        if (onBack) onBack();
        window.location.reload();
      } catch (e) {
        toast.error('Failed to delete chat');
      }
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (confirm('Are you sure you want to remove this member from the group?')) {
      try {
        const { data } = await api.put('/chat/group/remove', {
          chatId: chat._id,
          userId: memberId
        });
        if (data.success) {
          toast.success('Member removed successfully');
          setShowGroupInfoModal(false);
          window.location.reload();
        }
      } catch (e) {
        toast.error(e.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  const handleOpenAddMemberSection = async () => {
    setShowAddMemberSection(!showAddMemberSection);
    if (!showAddMemberSection && allUsers.length === 0) {
      setLoadingUsers(true);
      try {
        const { data } = await api.get('/chat/users');
        setAllUsers(data.users || []);
      } catch (err) {
        toast.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  const handleAddMember = async (memberId) => {
    try {
      const { data } = await api.put('/chat/group/add', {
        chatId: chat._id,
        userId: memberId
      });
      if (data.success) {
        toast.success('Member added successfully');
        setShowGroupInfoModal(false);
        window.location.reload();
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add member');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await api.delete(`/chat/message/${messageId}`);
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
        if (socket) {
          socket.emit('delete message', { messageId, chatId: chat._id });
        }
        toast.success('Message deleted');
      } catch (e) {
        toast.error('Failed to delete message');
      }
    }
  };

  const [lastFetchedLink, setLastFetchedLink] = useState('');

  // Add App Form Actions
  const handleLinkChange = async (val) => {
    setNewPlayStoreLink(val);
    if (val && val !== lastFetchedLink && val.includes('play.google.com/store/apps/details?id=')) {
      try {
        const urlObj = new URL(val);
        const appId = urlObj.searchParams.get('id');
        if (appId) {
          setLastFetchedLink(val);
          setFetchingInfo(true);
          try {
            const { data } = await api.get(`/apps/scrape?url=${encodeURIComponent(val)}`);
            if (data.success) {
              setNewAppName(data.name);
              setNewAppScrapedIcon(data.icon);
              toast.success('App details automatically loaded!');
            }
          } catch (e) {
            console.error('Auto fetch details failed:', e);
          } finally {
            setFetchingInfo(false);
          }
        }
      } catch (e) {
        // Invalid URL format during typing
      }
    }
  };

  const handleFetchAppInfo = async () => {
    if (!newPlayStoreLink) return;
    setFetchingInfo(true);
    try {
      const { data } = await api.get(`/apps/scrape?url=${encodeURIComponent(newPlayStoreLink)}`);
      if (data.success) {
        setNewAppName(data.name);
        setNewAppScrapedIcon(data.icon);
        toast.success('App details loaded!');
      }
    } catch (e) {
      toast.error('Failed to parse Play Store link details');
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleCreateAppSubmit = async (e) => {
    e.preventDefault();
    if (!newAppName || !newPlayStoreLink || !newAppReward) {
      toast.error('App Name, Play Store Link, and Reward payout are required');
      return;
    }
    
    try {
      const { data } = await api.post('/apps', {
        name: newAppName,
        playStoreLink: newPlayStoreLink,
        rewardAmount: Number(newAppReward),
        instructions: newAppInstructions,
        targetType: 'group',
        scrapedIcon: newAppScrapedIcon
      });
      if (data.success) {
        toast.success('App task added successfully!');
        setApps((prev) => [data.app, ...prev]);
        setShowAddAppForm(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save new app');
    }
  };

  const handleDeleteApp = async (appId) => {
    if (confirm('Are you sure you want to delete this app from the active tasks database?')) {
      try {
        await api.delete(`/apps/${appId}`);
        toast.success('App task deleted');
        setApps((prev) => prev.filter((a) => a._id !== appId));
      } catch (e) {
        toast.error('Failed to delete app task');
      }
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket) {
      socket.emit('typing', chat._id);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        socket.emit('stop typing', chat._id);
      }, 3000);
    }
  };

  if (!chat) {
    if (user && user.role !== 'admin') {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#0e1621] text-gray-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-sm font-medium">Loading Support Chat...</p>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0e1621] text-gray-500">
        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-600">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-400">Select a chat to start messaging</p>
      </div>
    );
  }

  const isDark = theme === 'dark';
  const bgMain = isDark ? 'bg-[#0e1621]' : 'bg-[#e4e1d5]';
  const bgHeader = isDark ? 'bg-[#17212b]' : 'bg-white';
  const textHeader = isDark ? 'text-white' : 'text-black';
  const inputBg = isDark ? 'bg-[#242f3d]' : 'bg-white';
  const inputText = isDark ? 'text-white' : 'text-black';

  const chatName = !chat.isGroupChat ? getSender(user, chat.users) : (chat.chatName || 'Group');

  const getGroupedMessages = () => {
    const grouped = [];
    let lastDate = null;
    let unreadDividerInserted = false;

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const dateString = msgDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      let relativeDateHeader = dateString;
      const todayString = new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      if (dateString === todayString) {
        relativeDateHeader = 'Today';
      } else if (dateString === yesterdayString) {
        relativeDateHeader = 'Yesterday';
      }

      if (relativeDateHeader !== lastDate) {
        grouped.push({ type: 'date', value: relativeDateHeader });
        lastDate = relativeDateHeader;
      }

      const senderIdStr = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId?._id;
      const isOwn = senderIdStr === user._id;
      if (!isOwn && !msg.isRead && !unreadDividerInserted) {
        grouped.push({ type: 'unread-divider' });
        unreadDividerInserted = true;
      }

      grouped.push({ type: 'message', data: msg, isOwn });
    });

    return grouped;
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${bgMain} overflow-hidden`}>
      {/* Header */}
      <div className={`h-16 px-4 py-3 flex items-center gap-3 shadow-sm z-20 ${bgHeader}`}>
        {onBack && (
          <button onClick={onBack} className="md:hidden p-2 -ml-2 rounded-full text-gray-400 hover:text-white hover:bg-[#242f3d]">
            <ArrowLeft size={24} />
          </button>
        )}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {chatName.charAt(0).toUpperCase()}
          </div>
          {!chat.isGroupChat && (
            <div className="absolute bottom-0 right-0">
              <OnlineStatus isOnline={true} />
            </div>
          )}
        </div>
        <div 
          className={`flex-1 ${chat.isGroupChat ? 'cursor-pointer' : ''}`}
          onClick={() => { if (chat.isGroupChat) setShowGroupInfoModal(true); }}
        >
          <h2 className={`font-semibold ${textHeader} leading-tight ${chat.isGroupChat ? 'hover:underline' : ''}`}>{chatName}</h2>
          <p className="text-xs text-gray-400">
            {chat.isGroupChat ? `${chat.users?.length || 0} members (Click to view)` : 'online'}
          </p>
        </div>
        
        {/* Copy Join Link Button (Groups only, except global review panel) */}
        {chat.isGroupChat && chat._id !== 'chat-review-portal-1' && (
          <button 
            onClick={() => {
              const currentPath = window.location.hash.split('?')[0] || '#/review/chat';
              const inviteLink = `${window.location.origin}/${currentPath}?join=${chat._id}`;
              navigator.clipboard.writeText(inviteLink);
              toast.success('Group invite link copied to clipboard!');
            }}
            className={`p-2 rounded-full ${isDark ? 'hover:bg-[#232e3c] text-blue-400 hover:text-blue-300' : 'hover:bg-gray-200 text-blue-600 hover:text-blue-700'} transition-colors`}
            title="Copy Group Invite Link"
          >
            <Link2 size={20} />
          </button>
        )}

        {/* Toggle Theme */}
        <button 
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`p-2 rounded-full ${isDark ? 'hover:bg-[#232e3c] text-gray-300' : 'hover:bg-gray-200 text-gray-600'} transition-colors`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Delete Chat Button */}
        <button 
          onClick={handleDeleteChat}
          className="p-2 rounded-full hover:bg-red-600/10 text-red-400 transition-colors"
          title="Delete Chat"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Messages Area with Wallpaper */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Telegram Wallpaper Pattern Overlay */}
        <div 
          className={`absolute inset-0 pointer-events-none opacity-[0.05] z-0 ${
            isDark 
              ? 'bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] bg-[size:20px_20px]' 
              : 'bg-[radial-gradient(#000000_1.5px,transparent_1.5px)] bg-[size:20px_20px]'
          }`} 
        />
        
        {/* Scrollable Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative z-10">
          {getGroupedMessages().map((item, idx) => {
            if (item.type === 'date') {
              return (
                <div key={`date-${idx}`} className="flex justify-center my-4">
                  <span className="bg-[#17212b]/80 border border-gray-800 text-gray-300 rounded-full px-4 py-1 text-xs font-bold shadow-sm backdrop-blur-sm">
                    {item.value}
                  </span>
                </div>
              );
            }
            if (item.type === 'unread-divider') {
              return (
                <div key={`unread-${idx}`} className="flex justify-center my-4">
                  <span className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-sm">
                    ⚡ Unread Messages
                  </span>
                </div>
              );
            }
            
            return (
              <MessageBubble 
                key={`msg-${item.data._id || idx}`} 
                message={item.data} 
                isOwn={item.isOwn} 
                showSenderName={chat.isGroupChat && !item.isOwn} 
                onUploadScreenshot={(app) => {
                  setActiveTaskApp(app);
                  fileInputRef.current.click();
                }}
                onDeleteMessage={handleDeleteMessage}
                currentUserId={user?._id}
                isAdmin={user?.role === 'admin'}
              />
            );
          })}
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-[#17212b] text-gray-400 rounded-2xl rounded-bl-none px-4 py-2 text-sm italic shadow-sm">
                typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input controls */}
      <div className={`p-4 ${bgMain} z-20`}>
        <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto w-full items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              setActiveTaskApp(null);
              fileInputRef.current.click();
            }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0 border ${
              isDark 
                ? 'bg-[#17212b] border-gray-800 text-gray-400 hover:text-white hover:bg-[#232e3c]' 
                : 'bg-white border-gray-300 text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Upload Screenshot"
          >
            {uploading ? (
              <Loader2 className="animate-spin text-blue-500" size={20} />
            ) : (
              <Paperclip size={20} />
            )}
          </button>

          {(isReviewPortalChat || chat.isGroupChat) && (
            <button
              type="button"
              onClick={openAppTaskModal}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0 border ${
                isDark 
                  ? 'bg-[#17212b] border-gray-800 text-purple-400 hover:text-purple-300 hover:bg-[#232e3c]' 
                  : 'bg-white border-gray-300 text-purple-600 hover:text-purple-700 hover:bg-gray-100'
              }`}
              title="Share App Task"
            >
              <Trophy size={20} />
            </button>
          )}

          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Write a message..."
            className={`flex-1 rounded-xl px-5 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm ${inputBg} ${inputText}`}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() && !uploading}
            className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0"
          >
            <Send size={20} className="ml-1" />
          </button>
        </form>
      </div>

      {/* Task sharing modal popup */}
      {showAppTaskModal && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#17212b] rounded-2xl w-full max-w-md overflow-hidden border border-gray-800 shadow-2xl flex flex-col max-h-[80vh] w-[420px]">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#17212b]/80 sticky top-0 z-10">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={16} className="text-purple-400" /> Share App Review Task
              </h2>
              <button onClick={() => setShowAppTaskModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {showAddAppForm ? (
              /* Add App Form */
              <form onSubmit={handleCreateAppSubmit} className="p-4 space-y-3.5 overflow-y-auto max-h-[60vh] custom-scrollbar">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Play Store Link</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={newPlayStoreLink}
                      onChange={(e) => handleLinkChange(e.target.value)}
                      placeholder="https://play.google.com/store/apps/details?id=..."
                      className="flex-1 bg-[#0e1621] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      disabled={fetchingInfo || !newPlayStoreLink}
                      onClick={handleFetchAppInfo}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shrink-0 disabled:opacity-50"
                    >
                      {fetchingInfo ? 'Fetching...' : 'Fetch Info'}
                    </button>
                  </div>
                </div>

                {newAppScrapedIcon && (
                  <div className="flex gap-3 items-center bg-[#0e1621] p-2.5 rounded-xl border border-gray-800/40">
                    <img src={newAppScrapedIcon} className="w-10 h-10 rounded-xl object-cover shrink-0 shadow" alt="Scraped Icon" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Scraped Icon Preview</p>
                      <p className="text-xs text-white truncate max-w-[200px] font-sans mt-0.5">{newAppName}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">App Name</label>
                  <input
                    type="text"
                    required
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="e.g. MacFeed Pro Streamer"
                    className="w-full bg-[#0e1621] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Reward Payout (₹ Amount)</label>
                  <input
                    type="number"
                    required
                    value={newAppReward}
                    onChange={(e) => setNewAppReward(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full bg-[#0e1621] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-bold">Instructions</label>
                  <textarea
                    required
                    value={newAppInstructions}
                    onChange={(e) => setNewAppInstructions(e.target.value)}
                    placeholder="Provide guidelines for downloading and reviewing..."
                    rows="3"
                    className="w-full bg-[#0e1621] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-sans leading-relaxed"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddAppForm(false)}
                    className="flex-1 py-2 rounded-xl bg-[#242f3d] hover:bg-[#2d3a4b] text-gray-300 text-xs font-bold transition-all border border-[#2b394a]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all"
                  >
                    Save App
                  </button>
                </div>
              </form>
            ) : (
              /* App List with delete button */
              <div className="p-4 space-y-3 flex flex-col justify-between h-[380px]">
                <div className="space-y-2 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                  {apps.map((app) => (
                    <div
                      key={app._id}
                      className="p-3 hover:bg-[#232e3c] rounded-xl flex items-center justify-between gap-3 transition-colors border border-transparent hover:border-purple-500/20 group"
                    >
                      <div 
                        onClick={() => handleSendAppTask(app)}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      >
                        <img src={app.icon || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=64&h=64&fit=crop'} className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{app.name}</p>
                          <p className="text-[10px] text-green-400 font-extrabold mt-0.5 uppercase tracking-wider">Payout: ₹{app.rewardAmount}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteApp(app._id)}
                        className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors opacity-80 hover:opacity-100 shrink-0"
                        title="Delete App"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {apps.length === 0 && (
                    <p className="text-center text-xs text-gray-500 py-8">No active apps in database.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-800 bg-[#17212b]">
                  <button
                    type="button"
                    onClick={() => {
                      setNewPlayStoreLink('');
                      setNewAppName('');
                      setNewAppReward('');
                      setNewAppInstructions('');
                      setNewAppScrapedIcon('');
                      setShowAddAppForm(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 text-purple-400 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-purple-500/10"
                  >
                    <Plus size={14} /> Add New Play Store App
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Group members info modal */}
      {showGroupInfoModal && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#17212b] rounded-2xl w-full max-w-md overflow-hidden border border-gray-800 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#17212b]/80 sticky top-0 z-10">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                👥 Group Members
              </h2>
              <button onClick={() => setShowGroupInfoModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3 max-h-[50vh] custom-scrollbar">
              {chat.users.map((u) => {
                const uId = u._id || u;
                const isAdmin = chat.groupAdmin?._id === uId || chat.groupAdmin === uId;
                const isCurrentUser = user._id === uId;
                const isGroupAdmin = chat.groupAdmin?._id === user._id || chat.groupAdmin === user._id;

                return (
                  <div key={uId} className="flex justify-between items-center bg-[#0e1621] p-2.5 rounded-xl border border-gray-800/40">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold font-sans">
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-tight">
                          {u.name || 'User'} {isCurrentUser && '(You)'}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{u.email || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <span className="text-[8px] bg-purple-900/60 text-purple-300 font-extrabold px-1.5 py-0.5 rounded border border-purple-500/10 uppercase tracking-widest">
                          Admin
                        </span>
                      )}
                      {!isAdmin && !isCurrentUser && isGroupAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(uId)}
                          className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-red-600/10 text-red-400 border border-red-500/10 hover:bg-red-600/20 rounded transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Inline Add Member Sub-section for Group Admins */}
            {chat.isGroupChat && (chat.groupAdmin?._id === user?._id || chat.groupAdmin === user?._id) && (
              <div className="p-4 border-t border-gray-800 bg-[#17212b]">
                <button
                  type="button"
                  onClick={handleOpenAddMemberSection}
                  className="w-full py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 border border-blue-500/10"
                >
                  {showAddMemberSection ? 'Hide Add Member' : '➕ Add Member to Group'}
                </button>
                
                {showAddMemberSection && (
                  <div className="mt-3 space-y-2">
                    {loadingUsers ? (
                      <p className="text-center text-[10px] text-gray-500 py-2">Loading users...</p>
                    ) : (
                      <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        {allUsers.filter(u => !chat.users.some(cu => (cu._id || cu) === u._id)).map((u) => (
                          <div key={u._id} className="flex justify-between items-center bg-[#0e1621] p-2 rounded-xl border border-gray-800/40">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{u.name}</p>
                              <p className="text-[9px] text-gray-400 truncate mt-0.5">{u.email}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddMember(u._id)}
                              className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 rounded transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                        {allUsers.filter(u => !chat.users.some(cu => (cu._id || cu) === u._id)).length === 0 && (
                          <p className="text-center text-[10px] text-gray-500 py-3">No other users to add.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
