import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ReviewAuthContext } from '../context/ReviewAuthContext';
import api from '../utils/api';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { user } = useContext(ReviewAuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [joinGroupDetails, setJoinGroupDetails] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchChats();
  }, [user]);

  useEffect(() => {
    const handleJoinLink = async () => {
      const hashParts = window.location.hash.split('?');
      if (hashParts.length > 1) {
        const searchParams = new URLSearchParams(hashParts[1]);
        const joinChatId = searchParams.get('join');
        
        if (joinChatId) {
          try {
            // Fetch group details to display the confirmation dialog
            const { data } = await api.get(`/chat/group/details/${joinChatId}`);
            if (data.success) {
              setJoinGroupDetails(data.chat);
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch group details');
            // Clean URL hash even if error occurs
            window.history.replaceState(null, '', window.location.pathname + hashParts[0]);
          }
        }
      }
    };
    if (user) {
      handleJoinLink();
    }
  }, [location.hash, user]);

  const handleConfirmJoin = async () => {
    if (!joinGroupDetails) return;
    setJoining(true);
    const hashParts = window.location.hash.split('?');
    try {
      const { data } = await api.put('/chat/group/join', { chatId: joinGroupDetails._id });
      if (data.success) {
        toast.success('Successfully joined the group!');
        
        // Clean URL parameter
        window.history.replaceState(null, '', window.location.pathname + hashParts[0]);
        
        // Reload all chats
        const { data: fetchRes } = await api.get('/chat');
        setChats(fetchRes.chats);
        
        // Open the joined chat window
        const joined = fetchRes.chats.find(c => c._id === joinGroupDetails._id);
        if (joined) {
          setSelectedChat(joined);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
      window.history.replaceState(null, '', window.location.pathname + hashParts[0]);
    } finally {
      setJoining(false);
      setJoinGroupDetails(null);
    }
  };

  const handleCancelJoin = () => {
    const hashParts = window.location.hash.split('?');
    window.history.replaceState(null, '', window.location.pathname + hashParts[0]);
    setJoinGroupDetails(null);
  };

  const fetchChats = async () => {
    try {
      const { data } = await api.get('/chat');
      setChats(data.chats);
      
      // Auto-select first chat if there is any and no active selection
      if (data.chats && data.chats.length > 0 && !selectedChat) {
        setSelectedChat(data.chats[0]);
      }
    } catch (error) {
      console.error('Error fetching chats', error);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#0e1621] text-white relative">
      {/* Show the list of chats on the left to EVERYONE (no auth required) */}
      <div className={`md:flex ${selectedChat ? 'hidden' : 'w-full'} md:w-80 h-full`}>
        <ChatList 
          chats={chats} 
          setChats={setChats}
          selectedChatId={selectedChat?._id} 
          onSelectChat={setSelectedChat} 
        />
      </div>
      
      {/* Chat Window: takes remaining width */}
      <div className={`flex-grow h-full ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatWindow 
          chat={selectedChat} 
          onBack={() => setSelectedChat(null)} 
        />
      </div>

      {/* Join Group Chat Confirmation Dialog Popup */}
      {joinGroupDetails && (
        <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#17212b] rounded-2xl w-full max-w-sm overflow-hidden border border-gray-800 shadow-2xl flex flex-col p-6 text-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-md">
              {(joinGroupDetails.chatName || 'Group').charAt(0).toUpperCase()}
            </div>
            
            <div className="flex flex-col gap-1.5">
              <h3 className="text-white text-lg font-black tracking-tight">Join Group Chat?</h3>
              <p className="text-gray-400 text-sm font-medium font-sans">
                Do you want to join the group <span className="text-blue-400 font-bold">"{joinGroupDetails.chatName || 'Group Chat'}"</span>?
              </p>
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider bg-[#0e1621] py-1 px-2.5 rounded-full w-fit mx-auto mt-2">
                👥 {joinGroupDetails.memberCount || 0} members
              </span>
            </div>

            <div className="flex gap-2.5 mt-3 w-full">
              <button
                type="button"
                onClick={handleCancelJoin}
                className="flex-1 py-3 rounded-xl bg-[#242f3d] hover:bg-[#2d3a4b] text-gray-300 text-xs font-bold transition-all border border-[#2b394a]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={joining}
                onClick={handleConfirmJoin}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/25 active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {joining ? 'Joining...' : 'Join Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
