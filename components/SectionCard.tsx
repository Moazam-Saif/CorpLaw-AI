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
                <span className="font-semibold text-slate-800 underline decoration-slate-400 decoration-dotted underline-offset-4 cursor-help transition-colors hover:text-blue-600 hover:decoration-blue-600 hover:bg-blue-50 px-0.5 rounded">
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[300px]">
                <p className="font-semibold mb-1 text-blue-300">{matchedTerm.term}</p>
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
    <div className="bg-white border text-sm border-slate-200 rounded-xl shadow-sm mb-4 transition-all duration-300">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 rounded-t-xl">
        <h3 className="font-semibold text-slate-800 text-base">{topic}</h3>
      </div>
      <div className="p-5 space-y-4">
        {summary && (
          <div className="bg-blue-50/70 border-l-4 border-blue-400 p-3 italic text-slate-700 text-[15px] rounded-r-md">
            {summary}
          </div>
        )}
        <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-slate-800 text-[15px]">
          <ReactMarkdown
            components={{
              // Intercept pure text nodes inside paragraphs/lists to inject tooltips
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