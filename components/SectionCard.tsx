import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SectionCardProps {
  topic: string;
  summary: string;
  content: string; // Markdown
  legalTerms?: { term: string; definition: string }[];
  isDark?: boolean;
  animationDelay?: number;
}

export default function SectionCard({ topic, summary, content, legalTerms = [], isDark = true, animationDelay = 0 }: SectionCardProps) {
  
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
    <div 
      className={`font-['Afacad',sans-serif] text-white flex flex-col h-full rounded-[14px] p-[24px_22px] text-[17px] font-[700] leading-[1.65] overflow-hidden shadow-xl ${
        isDark ? 'bg-[#1B3B9B]' : 'bg-[#59ABE9]'
      }`}
      style={{ opacity: 0, animation: `customFadeSlideUp 0.8s ease-out ${animationDelay}s forwards` }}
    >
      <h3 className="font-[900] text-[28px] uppercase mb-4 tracking-[1.5px] border-b-2 border-white/30 pb-3 shrink-0 drop-shadow-md pb-4 pt-2">
        {topic}
      </h3>
      
      <div 
        className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2"
        style={{ opacity: 0, animation: `customFadeSlideUp 0.8s ease-out ${animationDelay + 0.5}s forwards` }}
      >
        {summary && (
          <div className="bg-black/10 border-l-4 border-white/40 p-3 italic text-[#FBF5C6] text-[16px] rounded-r-md">
            {summary}
          </div>
        )}
        <div className="prose prose-invert prose-p:leading-[1.65] prose-headings:text-white prose-a:text-white/80 text-white text-[17px] font-[700]">
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