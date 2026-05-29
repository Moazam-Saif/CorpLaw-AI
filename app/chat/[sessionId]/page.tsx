'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { experimental_useObject as useObject } from '@ai-sdk/react';
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
  draft: z.string().optional(),
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
  const [openMessageId, setOpenMessageId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Vercel AI SDK useObject hook for streaming partial JSON
  const { object, submit, isLoading: isStreaming } = useObject({
    api: '/api/chat',
    schema: aiResponseSchema,
    onFinish: ({ object }) => {
      // Create a final ASSISTANT message to save to local state when stream finishes
      if (object) {
        const finalMessageId = Date.now().toString();
        const finalAiMsg: Message = {
          id: finalMessageId,
          role: 'ASSISTANT',
          content: JSON.stringify(object),
          createdAt: new Date().toISOString(),
        };
        setOpenMessageId(finalMessageId);
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

  // Auto-scroll disabled: user will control scrolling manually.
  // To re-enable auto-scrolling only when the user is already at
  // the bottom, implement a 'isAtBottom' check before setting scrollTop.

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

  // Group messages into Q&A pairs
  const groupedMessages = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'USER') {
      const p = { userMsg: messages[i], aiMsg: null as Message | null };
      if (i + 1 < messages.length && messages[i + 1].role === 'ASSISTANT') {
        p.aiMsg = messages[i + 1];
        i++;
      }
      groupedMessages.push(p);
    } else {
      groupedMessages.push({ userMsg: null, aiMsg: messages[i] });
    }
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[#f0f2f7] text-slate-900">
      <Sidebar />

      <section className="flex flex-1 flex-col bg-[#f5f6fa] overflow-hidden">
        <div className="shrink-0 h-13 relative z-20">
          <Header />
        </div>

        <div ref={scrollContainerRef} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 px-4 md:px-10 pt-6 overflow-y-auto min-h-0">
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
              <div className="mx-auto max-w-6xl w-full flex flex-wrap gap-8 justify-center">
                {groupedMessages.map((pair, index) => {
                  if (pair.aiMsg) {
                    return (
                      <MessageBubble
                        key={pair.aiMsg.id}
                        message={pair.aiMsg}
                        userMessage={pair.userMsg?.content}
                        index={index}
                        defaultOpen={pair.aiMsg.id === openMessageId}
                      />
                    );
                  } else {
                    // User message still waiting for AI response

                    // Calculate styles matching the alternating scheme
                    const themeIndex = index % 4;
                    let sBg, sBorder, sTape, lA, tA;
                    if (themeIndex === 0 || themeIndex === 2) {
                      sBg = 'bg-[#fbf5c6]'; sBorder = 'border-[#edcd6f]'; sTape = 'bg-[#e0d691]/50';
                      lA = 'text-[#d4af37]'; tA = 'text-[#4a4220]';
                    } else if (themeIndex === 1) {
                      sBg = 'bg-[#1B3B9B]'; sBorder = 'border-[#152e7a]'; sTape = 'bg-white/20';
                      lA = 'text-[#fbf5c6]/60'; tA = 'text-white';
                    } else {
                      sBg = 'bg-[#59ABE9]'; sBorder = 'border-white/30'; sTape = 'bg-white/30';
                      lA = 'text-[#fbf5c6]'; tA = 'text-white';
                    }

                    return (
                      <div key={pair.userMsg?.id || index} className={`w-[300px] h-[300px] ${sBg} p-6 shadow-md border ${sBorder} font-['Afacad',sans-serif] flex flex-col transform rotate-1 rounded-sm relative`}>
                        <div className={`absolute top-[-10px] left-1/2 -translate-x-1/2 w-12 h-5 ${sTape} backdrop-blur-sm -rotate-3 rounded-sm shadow-sm`} />
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[13px] font-[800] uppercase tracking-wider ${lA}`}>Query</span>
                        </div>
                        <p className={`text-[18px] font-[600] ${tA} leading-snug line-clamp-6`}>
                          {pair.userMsg?.content}
                        </p>
                        <div className="mt-auto flex items-center justify-center">
                          <Loader2 className={`animate-spin ${lA}`} size={20} />
                        </div>
                      </div>
                    );
                  }
                })}

                {isStreaming && (
                  <MessageBubble
                    message={{
                      id: 'streaming',
                      role: 'ASSISTANT',
                      content: 'STREAMING',
                      createdAt: new Date().toISOString(),
                    }}
                    userMessage={groupedMessages[groupedMessages.length - 1]?.userMsg?.content}
                    partialObject={object}
                    isStreaming={true}
                    index={groupedMessages.length}
                    defaultOpen={true}
                  />
                )}
              </div>
            )}

          </div>
        </div>
        <div className="shrink-0">
          <ChatInput onSubmit={handleSendMessage} isLoading={isStreaming} />
        </div>
      </section>
    </main>
  );
}