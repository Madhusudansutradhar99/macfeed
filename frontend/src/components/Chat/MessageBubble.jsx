import React from 'react';
import { Check, CheckCheck, Trash2 } from 'lucide-react';

export default function MessageBubble({ message, isOwn, showSenderName, onUploadScreenshot, onDeleteMessage, currentUserId, isAdmin }) {
  const senderName = typeof message.senderId === 'object' ? message.senderId?.name : 'User';
  
  const senderIdStr = typeof message.senderId === 'object' ? message.senderId?._id : message.senderId;
  const canDelete = isOwn || isAdmin || (senderIdStr === currentUserId);

  const renderMessageContent = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const isJoinLink = part.includes('?join=');
        return (
          <a
            key={index}
            href={part}
            target={isJoinLink ? "_self" : "_blank"}
            rel="noopener noreferrer"
            className="text-yellow-400 hover:text-yellow-300 underline break-all font-semibold inline-flex items-center gap-0.5"
          >
            {isJoinLink ? "🔗 Click to Join Group" : part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-[#17212b] text-gray-100 rounded-bl-none border border-gray-800'
        }`}
      >
        {showSenderName && (
          <p className="text-xs font-bold text-blue-400 mb-1.5">{senderName}</p>
        )}

        {/* ── App Task Card Payout ── */}
        {message.appTaskId && (
          <div className="mb-2.5 p-3 bg-[#1e2c3a] rounded-xl border border-gray-800 flex flex-col gap-2.5 max-w-sm text-xs shadow-inner">
            <div className="flex gap-3 items-center">
              <img 
                src={message.appTaskId.icon || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=64&h=64&fit=crop'} 
                className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-md" 
                alt="App Icon" 
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white text-[13px] truncate">{message.appTaskId.name}</h4>
                <p className="text-[10px] text-green-400 font-extrabold mt-0.5 uppercase tracking-wider">Reward: ₹{message.appTaskId.rewardAmount}</p>
              </div>
            </div>
            {message.appTaskId.instructions && (
              <p className="text-gray-300 leading-relaxed bg-[#141d26] p-2 rounded-lg border border-gray-800/40 text-[11px]">
                {message.appTaskId.instructions}
              </p>
            )}
            <div className="flex gap-2 mt-1">
              <a 
                href={message.appTaskId.playStoreLink} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-wider text-center transition-colors shadow-sm shadow-blue-500/10"
              >
                Download
              </a>
              {!isOwn && onUploadScreenshot && (
                <button
                  type="button"
                  onClick={() => onUploadScreenshot(message.appTaskId)}
                  className="flex-1 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] tracking-wider text-center transition-colors shadow-sm shadow-green-500/10"
                >
                  Submit Review
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Image Screenshot Attachment ── */}
        {message.attachmentUrl && (
          <div className="mb-2 max-w-xs overflow-hidden rounded-xl border border-gray-800/60 bg-black/25">
            <img 
              src={message.attachmentUrl} 
              alt="Attachment Screenshot" 
              className="max-h-60 w-full object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
              onClick={() => window.open(message.attachmentUrl, '_blank')}
            />
          </div>
        )}

        {/* ── Text Content ── */}
        {message.content && (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {renderMessageContent(message.content)}
          </p>
        )}

        {/* ── Time, Read receipt status, and Delete option ── */}
        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && (
            <span className="inline-flex align-middle shrink-0 ml-1">
              {message.isRead ? (
                <CheckCheck size={13} className="text-sky-300" />
              ) : (
                <Check size={13} className="text-blue-200/60" />
              )}
            </span>
          )}
          {canDelete && onDeleteMessage && (
            <button
              onClick={() => onDeleteMessage(message._id)}
              className="opacity-70 hover:opacity-100 ml-1.5 p-0.5 rounded text-red-300 hover:text-red-400 hover:bg-black/10 align-middle inline-flex shrink-0"
              title="Delete Message"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
