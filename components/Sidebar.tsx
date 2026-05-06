'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MessageSquare, Clock3, List, Archive, User, Settings, PlusSquare, Trash2 } from 'lucide-react';

type Session = {
  id: string;
  title: string | null;
  createdAt: string;
};

export default function Sidebar() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const router = useRouter();
  const params = useParams();
  const activeSessionId = params?.sessionId as string | undefined;

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [params]);

  const createSession = async () => {
    const res = await fetch('/api/sessions', { method: 'POST' });
    if (res.ok) {
      const newSession = await res.json();
      router.push(`/chat/${newSession.id}`);
    }
  };
  
  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (activeSessionId === id) {
        router.push('/');
      } else {
        fetchSessions();
      }
    }
  };

  return (
    <aside className="hidden md:flex w-72 border-r bg-slate-100 flex-col h-full shrink-0">
      <div 
        className="p-4 border-b font-bold text-slate-800 cursor-pointer"
        onClick={() => router.push('/')}
      >
        Corp Law AI
      </div>
      <button 
        onClick={createSession}
        className="mx-3 mt-4 rounded-lg bg-slate-900 text-white px-4 py-2 flex gap-2 items-center hover:bg-slate-800 transition"
      >
        <PlusSquare size={16}/> Start New Session
      </button>
      <nav className="flex-1 mt-4 overflow-y-auto">
        <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Recent Conversations
        </div>
        {sessions.map((s) => (
          <div 
            key={s.id} 
            onClick={() => router.push(`/chat/${s.id}`)}
            className={`group px-4 py-3 flex gap-3 items-center justify-between cursor-pointer hover:bg-slate-200 transition ${activeSessionId === s.id ? 'bg-slate-200 border-l-4 border-slate-900' : 'border-l-4 border-transparent'}`}
          >
            <div className="flex gap-3 items-center overflow-hidden">
              <MessageSquare size={16} className="shrink-0 text-slate-600" /> 
              <span className="truncate text-sm text-slate-700">{s.title || 'New Session'}</span>
            </div>
            <button 
              onClick={(e) => deleteSession(e, s.id)}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </nav>
      <div className="border-t py-2 shrink-0">
        <div className="px-4 py-3 flex gap-3 text-slate-700 hover:bg-slate-200 cursor-pointer"><User size={18}/> User Account</div>
        <div className="px-4 py-3 flex gap-3 text-slate-700 hover:bg-slate-200 cursor-pointer"><Settings size={18}/> Settings</div>
      </div>
    </aside>
  );
}