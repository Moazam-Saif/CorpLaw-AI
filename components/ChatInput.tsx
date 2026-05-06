'use client';

import { Paperclip, Send, Loader2 } from 'lucide-react';
import { useState, KeyboardEvent } from 'react';

type ChatInputProps = {
  onSubmit?: (message: string) => void;
  isLoading?: boolean;
};

export default function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    if (onSubmit) onSubmit(message);
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-[#f5f6fa] px-6 pb-3 pt-4 shrink-0">
      <div className="mx-auto max-w-5xl rounded-[12px] border border-[#d8dce8] bg-white px-4 py-3 shadow-sm flex items-center gap-3">
        <Paperclip size={18} className="text-[#aab0c0]" />
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Message Corp Law AI..."
          className="flex-1 bg-transparent outline-none text-[14px] text-[#1a2744] placeholder:text-[#aab0c0] disabled:opacity-50"
        />
        <button 
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="h-[34px] w-[34px] shrink-0 rounded-[8px] bg-[#1a2744] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#2a3a60] transition-colors"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}