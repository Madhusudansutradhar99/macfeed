import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { ReviewAuthContext } from './ReviewAuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(ReviewAuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      setSocket(newSocket);

      newSocket.emit('setup', user);
      newSocket.emit('joinRoom', { userId: user._id });

      return () => newSocket.close();
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
