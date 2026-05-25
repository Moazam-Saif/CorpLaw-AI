'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { experimental_useObject as useObject } from 'ai/react';
import { z } from 'zod';
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

// Define the exact schema the backend streams to the frontend
const aiResponseSchema = z.object({
  sections: z.array(
    z.object({
      topic: z.string(),
      summary: z.string(),
      content: z.string(),
    })
  ),
  legalTerms: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
    })
  ).optional(),
  references: z.array(
    z.object({
      title: z.string(),
      url: z.string().optional(),
      description: z.string().optional(),
    })
  ).optional(),
  confidence: z.number().optional(),
  disclaimer: z.string().optional(),
});

export default function ChatSessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [initLoading, setInitLoading] = useState(true);
  const [initialInput, setInitialInput] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Vercel AI SDK useObject hook for streaming partial JSON
  const { object, submit, isLoading: isStreaming } = useObject({
    api: '/api/chat',
    schema: aiResponseSchema,
    onFinish: ({ object }) => {
      // Create a final ASSISTANT message to save to local state when stream finishes
      if (object) {
        const finalAiMsg: Message = {
          id: Date.now().toString(),
          role: 'ASSISTANT',
          content: JSON.stringify(object),
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, finalAiMsg]);
      }
    },
    onError: (error) => {
      console.error("Streaming error:", error);
      alert('Failed to get response from AI. Please try again.');
    }
  });

  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          
          const initialMessage = searchParams?.get('initialMessage');
          if (data.messages?.length === 0 && initialMessage) {
            setInitialInput(initialMessage);
            router.replace(`/chat/${sessionId}`);
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setInitLoading(false);
      }
    };
    fetchSession();
  }, [sessionId, searchParams, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, object]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const optimisticUserMsg: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, optimisticUserMsg]);
    
    // Use the AI SDK hook to handle this request
    const country = localStorage.getItem('corplaw_country') || 'Global';
    submit({ sessionId, message: text, country });
  };

  useEffect(() => {
    if (initialInput && !initLoading) {
      handleSendMessage(initialInput);
      setInitialInput(null);
    }
  }, [initialInput, initLoading]);

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
              
              {isStreaming && object && (
                <MessageBubble 
                  message={{
                    id: 'streaming',
                    role: 'ASSISTANT', 
                    content: 'STREAMING',
                    createdAt: new Date().toISOString()
                  }} 
                  partialObject={object} 
                  isStreaming={true} 
                />
              )}
              
              {isStreaming && !object && (
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

        <ChatInput onSubmit={handleSendMessage} isLoading={isStreaming} />
      </section>
    </main>
  );
}