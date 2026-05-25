import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SectionCardProps {
  topic: string;
  summary: string;
  content: string; // Markdown
  legalTerms?: { term: string; definition: string }[];
}

export default function SectionCard({ topic, summary, content, legalTerms = [] }: SectionCardProps) {
  
  // Custom renderer for the markdown paragraphs
  // This looks through text nodes and wraps matching legal terms in Tooltips
  const renderTextWithTooltips = (text: string) => {
    if (!legalTerms || legalTerms.length === 0) return text;
    
    // Sort terms by length descending to match longest terms first (e.g., "Fiduciary Duty" before "Fiduciary")
    const sortedTerms = [...legalTerms].sort((a, b) => b.term.length - a.term.length);
    
    // Escape terms for regex
    const escapedTerms = sortedTerms.map(t => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    
    const parts = text.split(pattern);
    
    return parts.map((part, i) => {
      const matchedTerm = sortedTerms.find(
        t => t.term.toLowerCase() === part.toLowerCase()
      );
      
      if (matchedTerm) {
        return (
          <TooltipProvider key={i} delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-semibold text-white underline decoration-slate-500 decoration-dotted underline-offset-4 cursor-help transition-colors hover:text-indigo-300 hover:decoration-indigo-400 hover:bg-slate-800 px-0.5 rounded">
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <p className="font-semibold mb-1 text-indigo-300">{matchedTerm.term}</p>
                <p className="text-slate-200 text-sm leading-snug">{matchedTerm.definition}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-[#1e293b] border border-slate-700 rounded-xl shadow-sm h-full flex flex-col transition-all duration-300 overflow-hidden">
      <div className="bg-[#0f172a] border-b border-slate-700 px-5 py-3 rounded-t-xl shrink-0">
        <h3 className="font-semibold text-white text-base line-clamp-2">{topic}</h3>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        {summary && (
          <div className="bg-slate-800/80 border-l-4 border-indigo-400 p-3 italic text-slate-300 text-[15px] rounded-r-md">
            {summary}
          </div>
        )}
        <div className="prose prose-invert prose-p:leading-relaxed prose-headings:text-white prose-a:text-indigo-400 text-slate-200 text-[15px]">
          <ReactMarkdown
            components={{
              text: ({ children }) => {
                if (typeof children === 'string') {
                  return <>{renderTextWithTooltips(children)}</>;
                }
                return <>{children}</>;
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}