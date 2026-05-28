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
    <main className="flex h-screen overflow-hidden bg-[#f0f2f7] text-slate-900">
      <Sidebar />
      <section className="flex flex-1 flex-col bg-[#f5f6fa]">
        <Header />
        <div className="flex-1 overflow-y-auto min-h-0">
          <HeroCards />
        </div>
        <ChatInput onSubmit={handleStartSession} isLoading={creating} />
      </section>
    </main>
  );
}