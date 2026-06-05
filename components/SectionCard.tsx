import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SectionCardProps {
  topic: string;
  summary: string;
  content: string; // Markdown
  legalTerms?: { term: string; definition: string }[];
  isDark?: boolean;
  animationDelay?: number;
  enableIntroAnimation?: boolean;
}

export default function SectionCard({ topic, summary, content, legalTerms = [], isDark = true, animationDelay = 0, enableIntroAnimation = true }: SectionCardProps) {
  const { sortedTerms, pattern } = useMemo(() => {
    const validTerms = legalTerms.filter(
      (term): term is { term: string; definition: string } =>
        Boolean(term?.term && typeof term.term === 'string' && term.term.trim())
    );
    const sorted = [...validTerms].sort((a, b) => b.term.length - a.term.length);
    const escapedTerms = sorted.map((term) => term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const compiledPattern = escapedTerms.length > 0 ? new RegExp(`(${escapedTerms.join('|')})`, 'gi') : null;

    return { sortedTerms: sorted, pattern: compiledPattern };
  }, [legalTerms]);

  const renderNodeWithTooltips = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      return renderTextWithTooltips(node);
    }

    if (typeof node === 'number' || typeof node === 'boolean' || node == null) {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map((child, index) => (
        <React.Fragment key={index}>{renderNodeWithTooltips(child)}</React.Fragment>
      ));
    }

    if (React.isValidElement(node)) {
      if (node.type === TooltipProvider || node.type === Tooltip || node.type === TooltipTrigger || node.type === TooltipContent) {
        return node;
      }

      if (node.props?.children === undefined) {
        return node;
      }

      return React.cloneElement(node, {
        ...node.props,
        children: renderNodeWithTooltips(node.props.children),
      });
    }

    return node;
  };

  // Custom renderer for the markdown paragraphs
  // This looks through text nodes and wraps matching legal terms in Tooltips
  const renderTextWithTooltips = (text: string) => {
    if (!pattern || sortedTerms.length === 0) return text;

    const parts = text.split(pattern);

    return parts.map((part, i) => {
      const matchedTerm = sortedTerms.find((term) => term.term.toLowerCase() === part.toLowerCase());
      
      if (matchedTerm) {
        return (
          <TooltipProvider key={i} delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={`font-semibold text-current underline ${isDark ? 'decoration-white decoration-dotted' : 'decoration-slate-500 decoration-dotted'} underline-offset-4 cursor-help px-0.5 rounded`}>
                  {part}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-75 bg-white text-black border-white/70">
                <p className="font-bold mb-1 text-black">{matchedTerm.term}</p>
                <p className="text-sm leading-snug text-black">{matchedTerm.definition}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const theme = isDark
    ? {
        cardBg: 'bg-[#1B3B9B]',
        cardBorder: 'border-[#152e7a]',
        cardText: 'text-white',
        titleText: 'text-white',
        divider: 'border-white/30',
        summaryBorder: 'border-[#FBF5C6]/50',
        summaryText: 'text-[#FBF5C6]',
      }
    : {
        cardBg: 'bg-[#fbf5c6]',
        cardBorder: 'border-[#edcd6f]',
        cardText: 'text-[#332e18]',
        titleText: 'text-[#332e18]',
        divider: 'border-[#edcd6f]/70',
        summaryBorder: 'border-[#1B3B9B]/50',
        summaryText: 'text-[#1B3B9B]',
      };

  return (
    <div 
      className={`font-['Afacad',sans-serif] ${theme.cardText} flex flex-col h-full rounded-[14px] p-[24px_22px] text-[17px] font-bold leading-[1.65] overflow-hidden shadow-xl ${theme.cardBg} border ${theme.cardBorder}`}
      style={enableIntroAnimation ? { opacity: 0, animation: `customFadeSlideUp 0.8s ease-out ${animationDelay}s forwards` } : undefined}
    >
      <h3 className={`font-black text-[28px] uppercase mb-4 tracking-[1.5px] border-b-2 ${theme.divider} pb-4 shrink-0 drop-shadow-md pt-2 ${theme.titleText}`}>
        {topic}
      </h3>
      
      <div 
        className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2"
        style={enableIntroAnimation ? { opacity: 0, animation: `customFadeSlideUp 0.8s ease-out ${animationDelay + 0.5}s forwards` } : undefined}
      >
        {summary && (
          <div className={`bg-black/10 border-l-4 ${theme.summaryBorder} p-3 italic ${theme.summaryText} text-[16px] rounded-r-md`}>
            {renderTextWithTooltips(summary)}
          </div>
        )}
        <div className={`prose prose-p:leading-[1.65] prose-headings:font-black prose-a:underline ${theme.cardText} text-[18px] font-bold`}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="leading-[1.65]">{renderNodeWithTooltips(children)}</p>,
              ul: ({ children }) => <ul className="list-disc pl-6 space-y-3 marker:text-current">{renderNodeWithTooltips(children)}</ul>,
              li: ({ children }) => <li className="leading-[1.65]">{renderNodeWithTooltips(children)}</li>,
              strong: ({ children }) => <strong>{renderNodeWithTooltips(children)}</strong>,
              em: ({ children }) => <em>{renderNodeWithTooltips(children)}</em>,
              span: ({ children }) => <span>{renderNodeWithTooltips(children)}</span>,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}