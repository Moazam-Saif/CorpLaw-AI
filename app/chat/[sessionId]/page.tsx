'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ChatInput from '@/components/ChatInput';
import MessageBubble from '@/components/MessageBubble';
import { Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export default function ChatSessionPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [initLoading, setInitLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setInitLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const optimisticUserMsg: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, optimisticUserMsg]);
    setSending(true);

    try {
      const country = localStorage.getItem('corplaw_country') || 'Global';
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text, country }),
      });

      if (res.ok) {
        const { message: newAiMsg } = await res.json();
        setMessages(prev => [...prev, newAiMsg]);
      } else {
        alert('Failed to get response from AI. Please try again.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex h-screen overflow-hidden bg-[#f0f2f7] text-slate-900">
      <Sidebar />
      <section className="flex flex-1 flex-col bg-[#f5f6fa] relative">
        <Header />
        
        <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6">
          {initLoading ? (
            <div className="h-full w-full flex items-center justify-center text-slate-400 gap-2">
              <Loader2 className="animate-spin" size={20} /> Loading chat...
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
              <p className="mb-2">This is the beginning of your conversation.</p>
              <p className="text-sm">Start asking your corporate legal inquiries below.</p>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl w-full flex flex-col">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              
              {sending && (
                <div className="flex items-center gap-3 text-slate-400 mt-4 mb-10 pl-16">
                  <div className="flex gap-1.5 p-3 rounded-xl bg-white border border-[#dde1ec]">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs uppercase tracking-widest font-semibold">Corp Law AI is thinking...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <ChatInput onSubmit={handleSendMessage} isLoading={sending} />
      </section>
    </main>
  );
}