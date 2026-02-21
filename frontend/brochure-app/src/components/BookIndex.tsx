import { useState, useEffect, useRef } from 'react';
import type { Section } from '../scenes/types';

interface BookIndexProps {
  sections: Section[];
}

// Build a flat list of anchors: sections (big) + stories (small)
interface IndexEntry {
  id: string;        // DOM id to scroll to
  label: string;
  accent: string;
  type: 'section' | 'story';
  numeral?: string;  // e.g. "I", "II" for sections
  index: number;     // 1-based display number for stories within section
}

function buildEntries(sections: Section[]): IndexEntry[] {
  const entries: IndexEntry[] = [];
  for (const section of sections) {
    entries.push({
      id: `section-${section.id}`,
      label: section.title,
      accent: section.accent,
      type: 'section',
      numeral: section.numeral,
      index: 0,
    });
    section.stories.forEach((story, i) => {
      entries.push({
        id: `story-${story.id}`,
        label: story.title,
        accent: section.accent,
        type: 'story',
        index: i + 1,
      });
    });
  }
  return entries;
}

export function BookIndex({ sections }: BookIndexProps) {
  const entries = buildEntries(sections);
  const [activeId, setActiveId] = useState(entries[0]?.id || '');
  const [hovered, setHovered] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Hide on mobile
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Scroll-spy: track which section/story is currently in view
  useEffect(() => {
    const ids = entries.map(e => e.id);
    const visibleMap = new Map<string, number>();

    observerRef.current = new IntersectionObserver(
      (observed) => {
        for (const entry of observed) {
          if (entry.isIntersecting) {
            visibleMap.set(entry.target.id, entry.intersectionRatio);
          } else {
            visibleMap.delete(entry.target.id);
          }
        }
        // Pick the first visible entry in document order
        for (const id of ids) {
          if (visibleMap.has(id)) {
            setActiveId(id);
            break;
          }
        }
      },
      { threshold: [0, 0.1, 0.3], rootMargin: '-10% 0px -60% 0px' }
    );

    // Observe all targets after a brief delay (elements may not be mounted yet)
    const timer = setTimeout(() => {
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) observerRef.current!.observe(el);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, []);

  if (isMobile) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Find the active index for the progress line
  const activeIdx = entries.findIndex(e => e.id === activeId);

  return (
    <nav
      style={{
        position: 'fixed',
        left: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0',
        pointerEvents: 'auto',
      }}
      aria-label="Document navigation"
    >
      {/* Background track line */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '0',
        bottom: '0',
        width: '2px',
        background: '#e0dcd6',
        transform: 'translateX(-50%)',
        borderRadius: '1px',
      }} />

      {/* Progress fill line */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '0',
        height: activeIdx >= 0 ? `${((activeIdx + 0.5) / entries.length) * 100}%` : '0',
        width: '2px',
        background: entries[activeIdx]?.accent || '#0274B6',
        transform: 'translateX(-50%)',
        borderRadius: '1px',
        transition: 'height 400ms ease-out, background 400ms ease-out',
      }} />

      {/* Entries */}
      {entries.map((entry) => {
        const isActive = entry.id === activeId;
        const isPast = entries.indexOf(entry) < activeIdx;
        const isSection = entry.type === 'section';
        const size = isSection ? 28 : 16;
        const showTooltip = hovered === entry.id;

        return (
          <div
            key={entry.id}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: isSection ? '40px' : '26px',
              cursor: 'pointer',
              zIndex: 2,
            }}
            onClick={() => handleClick(entry.id)}
            onMouseEnter={() => setHovered(entry.id)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Circle */}
            <div style={{
              width: size,
              height: size,
              borderRadius: '50%',
              background: isActive ? entry.accent : isPast ? entry.accent : '#fff',
              border: `2px solid ${isActive || isPast ? entry.accent : '#ccc'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: isSection ? '11px' : '8px',
              fontWeight: 700,
              fontFamily: 'var(--font-geist-sans)',
              color: isActive || isPast ? '#fff' : '#999',
              transition: 'all 300ms ease-out',
              boxShadow: isActive ? `0 0 0 3px ${entry.accent}33` : 'none',
              flexShrink: 0,
            }}>
              {isSection ? entry.numeral : entry.index}
            </div>

            {/* Tooltip — shows on hover */}
            {showTooltip && (
              <div style={{
                position: 'absolute',
                left: `${size / 2 + 12}px`,
                whiteSpace: 'nowrap',
                background: '#111',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-geist-sans)',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                pointerEvents: 'none',
              }}>
                {entry.label}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
