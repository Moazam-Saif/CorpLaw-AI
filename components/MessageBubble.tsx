import ReactMarkdown from 'react-markdown';
import { ShieldAlert, Fingerprint, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

export default function MessageBubble({ message }: { message: Message }) {
  const ai = message.role === 'ASSISTANT';
  
  let displayContent = message.content;
  let confidence: number | null = null;
  let disclaimer = '';

  if (ai && displayContent.includes('Confidence:')) {
    const confMatch = displayContent.match(/Confidence:\s*(\d+)%/i);
    if (confMatch) {
      confidence = parseInt(confMatch[1], 10);
    }
    displayContent = displayContent.replace(/Confidence:\s*\d+%\s*\n\n/i, '');
    
    const parts = displayContent.split('\n\n*');
    if (parts.length > 1) {
      disclaimer = parts[parts.length - 1].replace(/\*/g, '').trim();
      displayContent = parts.slice(0, -1).join('\n\n*').trim();
    }
  }

  let confColor = 'bg-slate-200 text-slate-700';
  if (confidence !== null) {
    if (confidence >= 80) confColor = 'bg-green-100 text-green-800 border border-green-200';
    else if (confidence >= 60) confColor = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    else confColor = 'bg-red-100 text-red-800 border border-red-200';
  }

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`${ai ? 'mr-12 md:mr-24 ml-4' : 'ml-12 md:ml-24 mr-4'} space-y-2 mb-6`}>
      <div className={`flex items-center gap-2 ${ai ? 'justify-start' : 'justify-end'}`}>
        {ai && <Fingerprint size={14} className="text-[#6f7d99]" />}
        <div className={`text-[12px] font-semibold tracking-[0.14em] uppercase text-[#6f7d99]`}>
          {ai ? 'Corp Law AI' : 'User'}
        </div>
        {!ai && <User size={14} className="text-[#6f7d99]" />}
      </div>

      <div className={`rounded-2xl px-5 py-5 text-[15px] leading-relax shadow-sm ${
        ai ? 'bg-white border border-[#dde1ec] text-[#1a2744] rounded-tl-sm' 
           : 'bg-[#1a2744] border-[#1a2744] text-white rounded-tr-sm'
      }`}>
        {ai ? (
          <div className="prose prose-sm max-w-none text-[#1a2744]">
          <ReactMarkdown>{displayContent}</ReactMarkdown>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{displayContent}</p>
        )}
      </div>

      <div className={`flex flex-col ${ai ? 'items-start' : 'items-end'}`}>
        {ai && (confidence !== null || disclaimer) && (
          <div className="flex flex-col gap-1.5 mt-1 w-full text-xs text-[#6b7080]">
            {confidence !== null && (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${confColor}`}>
                  {confidence}% Confidence
                </span>
                {confidence < 60 && <span className="text-red-500 font-medium">Low confidence answer</span>}
              </div>
            )}
            
            {disclaimer && (
              <div className="flex items-center gap-1.5 mt-1 text-[11px] italic text-[#8891a8]">
                <ShieldAlert size={12} className="text-red-400" />
                {disclaimer}
              </div>
            )}
          </div>
        )}
        <div className="text-[12px] text-[#94a0b8] mt-1">{time}</div>
      </div>
    </div>
  );
}