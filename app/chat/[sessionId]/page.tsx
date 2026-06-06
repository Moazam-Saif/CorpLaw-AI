'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ChatInput from '@/components/ChatInput';
import MessageBubble from '@/components/MessageBubble';
import themeChoices from '@/lib/theme';
import { Loader2 } from 'lucide-react';

// Memoize layout chrome so useSession() re-renders in Header/Sidebar
// don't ripple down into the chat state and reset streaming.
const MemoHeader = memo(Header);
const MemoSidebar = memo(Sidebar);

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  themeIdx?: number;
}

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

  // Use a ref for streamingUserMessage so auth re-renders don't reset it.
  // We also mirror it into state so the JSX re-renders when it changes.
  const streamingUserMessageRef = useRef<string | null>(null);
  const [streamingUserMessage, setStreamingUserMessage] = useState<string | null>(null);

  const setStreamingQuery = (val: string | null) => {
    streamingUserMessageRef.current = val;
    setStreamingUserMessage(val);
  };

  const { object, submit, isLoading: isStreaming } = useObject({
    api: '/api/chat',
    schema: aiResponseSchema,
    onFinish: ({ object }) => {
      if (object) {
        const finalAiMsg: Message = {
          id: Date.now().toString(),
          role: 'ASSISTANT',
          content: JSON.stringify(object),
          createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, finalAiMsg]);
      }
      // Don't clear streamingUserMessage here — the streaming bubble
      // will unmount naturally once isStreaming becomes false.
    },
    onError: (error) => {
      console.error('Streaming error:', error);
      setStreamingQuery(null);
      alert('Failed to get response from AI. Please try again.');
    },
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
  }, [sessionId]);               // intentionally only re-run on sessionId change

  const handleSendMessage = (text: string) => {
    if (!text.trim() || isStreaming) return;

    const optimisticUserMsg: Message = {
      id: Date.now().toString(),
      role: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
      themeIdx: Math.floor(Math.random() * 3),
    };

    setMessages(prev => [...prev, optimisticUserMsg]);
    setStreamingQuery(text);

    const country = localStorage.getItem('corplaw_country') || 'Global';
    submit({ sessionId, message: text, country });
  };

  useEffect(() => {
    if (initialInput && !initLoading) {
      handleSendMessage(initialInput);
      setInitialInput(null);
    }
  }, [initialInput, initLoading]);

  // While streaming, exclude the last USER message from settled pairs —
  // the streaming bubble owns that pair.
  const settledMessages = isStreaming ? messages.slice(0, -1) : messages;

  const groupedMessages: { userMsg: Message | null; aiMsg: Message | null }[] = [];
  for (let i = 0; i < settledMessages.length; i++) {
    if (settledMessages[i].role === 'USER') {
      const p: { userMsg: Message | null; aiMsg: Message | null } = {
        userMsg: settledMessages[i],
        aiMsg: null,
      };
      if (i + 1 < settledMessages.length && settledMessages[i + 1].role === 'ASSISTANT') {
        p.aiMsg = settledMessages[i + 1];
        i++;
      }
      groupedMessages.push(p);
    } else {
      groupedMessages.push({ userMsg: null, aiMsg: settledMessages[i] });
    }
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f0f2f7] text-slate-900">
      <div className="shrink-0 relative z-20">
        <MemoHeader />
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <MemoSidebar />

        <section className="flex flex-1 flex-col bg-[#EAEDF2] overflow-hidden">
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 px-4 md:px-10 pt-6 overflow-y-auto min-h-0">
              {initLoading ? (
                <div className="h-full w-full flex items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="animate-spin" size={20} /> Loading chat...
                </div>
              ) : messages.length === 0 && !isStreaming ? (
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
                          defaultOpen={false}
                        />
                      );
                    } else if (pair.userMsg) {
                      const chosenIdx = pair.userMsg.themeIdx ?? (index % themeChoices.length);
                      const { sBg, sBorder, sTape, lA, tA } = themeChoices[chosenIdx];
                      return (
                        <div key={pair.userMsg.id} className={`w-[300px] h-[300px] ${sBg} p-6 shadow-md border ${sBorder} font-['Afacad',sans-serif] flex flex-col transform rotate-1 rounded-sm relative`}>
                          <div className={`absolute top-[-10px] left-1/2 -translate-x-1/2 w-12 h-5 ${sTape} backdrop-blur-sm -rotate-3 rounded-sm shadow-sm`} />
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`text-[13px] font-[800] uppercase tracking-wider ${lA}`}>Query</span>
                          </div>
                          <p className={`text-[18px] font-[600] ${tA} leading-snug line-clamp-6`}>
                            {pair.userMsg.content}
                          </p>
                          <div className="mt-auto flex items-center justify-center">
                            <Loader2 className={`animate-spin ${lA}`} size={20} />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}

                  {/* Streaming bubble — lives for the entire duration of the stream */}
                  {isStreaming && (
                    <MessageBubble
                      key="streaming"
                      message={{
                        id: 'streaming',
                        role: 'ASSISTANT',
                        content: 'STREAMING',
                        createdAt: new Date().toISOString(),
                      }}
                      userMessage={streamingUserMessageRef.current ?? undefined}
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
      </div>
    </main>
  );
}
