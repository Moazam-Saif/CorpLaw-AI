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
            <MessageBubble role="ai" time="10:24 AM" content="I have completed the initial review of the patent filing for the Neural-Grid Mesh Protocol. Based on current precedents, there are potential infringement risks regarding the 2021 Data-Lock Technologies case." />
            <MessageBubble role="user" time="10:26 AM" content="Analyze the key similarities first. Please focus specifically on the Adaptive Error Correction claims in Section 4.2." />
            <MessageBubble role="ai" time="10:27 AM" content="Comparing the technical specifications: Algorithmic overlap exists, but claim breadth differs significantly. The current filing may still distinguish itself through implementation details." cta />
          </div>
        </div>
        <ChatInput />
      </section>
    </main>
  )
}