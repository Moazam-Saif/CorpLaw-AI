"use client";

import ReactMarkdown from 'react-markdown';
import { ShieldAlert, Fingerprint, User, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import SectionCard from './SectionCard';
import ReferencesList from './ReferencesList';
import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
}

interface MessageBubbleProps {
  message: Message;
  userMessage?: string;
  partialObject?: any;
  isStreaming?: boolean;
  index?: number;
  defaultOpen?: boolean;
}

export default function MessageBubble({ message, userMessage, partialObject, isStreaming = false, index = 0, defaultOpen = false }: MessageBubbleProps) {
  const ai = message.role === 'ASSISTANT';
  const [currentPage, setCurrentPage] = useState(0);
  const [transitionPage, setTransitionPage] = useState<number | null>(null);
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(isStreaming || defaultOpen);
  const transitionTimeoutRef = useRef<number | null>(null);
  const parentContainerRef = useRef<HTMLDivElement | null>(null);
  const layoutContainerRef = useRef<HTMLDivElement | null>(null);
  const savedBodyOverflowRef = useRef<string | null>(null);
  const outgoingAnimRef = useRef<HTMLDivElement | null>(null);
  const incomingAnimRef = useRef<HTMLDivElement | null>(null);
  const [prevPage, setPrevPage] = useState<number | null>(null);
  
  // Auto-open modal if it's currently streaming
  useEffect(() => {
    if (isStreaming) {
      setIsModalOpen(true);
    }
  }, [isStreaming]);

  // Try to parse the content as structured JSON. Fallback to a streaming loading state or basic rendering.
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
  const cardsPerPage = 1;
  const totalPages = Math.ceil(sections.length / cardsPerPage);
  const isPartial = Boolean(partialObject && isStreaming);
  
  const startPageTransition = (nextPage: number, direction: 'next' | 'prev') => {
    if (nextPage === currentPage || isTransitioning) {
      return;
    }
    // record previous page so we can render an outgoing clone
    setPrevPage(currentPage);
    setTransitionDirection(direction);
    setTransitionPage(nextPage);

    // set the current page immediately so the underlying DOM reflects the final state
    setCurrentPage(nextPage);
    setIsTransitioning(true);

    // Prevent body scroll/scrollbar changes during the animation which can cause width shifts
    try {
      savedBodyOverflowRef.current = document.body.style.overflow || null;
      document.body.style.overflow = 'hidden';
    } catch (e) {}

    // Wait two frames so the DOM updates (including preview cards) are applied, then lock the layout width
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const layoutEl = layoutContainerRef.current;
        const parentEl = parentContainerRef.current;
        if (layoutEl) {
          const rect = layoutEl.getBoundingClientRect();
          layoutEl.style.width = `${rect.width}px`;
          layoutEl.style.maxWidth = `${rect.width}px`;
        } else if (parentEl) {
          const rect = parentEl.getBoundingClientRect();
          parentEl.style.width = `${rect.width}px`;
          parentEl.style.maxWidth = `${rect.width}px`;
        }
      });
    });
  };

  const handlePrevPage = () => {
    startPageTransition(Math.max(0, currentPage - 1), 'prev');
  };
  const handleNextPage = () => {
    startPageTransition(Math.min(totalPages - 1, currentPage + 1), 'next');
  };

  const visibleSections = sections.slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage);
  const activeSection = visibleSections[0];
  const previousSection = currentPage > 0 ? sections[currentPage - 1] : null;
  const nextSection = currentPage < totalPages - 1 ? sections[currentPage + 1] : null;

  // Determine Sticky Note Colors
  const themeIndex = index % 4;
  let sBg, sBorder, sTape, lA, tA, bB, lB, tB, footerColor;

  if (themeIndex === 0 || themeIndex === 2) {
    // Yellow
    sBg = 'bg-[#fbf5c6]'; sBorder = 'border-[#edcd6f]'; sTape = 'bg-[#e0d691]/50';
    lA = 'text-[#b8952b]'; tA = 'text-[#332e18]'; bB = 'border-[#edcd6f]/50';
    lB = 'text-[#b8952b]'; tB = 'text-[#554e2f]'; footerColor = 'text-[#b8952b]';
  } else if (themeIndex === 1) {
    // Dark Blue
    sBg = 'bg-[#1B3B9B]'; sBorder = 'border-[#152e7a]'; sTape = 'bg-white/20';
    lA = 'text-[#fbf5c6]/60'; tA = 'text-white'; bB = 'border-white/10';
    lB = 'text-[#fbf5c6]/60'; tB = 'text-white/80'; footerColor = 'text-[#fbf5c6]/80';
  } else {
    // Light Blue
    sBg = 'bg-[#59ABE9]'; sBorder = 'border-white/30'; sTape = 'bg-white/30';
    lA = 'text-[#fbf5c6]'; tA = 'text-white'; bB = 'border-white/20';
    lB = 'text-[#fbf5c6]'; tB = 'text-white/90'; footerColor = 'text-[#fbf5c6]';
  }

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isModalOpen || totalPages <= 1 || isTransitioning) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        handlePrevPage();
      } else if (e.key === 'ArrowRight') {
        handleNextPage();
      }
    };
  
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, totalPages, isTransitioning]);

  // Cleanup after transition animation finishes: remove clones and unlock width
  useEffect(() => {
    if (!isTransitioning) return;

    const inEl = incomingAnimRef.current;
    const handleAnimEnd = (e: AnimationEvent) => {
      if (e.target !== inEl) return;

      // cleanup state
      setTransitionPage(null);
      setTransitionDirection(null);
      setIsTransitioning(false);
      setPrevPage(null);

      // clear locked width
      const parentEl = parentContainerRef.current;
      if (parentEl) {
        parentEl.style.width = '';
        parentEl.style.maxWidth = '';
      }

      // restore body overflow
      try {
        if (savedBodyOverflowRef.current !== null) {
          document.body.style.overflow = savedBodyOverflowRef.current;
          savedBodyOverflowRef.current = null;
        } else {
          document.body.style.overflow = '';
        }
      } catch (e) {}
    };

    if (inEl) inEl.addEventListener('animationend', handleAnimEnd as any);
    return () => {
      if (inEl) inEl.removeEventListener('animationend', handleAnimEnd as any);
    };
  }, [isTransitioning]);


  return (
    <div className="font-['Afacad',sans-serif]">
      {/* Closed State: Sticky Note Miniaturized View */}
      {!isModalOpen && (
        <div 
          onClick={() => setIsModalOpen(true)}
          className={`w-[300px] h-[300px] ${sBg} p-6 shadow-md hover:shadow-xl border ${sBorder} flex flex-col transform hover:scale-105 transition-all duration-300 cursor-pointer rounded-sm relative group overflow-hidden`}
          style={{ transform: `rotate(${Math.random() * 4 - 2}deg)` }}
        >
          {/* Sticky Tape Pin */}
          <div className={`absolute top-[-10px] left-1/2 -translate-x-1/2 w-12 h-5 ${sTape} backdrop-blur-sm shadow-sm`} style={{ transform: `rotate(${Math.random() * 6 - 3}deg)` }} />
        
          <div className="flex flex-col h-full gap-3">
            {/* Query Section */}
            {userMessage && (
              <div className={`flex-1 overflow-hidden border-b ${bB} pb-2`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[11px] font-[800] uppercase tracking-wider ${lA}`}>Query</span>
                </div>
                <p className={`text-[17px] font-[700] ${tA} leading-snug line-clamp-3`} style={{ fontFamily: 'Afacad, sans-serif' }}>
                  {userMessage}
                </p>
              </div>
            )}

            {/* Answer Section */}
            <div className="flex-[1.5] overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[11px] font-[800] uppercase tracking-wider ${lB}`}>Analysis</span>
              </div>
            
              {isStructured && parsedContent ? (
                <div>
                  <p className={`text-[15px] font-[600] ${tB} leading-snug line-clamp-4`}>
                    {sections[0]?.summary || "Analyzing jurisdiction and extracting context..."}
                  </p>
                </div>
              ) : (
                <p className={`text-[15px] font-[600] ${tB} leading-snug line-clamp-4`}>
                  {displayContent}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className={`mt-auto pt-2 flex items-center justify-between ${footerColor}`}>
              <span className="text-[12px] font-bold tracking-wide">{time}</span>
              <span className="text-[11px] font-[800] uppercase tracking-wider group-hover:underline flex items-center gap-1">
                  Expand <ChevronRight size={12} style={{ fontSize: '1.2em' }} />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Overlay for Structured Content */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#EAEDF2] px-4 sm:px-10 pt-0 pb-10 overflow-y-auto">
          {/* Background click to close */}
          <div className="fixed inset-0" onClick={() => setIsModalOpen(false)}></div>
        
          <div className="relative font-['Afacad',sans-serif] w-full max-w-[1400px] bg-[#EAEDF2] backdrop-blur-xl p-6 sm:p-10 rounded-[24px] shadow-[0_0_50px_rgba(0,0,0,0.08)] border border-[#c8d0dc] animate-in fade-in zoom-in-[0.98] duration-700 mx-auto mt-0 mb-auto pointer-events-auto">
            <style dangerouslySetInnerHTML={{__html: `
              @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700;800;900&display=swap');
              @keyframes customFadeSlideUp {
                0% { opacity: 0; transform: translateY(30px); }
                100% { opacity: 1; transform: translateY(0); }
              }
              /* GPU-friendly move+scale animations. Avoid animating layout properties. */
              @keyframes cardMoveToLeftPreview {
                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(calc(-50% - 40vw), -50%) scale(0.34); opacity: 0.12; }
              }
              @keyframes cardMoveToRightPreview {
                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(calc(-50% + 40vw), -50%) scale(0.34); opacity: 0.12; }
              }
              @keyframes cardMoveFromRightPreview {
                0% { transform: translate(calc(-50% + 40vw), -50%) scale(0.34); opacity: 0.12; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              }
              @keyframes cardMoveFromLeftPreview {
                0% { transform: translate(calc(-50% - 40vw), -50%) scale(0.34); opacity: 0.12; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              }
            `}} />
          
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#332e18]/50 hover:text-[#332e18] bg-[#edcd6f]/30 hover:bg-[#edcd6f]/60 rounded-full w-10 h-10 flex items-center justify-center transition-colors shadow-sm"
            >
              ✕
            </button>

            {userMessage && (
              <div 
                className="text-center mb-[24px] w-full flex justify-center"
                style={{ opacity: 0, animation: 'customFadeSlideUp 0.8s ease-out 0.1s forwards' }}
              >
                <div className="bg-[#59ABE9] backdrop-blur-sm px-12 py-4 rounded-md border border-[#1B3B9B]/40 shadow-sm min-w-[65%] max-w-4xl text-left flex flex-col gap-1 font-['Afacad',sans-serif] text-[17px] font-[700] text-white">
                  <span className="text-white text-[13px] uppercase tracking-widest font-[800]">Query</span>
                  <span className="text-white leading-snug">{userMessage}</span>
                </div>
              </div>
            )}

            {/* Removed global modal title per design — headings now live on each card */}

            {isStreaming && !isStructured ? (
              <div className="bg-[#EAEDF2] rounded-2xl p-6 border border-[#c8d0dc] shadow-xl max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-[900] text-[#1f2937] uppercase tracking-widest">Analyzing</span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-[24px] xl:gap-[32px] auto-rows-fr min-h-[450px]">
                  <div className="h-full rounded-[14px] bg-white/70 border border-[#c8d0dc] p-[24px_22px] animate-pulse">
                    <div className="h-4 w-24 rounded-full bg-[#c8d0dc]/50 mb-4" />
                    <div className="h-6 w-3/4 rounded-full bg-[#c8d0dc]/50 mb-3" />
                    <div className="h-4 w-full rounded-full bg-[#c8d0dc]/35 mb-2" />
                    <div className="h-4 w-5/6 rounded-full bg-[#c8d0dc]/35" />
                  </div>
                  <div className="h-full rounded-[14px] bg-white/70 border border-[#c8d0dc] p-[24px_22px] animate-pulse hidden xl:block">
                    <div className="h-4 w-24 rounded-full bg-[#c8d0dc]/50 mb-4" />
                    <div className="h-6 w-3/4 rounded-full bg-[#c8d0dc]/50 mb-3" />
                    <div className="h-4 w-full rounded-full bg-[#c8d0dc]/35 mb-2" />
                    <div className="h-4 w-5/6 rounded-full bg-[#c8d0dc]/35" />
                  </div>
                </div>
              </div>
            ) : isStructured && parsedContent ? (
              <>
                {sections.length > 0 ? (
                  <div className="relative min-h-[560px] flex items-center justify-center overflow-hidden" ref={layoutContainerRef}>
                    {previousSection && (
                      <div
                        className="absolute left-0 top-1/2 z-0 hidden xl:block w-[18%] max-w-[220px] h-[360px] pointer-events-none select-none origin-center"
                        style={{ transform: 'translate(-12%, -50%)', opacity: 0.12, filter: 'blur(5px)' }}
                      >
                        <SectionCard
                          topic={previousSection.topic || 'Generating...'}
                          summary={previousSection.summary}
                          content={previousSection.content || ''}
                          legalTerms={parsedContent.legalTerms}
                          isDark={false}
                          animationDelay={0.2}
                          enableIntroAnimation={false}
                        />
                      </div>
                    )}

                    {activeSection && (
                      <div className="relative z-10 w-full max-w-[680px] h-[560px] px-2 sm:px-6" ref={parentContainerRef}>
                        <SectionCard
                          topic={activeSection.topic || 'Generating...'}
                          summary={activeSection.summary}
                          content={activeSection.content || ''}
                          legalTerms={parsedContent.legalTerms}
                          isDark={currentPage % 2 === 0}
                          animationDelay={0.4}
                          enableIntroAnimation={isPartial}
                        />
                      </div>
                    )}

                    {/* Animated clones overlay while transition is active. The underlying DOM is already swapped. */}
                    {isTransitioning && prevPage !== null && transitionPage !== null && transitionDirection && (
                      <div className="absolute inset-0 z-20 pointer-events-none">
                        <div
                          className="absolute left-1/2 top-1/2 w-full max-w-[680px] h-[560px]"
                          style={{
                            animation: `${transitionDirection === 'next' ? 'cardMoveToLeftPreview' : 'cardMoveToRightPreview'} 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                            willChange: 'transform, opacity',
                            transformStyle: 'preserve-3d',
                            backfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            contain: 'paint'
                          }}
                        >
                          <SectionCard
                            topic={sections[prevPage].topic || 'Generating...'}
                            summary={sections[prevPage].summary}
                            content={sections[prevPage].content || ''}
                            legalTerms={parsedContent.legalTerms}
                            isDark={prevPage % 2 === 0}
                            animationDelay={0}
                            enableIntroAnimation={false}
                          />
                        </div>
                        <div
                          ref={(el) => { incomingAnimRef.current = el; }}
                          className="absolute left-1/2 top-1/2 w-full max-w-[680px] h-[560px]"
                          style={{
                            animation: `${transitionDirection === 'next' ? 'cardMoveFromRightPreview' : 'cardMoveFromLeftPreview'} 520ms cubic-bezier(0.22, 1, 0.36, 1) forwards`,
                            willChange: 'transform, opacity',
                            transformStyle: 'preserve-3d',
                            backfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            contain: 'paint'
                          }}
                        >
                          <SectionCard
                            topic={sections[transitionPage].topic || 'Generating...'}
                            summary={sections[transitionPage].summary}
                            content={sections[transitionPage].content || ''}
                            legalTerms={parsedContent.legalTerms}
                            isDark={transitionPage % 2 === 0}
                            animationDelay={0}
                            enableIntroAnimation={false}
                          />
                        </div>
                      </div>
                    )}


                    {nextSection && (
                      <div
                        className="absolute right-0 top-1/2 z-0 hidden xl:block w-[18%] max-w-[220px] h-[360px] pointer-events-none select-none origin-center"
                        style={{ transform: 'translate(12%, -50%)', opacity: 0.12, filter: 'blur(5px)' }}
                      >
                        <SectionCard
                          topic={nextSection.topic || 'Generating...'}
                          summary={nextSection.summary}
                          content={nextSection.content || ''}
                          legalTerms={parsedContent.legalTerms}
                          isDark={true}
                          animationDelay={0.2}
                          enableIntroAnimation={false}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-[24px] xl:gap-[32px] auto-rows-fr min-h-[450px]">
                    <div className="h-full rounded-[14px] bg-white/10 border border-white/10 p-[24px_22px] animate-pulse">
                      <div className="h-4 w-24 rounded-full bg-white/20 mb-4" />
                      <div className="h-6 w-3/4 rounded-full bg-white/20 mb-3" />
                      <div className="h-4 w-full rounded-full bg-white/15 mb-2" />
                      <div className="h-4 w-5/6 rounded-full bg-white/15" />
                    </div>
                    <div className="h-full rounded-[14px] bg-white/10 border border-white/10 p-[24px_22px] animate-pulse hidden xl:block">
                      <div className="h-4 w-24 rounded-full bg-white/20 mb-4" />
                      <div className="h-6 w-3/4 rounded-full bg-white/20 mb-3" />
                      <div className="h-4 w-full rounded-full bg-white/15 mb-2" />
                      <div className="h-4 w-5/6 rounded-full bg-white/15" />
                    </div>
                  </div>
                )}

                {/* Carousel Controls */}
                {totalPages > 1 && (
                  <div 
                    className="flex items-center justify-center gap-4 mt-8"
                    style={{ opacity: 0, animation: 'customFadeSlideUp 0.8s ease-out 2.5s forwards' }}
                  >
                    <button 
                      onClick={handlePrevPage}
                      disabled={currentPage === 0 || isTransitioning}
                      className="p-3 sm:p-4 rounded-full bg-white/40 border border-[#edcd6f]/50 text-[#332e18] hover:bg-white/60 hover:scale-110 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed shadow-sm transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="text-[20px] font-[800] text-[#332e18] px-4 tracking-widest">
                      {currentPage + 1} / {totalPages}
                    </div>
                    <button 
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages - 1 || isTransitioning}
                      className="p-3 sm:p-4 rounded-full bg-white/40 border border-[#edcd6f]/50 text-[#332e18] hover:bg-white/60 hover:scale-110 disabled:opacity-30 disabled:scale-100 disabled:cursor-not-allowed shadow-sm transition-all"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                )}

                {/* Confidence Meter Inline in Modal */}
                {parsedContent.confidence !== undefined && (
                  <div 
                    className="w-full flex justify-center mt-8"
                    style={{ opacity: 0, animation: 'customFadeSlideUp 0.8s ease-out 2.5s forwards' }}
                  >
                      <div className="flex items-center gap-3 bg-white/40 p-3 rounded-full backdrop-blur-md border border-[#edcd6f]/50 px-6 shadow-sm">
                        <span className="text-sm font-[900] text-white uppercase tracking-widest">
                          Confidence Level
                        </span>
                        <div className="h-2.5 bg-[#fbf5c6] rounded-full overflow-hidden w-32 md:w-48 shadow-inner">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out ${
                              parsedContent.confidence >= 80 ? 'bg-emerald-400' :
                              parsedContent.confidence >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                            style={{ width: `${parsedContent.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-[900] text-[#332e18]">
                          {Math.round(parsedContent.confidence)}%
                        </span>
                      </div>
                  </div>
                )}

                {parsedContent.references && parsedContent.references.length > 0 && (
                  <div className="mt-8 mx-auto w-full max-w-4xl" style={{ opacity: 0, animation: 'customFadeSlideUp 0.8s ease-out 2.5s forwards' }}>
                    <ReferencesList references={parsedContent.references} />
                  </div>
                )}
              </>
            ) : (
              /* Unstructured Modal display fallback */
              <div 
                className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl max-w-4xl mx-auto w-full"
                style={{ opacity: 0, animation: 'customFadeSlideUp 0.8s ease-out 0.4s forwards' }}
              >
                <div className="prose prose-lg prose-slate max-w-none prose-headings:text-[#111111] text-[#111111]">
                  <ReactMarkdown>{displayContent}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
