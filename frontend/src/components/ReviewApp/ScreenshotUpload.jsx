import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

export default function ScreenshotUpload({ onFileSelect }) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      onFileSelect(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    onFileSelect(null);
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">Upload Screenshot (Max 5MB)</label>
      
      {!preview ? (
        <div className="relative border-2 border-dashed border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-700/30 hover:bg-gray-700/50 transition-colors cursor-pointer group">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/jpeg, image/png, image/jpg"
            onChange={handleFileChange}
          />
          <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-400 mb-3 transition-colors" />
          <p className="text-sm text-gray-400 text-center">
            Click or drag and drop to upload<br/>
            <span className="text-xs">JPG, PNG up to 5MB</span>
          </p>
        </div>
      ) : (
        <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-600">
          <img src={preview} alt="Preview" className="w-full h-full object-contain bg-gray-900" />
          <button
            onClick={clearPreview}
            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
