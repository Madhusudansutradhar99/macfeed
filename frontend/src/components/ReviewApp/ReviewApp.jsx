import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ReviewHomePage from '../../pages/ReviewHomePage';
import UserDashboardPage from '../../pages/UserDashboardPage';
import AdminPage from '../../pages/AdminPage';
import ChatPage from '../../pages/ChatPage';
import { ReviewAuthProvider } from '../../context/ReviewAuthContext';
import { SocketProvider } from '../../context/SocketContext';
import { Toaster } from 'react-hot-toast';
import ReviewLayout from './ReviewLayout';

export default function ReviewApp() {
  return (
    // We wrap ReviewApp with our new Auth and Socket providers.
    // If there's an existing app-level ReviewAuthProvider, this local one will handle the review app state.
    <ReviewAuthProvider>
      <SocketProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route element={<ReviewLayout />}>
            <Route path="/" element={<ChatPage />} />
            <Route path="/tasks" element={<ChatPage />} />
            <Route path="/dashboard" element={<ChatPage />} />
            <Route path="/admin" element={<ChatPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Route>
        </Routes>
      </SocketProvider>
    </ReviewAuthProvider>
  );
}
