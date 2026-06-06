import React, { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SectionCardProps {
  topic: string;
  summary: string;
  content: string;
  legalTerms?: { term: string; definition: string }[];
  isDark?: boolean;
  animationDelay?: number;
  enableIntroAnimation?: boolean;
}

export default function SectionCard({
  topic,
  summary,
  content,
  legalTerms = [],
  isDark = true,
  animationDelay = 0,
  enableIntroAnimation = true,
}: SectionCardProps) {
  const { sortedTerms, pattern } = useMemo(() => {
    const validTerms = legalTerms.filter(
      (t): t is { term: string; definition: string } =>
        Boolean(t?.term && typeof t.term === 'string' && t.term.trim())
    );
    const sorted = [...validTerms].sort((a, b) => b.term.length - a.term.length);
    const escaped = sorted.map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // \b word boundaries prevent matching "rate" inside "accurate" etc.
    const compiled =
      escaped.length > 0 ? new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi') : null;
    return { sortedTerms: sorted, pattern: compiled };
  }, [legalTerms]);

  const renderTextWithTooltips = (text: string): React.ReactNode => {
    if (!pattern || sortedTerms.length === 0) return text;
    const parts = text.split(pattern);
    return (
      <>
        {parts.map((part, i) => {
          const matched = sortedTerms.find(
            (t) => t.term.toLowerCase() === part.toLowerCase()
          );
          if (matched) {
            return (
              <TooltipProvider key={i} delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`font-semibold underline underline-offset-4 cursor-help px-0.5 rounded ${
                        isDark
                          ? 'decoration-white decoration-dotted'
                          : 'decoration-slate-500 decoration-dotted'
                      }`}
                    >
                      {part}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-75 bg-white text-black border-white/70">
                    <p className="font-bold mb-1 text-black">{matched.term}</p>
                    <p className="text-sm leading-snug text-black">{matched.definition}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  // Render a single line, handling **bold** markdown and tooltip injection.
  const renderLine = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{renderTextWithTooltips(part.slice(2, -2))}</strong>;
          }
          return <React.Fragment key={i}>{renderTextWithTooltips(part)}</React.Fragment>;
        })}
      </>
    );
  };

  // Split on newlines; strip any leading "- " the AI may still send.
  // Fallback: if the AI sent everything as one line with " - " inline separators, split on those.
  const bullets = useMemo(() => {
    if (!content) return [];
    const lines = content
      .split('\n')
      .map((line) => line.trim().replace(/^[-*]\s+/, ''))
      .filter(Boolean);

    // If we only got one line and it contains " - ", it's inline-separated — split it
    if (lines.length === 1 && lines[0].includes(' - ')) {
      return lines[0].split(' - ').map((s) => s.trim()).filter(Boolean);
    }
    return lines;
  }, [content]);

  const theme = isDark
    ? {
        cardBg: 'bg-[#1B3B9B]',
        cardBorder: 'border-[#152e7a]',
        cardText: 'text-white',
        titleText: 'text-white',
        divider: 'border-white/30',
        summaryBorder: 'border-[#FBF5C6]/50',
        summaryText: 'text-[#FBF5C6]',
        dot: 'bg-white',
      }
    : {
        cardBg: 'bg-[#fbf5c6]',
        cardBorder: 'border-[#edcd6f]',
        cardText: 'text-[#332e18]',
        titleText: 'text-[#332e18]',
        divider: 'border-[#edcd6f]/70',
        summaryBorder: 'border-[#1B3B9B]/50',
        summaryText: 'text-[#1B3B9B]',
        dot: 'bg-[#332e18]',
      };

  return (
    <div
      className={`font-['Afacad',sans-serif] ${theme.cardText} flex flex-col h-full rounded-[14px] p-[24px_22px] text-[17px] font-bold leading-[1.65] overflow-hidden shadow-xl ${theme.cardBg} border ${theme.cardBorder}`}
      style={
        enableIntroAnimation
          ? { opacity: 0, animation: `customFadeSlideUp 0.8s ease-out ${animationDelay}s forwards` }
          : undefined
      }
    >
      <h3
        className={`font-black text-[28px] uppercase mb-4 tracking-[1.5px] border-b-2 ${theme.divider} pb-4 shrink-0 drop-shadow-md pt-2 ${theme.titleText}`}
      >
        {topic}
      </h3>

      <div
        className="space-y-4 overflow-y-auto flex-1 custom-scrollbar pr-2"
        style={
          enableIntroAnimation
            ? { opacity: 0, animation: `customFadeSlideUp 0.8s ease-out ${animationDelay + 0.5}s forwards` }
            : undefined
        }
      >
        {summary && (
          <div
            className={`bg-black/10 border-l-4 ${theme.summaryBorder} p-3 italic ${theme.summaryText} text-[16px] rounded-r-md`}
          >
            {renderTextWithTooltips(summary)}
          </div>
        )}

        <ul className="space-y-3">
          {bullets.map((line, i) => (
            <li key={i} className="flex gap-3 leading-[1.65] list-none">
              <span className={`mt-[0.6em] shrink-0 w-[6px] h-[6px] rounded-full ${theme.dot}`} />
              <span>{renderLine(line)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
