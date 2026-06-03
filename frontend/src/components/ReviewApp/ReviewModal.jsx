import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import ScreenshotUpload from './ScreenshotUpload';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ReviewModal({ app, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please upload a screenshot');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('appId', app._id);
    formData.append('screenshot', file);

    try {
      await api.post('/reviews', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Review submitted successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/80 sticky top-0">
          <h3 className="text-xl font-bold text-white">Submit Review</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6 p-4 bg-blue-900/20 rounded-xl border border-blue-500/20">
            <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-white overflow-hidden">
              {app.icon ? <img src={app.icon} alt="icon" className="w-full h-full object-cover"/> : app.name.charAt(0)}
            </div>
            <div>
              <p className="text-white font-medium">{app.name}</p>
              <p className="text-blue-400 text-sm">Reward: ₹{app.rewardAmount}</p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Instructions:</h4>
            <p className="text-sm text-gray-400 bg-gray-900 p-4 rounded-xl border border-gray-700">
              {app.instructions}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <ScreenshotUpload onFileSelect={setFile} />
            
            <button
              type="submit"
              disabled={loading || !file}
              className="w-full mt-6 flex items-center justify-center py-3 px-4 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit for Approval'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
