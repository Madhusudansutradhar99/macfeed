import React, { useState } from 'react';
import { supabase } from './supabaseClient';

console.log('Admin Panel Rendered');

export default function AdminPanel() {
  const [title, setTitle] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [uploadLocation, setUploadLocation] = useState('Normal Grid');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      let publicUrl = '';
      if (!thumbnail) throw new Error('No thumbnail selected');
      const fileExt = thumbnail.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, thumbnail);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(fileName);
      publicUrl = urlData.publicUrl;
      const { error: insertError } = await supabase.from('videos').insert([
        {
          title,
          youtube_id: youtubeId,
          category,
          thumbnail_url: publicUrl,
          upload_location: uploadLocation,
        },
      ]);
      if (insertError) throw insertError;
      setMessage('Video added successfully!');
      setTitle('');
      setYoutubeId('');
      setCategory('');
      setThumbnail(null);
    } catch (err) {
      setMessage(err.message || 'Error uploading video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Admin Panel: Add Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-left font-medium mb-1">Title</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-left font-medium mb-1">YouTube ID</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={youtubeId}
            onChange={(e) => setYoutubeId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-left font-medium mb-1">Category</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-left font-medium mb-1">Thumbnail</label>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            onChange={(e) => setThumbnail(e.target.files[0])}
            required
          />
        </div>
        <div>
          <label className="block text-left font-medium mb-1">Upload location:</label>
          <label>
            <input
              type="radio"
              name="uploadLocation"
              value="Normal Grid"
              checked={uploadLocation === 'Normal Grid'}
              onChange={() => setUploadLocation('Normal Grid')}
            />{' '}
            Normal Grid
          </label>
          <label>
            <input
              type="radio"
              name="uploadLocation"
              value="Header Banner"
              checked={uploadLocation === 'Header Banner'}
              onChange={() => setUploadLocation('Header Banner')}
            />{' '}
            Header Banner
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Submit'}
        </button>
        {message && <div className="mt-2 text-center text-sm text-red-500">{message}</div>}
      </form>
    </div>
  );
}
