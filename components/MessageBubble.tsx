import ReactMarkdown from 'react-markdown';
import { ShieldAlert, Fingerprint, User, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import SectionCard from './SectionCard';
import ReferencesList from './ReferencesList';
import { useState } from 'react';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

interface MessageBubbleProps {
  message: Message;
  partialObject?: any;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, partialObject, isStreaming = false }: MessageBubbleProps) {
  const ai = message.role === 'ASSISTANT';
  const [currentPage, setCurrentPage] = useState(0);
  
  // Try to parse the content as structured JSON. Fallback to basic rendering.
  let parsedContent: any = null;
  let isStructured = false;

  if (partialObject && isStreaming) {
    parsedContent = partialObject;
    isStructured = true;
  } else if (ai) {
    try {
      if (message.content.includes('"sections"')) {
         parsedContent = JSON.parse(message.content);
         if (parsedContent?.sections) {
           isStructured = true;
         }
      }
    } catch (e) {
      console.log("Not structured content or incomplete JSON, rendering as text.");
    }
  }

  // Fallback vars for unstructured content
  let displayContent = message.content;
  let confidence: number | null = null;
  let disclaimer = '';

  if (ai && !isStructured && displayContent.includes('Confidence:')) {
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

  const sections = parsedContent?.sections || [];
  const cardsPerPage = 2;
  const totalPages = Math.ceil(sections.length / cardsPerPage);
  
  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(0, p - 1));
  };
  const handleNextPage = () => {
    setCurrentPage(p => Math.min(totalPages - 1, p + 1));
  };

  const visibleSections = sections.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage);

  return (
    <div className={`${ai ? 'mr-0 md:mr-4 ml-4' : 'ml-12 md:ml-24 mr-4'} space-y-2 mb-10`}>
      <div className={`flex items-center gap-2 ${ai ? 'justify-start' : 'justify-end'}`}>
        {ai && <Fingerprint size={14} className="text-[#6f7d99]" />}
        <div className={`text-[12px] font-semibold tracking-[0.14em] uppercase text-[#6f7d99]`}>
          {ai ? 'Corp Law AI' : 'User'}
        </div>
        {!ai && <User size={14} className="text-[#6f7d99]" />}
      </div>
      
      <div className={`relative flex flex-col ${ai ? 'items-start' : 'items-end'} w-full`}>
        {ai ? (
          <div className="space-y-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
            {isStructured && parsedContent ? (
              <div className="w-full">
                {/* Confidence Meter Header */}
                {parsedContent.confidence !== undefined && (
                  <div className="flex items-center gap-3 mb-4 px-1">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden w-24 max-w-[200px]">
                      <div 
                        className={`h-full transition-all duration-500 ease-out ${
                          parsedContent.confidence >= 80 ? 'bg-emerald-500' :
                          parsedContent.confidence >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${parsedContent.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {Math.round(parsedContent.confidence)}% Confidence
                    </span>
                  </div>
                )}

                {/* Dynamic Sections Carousel */}
                {sections.length > 0 && (
                  <div className="relative">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-fr mt-2 min-h-[350px]">
                      {visibleSections.map((section: any, idx: number) => (
                        <div key={idx + currentPage * cardsPerPage} className="h-full">
                          <SectionCard
                            topic={section.topic || "Generating..."}
                            summary={section.summary}
                            content={section.content || ""}
                            legalTerms={parsedContent.legalTerms}
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Carousel Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-3 mt-6">
                        <button 
                          onClick={handlePrevPage}
                          disabled={currentPage === 0}
                          className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="text-xs font-semibold text-slate-500">
                          {currentPage + 1} / {totalPages}
                        </div>
                        <button 
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages - 1}
                          className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Loading State for Sections */}
                {isStreaming && (!sections || sections.length === 0) && (
                   <div className="bg-white border border-[#dde1ec] text-slate-500 px-6 py-4 rounded-2xl rounded-tl-sm shadow-sm italic text-sm mt-3 w-fit">
                     Analyzing jurisdiction and compiling laws...
                   </div>
                )}

                {/* References Component */}
                {parsedContent.references && parsedContent.references.length > 0 && (
                   <div className="mt-8 w-full max-w-4xl">
                      <ReferencesList references={parsedContent.references} />
                   </div>
                )}

                {/* Disclaimer Footer generated by AI */}
                {parsedContent.disclaimer && (
                  <div className="mt-8 flex items-start gap-3 bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl text-amber-800/80 text-xs shadow-sm max-w-4xl">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                    <p className="leading-relaxed font-medium">{parsedContent.disclaimer}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Unstructured fallback */
              <div className="bg-white rounded-2xl p-6 border border-[#dde1ec] text-[15px] leading-[1.8] text-[#2c3e50] shadow-sm max-w-4xl w-full">
                <div className="prose prose-slate max-w-none prose-p:mb-4 prose-headings:mb-4 prose-li:mb-1">
                  <ReactMarkdown>{displayContent}</ReactMarkdown>
                </div>
                {confidence !== null && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${confColor}`}>
                      {confidence}% Confidence
                    </div>
                  </div>
                )}
                {disclaimer && (
                  <div className="mt-4 pt-3 flex items-start gap-2 text-[12px] text-slate-400 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <ShieldAlert size={14} className="mt-0.5 flex-shrink-0" />
                    <p className="leading-tight">{disclaimer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#2c3e50] text-[#f8f9fa] rounded-2xl rounded-br-sm px-5 py-3.5 text-[15px] font-medium leading-[1.6] shadow-sm border border-[#1a252f] max-w-[85%] break-words">
            {displayContent}
          </div>
        )}
        <div className={`text-[11px] font-semibold text-[#8a98b0] mt-1.5 px-1 tracking-wide ${ai ? 'self-start' : 'self-end'}`}>
          {time}
        </div>
      </div>
    </div>
  );
}