import { type ReactNode, useEffect, useRef, useCallback } from 'react';

interface ViewportProps {
  children: ReactNode;
  url?: string;
  background?: string;
  scrollKey?: string;
  scrollPercent?: number; // 0-100 — scroll to this % of content after mount
  scrollMode?: 'instant' | 'smooth'; // smooth = animate from current position
  onUserScroll?: () => void;
  mobile?: boolean;
}

export function Viewport({ children, url = 'gitbusters.io', background = '#FBF9F6', scrollKey, scrollPercent, scrollMode = 'instant', onUserScroll, mobile }: ViewportProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const programmaticScrollRef = useRef(false);

  // After step change, scroll to the specified percent of content
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const targetPercent = scrollPercent ?? 0;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const targetTop = (targetPercent / 100) * maxScroll;

    if (scrollMode === 'smooth') {
      // Same content, different scroll — animate from current position
      programmaticScrollRef.current = true;
      el.scrollTo({ top: targetTop, behavior: 'smooth' });
      // Clear the flag after smooth scroll completes (~500ms max)
      setTimeout(() => { programmaticScrollRef.current = false; }, 600);
    } else {
      // Different content — instant jump
      programmaticScrollRef.current = true;
      el.scrollTop = 0;
      if (targetPercent > 0) {
        // Small delay to let content render before scrolling
        const timer = setTimeout(() => {
          programmaticScrollRef.current = true;
          const freshMax = el.scrollHeight - el.clientHeight;
          el.scrollTop = (targetPercent / 100) * freshMax;
          setTimeout(() => { programmaticScrollRef.current = false; }, 50);
        }, 150);
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => { programmaticScrollRef.current = false; }, 50);
      }
    }
  }, [scrollKey, scrollPercent, scrollMode]);

  const handleScroll = useCallback(() => {
    if (programmaticScrollRef.current) return;
    onUserScroll?.();
  }, [onUserScroll]);

  // Prevent all click interactions inside the viewport content
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div style={{
      width: '100%',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 4px 32px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.08)',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column' as const,
      flex: '1 1 auto',
      minHeight: 0,
    }}>
      {/* Browser chrome */}
      <div style={{
        height: '36px',
        flexShrink: 0,
        background: 'linear-gradient(to bottom, #f2f2f2, #e8e8e8)',
        borderBottom: '1px solid #d0d0d0',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '14px',
        gap: '7px',
      }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57', border: '1px solid #e0443e' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e', border: '1px solid #dea123' }} />
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#28ca41', border: '1px solid #1aab29' }} />
        <div style={{
          marginLeft: '16px',
          flex: 1,
          maxWidth: '400px',
          background: '#fff',
          borderRadius: '4px',
          border: '1px solid #d0d0d0',
          padding: '2px 10px',
          fontSize: '11px',
          color: '#666',
          fontFamily: 'var(--font-geist-sans)',
        }}>
          {url}
        </div>
      </div>
      {/* Content area — scrollable, zoomed viewport */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onClickCapture={handleClickCapture}
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          maxHeight: mobile ? '350px' : '680px',
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          background,
          cursor: 'default',
        }}
      >
        <div style={{
          width: '1440px',
          zoom: mobile ? 0.28 : 0.78,
        }}>
          {/* Override cursor for all interactive elements inside viewport */}
          <style>{`
            .brochure-viewport a,
            .brochure-viewport button,
            .brochure-viewport [role="button"],
            .brochure-viewport input,
            .brochure-viewport select,
            .brochure-viewport textarea {
              cursor: default !important;
            }
          `}</style>
          <div className="brochure-viewport" style={{ pointerEvents: 'none' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
