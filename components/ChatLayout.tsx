import Sidebar from './Sidebar';
import Header from './Header';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

export default function ChatLayout(){
  return (
    <main className="flex h-screen overflow-hidden bg-[#eef0f6]">
      <Sidebar />
      <section className="flex-1 flex flex-col">
        <Header />
        <div className="flex-1 overflow-y-auto px-10 py-8 relative">
          <div className="absolute inset-0 flex items-center justify-center text-[280px] text-slate-300/10 pointer-events-none select-none">|</div>
          <div className="max-w-5xl mx-auto space-y-10 relative z-10">
            <MessageBubble message={{ id: "1", role: "ASSISTANT", content: "I have completed the initial review of the patent filing for the Neural-Grid Mesh Protocol. Based on current precedents, there are potential infringement risks regarding the 2021 Data-Lock Technologies case.", createdAt: new Date().toISOString() }} />
            <MessageBubble message={{ id: "2", role: "USER", content: "Analyze the key similarities first. Please focus specifically on the Adaptive Error Correction claims in Section 4.2.", createdAt: new Date().toISOString() }} />
            <MessageBubble message={{ id: "3", role: "ASSISTANT", content: "Comparing the technical specifications: Algorithmic overlap exists, but claim breadth differs significantly. The current filing may still distinguish itself through implementation details.", createdAt: new Date().toISOString() }} />
          </div>
        </div>
        <ChatInput />
      </section>
    </main>
  )
}