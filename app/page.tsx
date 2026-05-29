'use client';

import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import HeroCards from '@/components/HeroCards';
import ChatInput from '@/components/ChatInput';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Page() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleStartSession = async (message: string) => {
    setCreating(true);
    try {
      const res = await fetch('/api/sessions', { method: 'POST' });
      if (res.ok) {
        const session = await res.json();
        const encodedMessage = encodeURIComponent(message);
        router.push(`/chat/${session.id}?initialMessage=${encodedMessage}`);
      }
    } catch (e) {
      console.error(e);
      setCreating(false);
    }
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-[#f0f2f7] text-slate-900">
      <div className="shrink-0 relative z-20">
        <Header />
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />

        <section className="flex flex-1 flex-col bg-[#f5f6fa] overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto relative z-0">
            <HeroCards />
          </div>
          <div className="shrink-0 relative z-30">
            <ChatInput onSubmit={handleStartSession} isLoading={creating} />
          </div>
        </section>
      </div>
    </main>
  );
}