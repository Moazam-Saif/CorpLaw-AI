'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, KeyboardEvent } from 'react';

type ChatInputProps = {
  onSubmit?: (message: string) => void;
  isLoading?: boolean;
};

export default function ChatInput({ onSubmit, isLoading }: ChatInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    if (onSubmit) onSubmit(message);
    setMessage('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[20vh] bg-transparent px-4 pb-0 pt-2 shrink-0 flex justify-center items-end w-full pointer-events-auto border-2 border-red-500/80">
      <div 
        className="flex items-end justify-center -space-x-8 relative cursor-pointer hover:scale-105 transition-transform duration-300 md:ml-10 border-2 border-cyan-400/90"
        onClick={() => setIsOpen(true)}
      >
        
        
        {/* Middle layer: note-light */}
        <div className="w-[80px] md:w-[96px] shrink-0 drop-shadow-md z-10 -rotate-[10deg] transform translate-y-10 -translate-x-8">
          <Image 
            src="/note-light.png" 
            alt="Light note" 
            width={96}
            height={96}
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Top layer: note-yellow */}
        <div className="w-[74px] md:w-[90px] shrink-0 drop-shadow-xl transform translate-y-7 -translate-x-10">
          <Image 
            src="/note-yellow.png" 
            alt="Yellow note" 
            width={90}
            height={90}
            className="w-full h-auto object-contain"
          />
        </div>
        {/* Base layer: note-dark */}
        <div className="w-[80px] md:w-[96px] shrink-0 drop-shadow-md z-0 rotate-[12deg] transform translate-y-12 -translate-x-10">
          <Image 
            src="/note-dark.png" 
            alt="Dark note" 
            width={96} 
            height={96} 
            className="w-full h-auto object-contain"
            priority
          />
        </div>

        {/* Pen accent */}
        <div className="absolute right-[-10px] top-1/2 w-[80px] md:w-[96px] shrink-0 z-30 drop-shadow-xl transform -translate-y-4 rotate-[99deg] translate-x-10 pointer-events-none">
          <Image 
            src="/pen.png" 
            alt="Pen" 
            width={96}
            height={96}
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-md px-4 font-['Afacad',sans-serif]">
          <style dangerouslySetInnerHTML={{__html: "@import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700;800&display=swap');"}} />
          {/* Overlay Background Click to Close */}
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
          
          {/* Main Input Card */}
          <div 
            className="relative w-[420px] md:w-[520px] min-h-[480px] rounded-none shadow-2xl flex flex-col justify-between p-[20px] pt-[22px] z-10"
            style={{ background: 'linear-gradient(145deg, #59ABE9 0%, #1B3B9B 100%)' }}
          >
            {/* Container 1: Text Box */}
            <div className="flex-1 flex flex-col border-2 border-[#1B3B9B] rounded-[10px] px-[16px] py-[14px] mb-[20px]">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Message Corp Law AI..."
                className="flex-1 resize-none bg-transparent outline-none text-white text-[17px] font-[700] leading-[1.65] placeholder:text-white/60 font-['Afacad',sans-serif]"
              />
            </div>

            {/* Container 2: Submit Button */}
            <div className="flex justify-end shrink-0">
              <button 
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                className="bg-[#1B3B9B] text-white rounded-[999px] px-[28px] py-[13px] text-[14px] font-[800] tracking-[1.5px] uppercase hover:bg-[#152e7a] transition-colors disabled:opacity-50 font-['Afacad',sans-serif]"
              >
                ASK AWAY!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}