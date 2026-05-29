'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Quicksand } from 'next/font/google';
import { PenLine, User, Settings, Plus, Trash2 } from 'lucide-react';

const quicksand = Quicksand({ subsets: ['latin'] });

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
    <aside className={`hidden md:flex w-72 border-r bg-slate-100 flex-col h-full shrink-0 pt-3 ${quicksand.className}`}>
      <button 
        onClick={createSession}
        className="mx-3 mt-5 rounded-full bg-slate-900 text-white px-3 py-1.5 flex gap-2 items-center justify-center hover:bg-slate-800 transition"
      >
        <Plus size={15} />
        <span className="text-[13px] font-semibold tracking-[0.18em]">New Chat</span>
      </button>
      <nav className="sidebar-scrollbar flex-1 mt-5 overflow-y-auto">
        <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Recent Conversations
        </div>
        <div className="px-2">
          {sessions.map((s, index) => (
            <div key={s.id}>
              <div 
                onClick={() => router.push(`/chat/${s.id}`)}
                className={`group px-2 py-4 flex gap-3 items-center justify-between cursor-pointer hover:bg-slate-200 transition ${activeSessionId === s.id ? 'bg-slate-200 border-l-4 border-slate-900' : 'border-l-4 border-transparent'}`}
              >
                <div className="flex gap-3 items-center overflow-hidden">
                  <PenLine size={14} className="shrink-0 text-slate-600" /> 
                  <span className="truncate text-sm font-medium text-slate-700">{s.title || 'New Session'}</span>
                </div>
                <button 
                  onClick={(e) => deleteSession(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </nav>
      <div className="border-t py-2 shrink-0">
        <div className="px-4 py-3 flex gap-3 text-slate-700 hover:bg-slate-200 cursor-pointer"><User size={18}/> User Account</div>
        <div className="px-4 py-3 flex gap-3 text-slate-700 hover:bg-slate-200 cursor-pointer"><Settings size={18}/> Settings</div>
      </div>

      <style jsx global>{`
        .sidebar-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #1a2744 transparent;
        }

        .sidebar-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-scrollbar::-webkit-scrollbar-thumb {
          background-color: #1a2744;
          border-radius: 9999px;
        }

        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #0f1a2d;
        }
      `}</style>
    </aside>
  );
}