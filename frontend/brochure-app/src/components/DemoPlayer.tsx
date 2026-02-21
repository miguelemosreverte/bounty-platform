import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { NavigationContext } from '../mocks/next-navigation';
import { Viewport } from './Viewport';
import { StepTimeline } from './StepTimeline';
import type { Story, Step } from '../scenes/types';

// Layout wrappers — import the real layouts since their deps are all mocked
import BackofficeLayout from '@/app/(backoffice)/layout';
import PublicLayout from '@/app/(public)/layout';

/** Detect layout mode: mobile (narrow), compact (short desktop), or full (tall desktop). */
function useLayoutMode(): 'mobile' | 'compact' | 'full' {
  const [mode, setMode] = useState<'mobile' | 'compact' | 'full'>(() => {
    if (typeof window === 'undefined') return 'full';
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerHeight < 1000) return 'compact';
    return 'full';
  });
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 768) setMode('mobile');
      else if (window.innerHeight < 1000) setMode('compact');
      else setMode('full');
    };
    const mqlW = window.matchMedia('(max-width: 767px)');
    const mqlH = window.matchMedia('(max-height: 999px)');
    const handler = () => update();
    mqlW.addEventListener('change', handler);
    mqlH.addEventListener('change', handler);
    update();
    return () => {
      mqlW.removeEventListener('change', handler);
      mqlH.removeEventListener('change', handler);
    };
  }, []);
  return mode;
}

interface DemoPlayerProps {
  story: Story;
  accent: string;
}

/** Compute a stable key from the step's component + layout + mockState (ignoring scrollPercent/label/duration). */
function contentKey(step: Step): string {
  const { pathname, params, searchParams, walletConnected, walletAddress, role } = step.mockState;
  return JSON.stringify({ c: step.component.name, l: step.layout, pathname, params, searchParams, walletConnected, walletAddress, role, p: step.componentProps });
}

/** Check if two steps render the same content (only scroll position differs). */
function isSameContent(a: Step, b: Step): boolean {
  return contentKey(a) === contentKey(b);
}

const FADE_MS = 150; // short fade for content swaps

export function DemoPlayer({ story, accent }: DemoPlayerProps) {
  const layoutMode = useLayoutMode();
  const compact = layoutMode === 'compact';
  const mobile = layoutMode === 'mobile';
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [inView, setInView] = useState(false);
  const [scrollMode, setScrollMode] = useState<'instant' | 'smooth'>('instant');
  const autoplayRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStepRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const step = story.steps[currentStep];

  // Stable content key for React — only changes when the rendered content changes
  const currentContentKey = useMemo(() => contentKey(step), [step]);

  // Keep ref in sync with state
  autoplayRef.current = autoplay;

  // Only autoplay when the player is visible in the viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (transitionRef.current) { clearTimeout(transitionRef.current); transitionRef.current = null; }
  }, []);

  const goToStep = useCallback((idx: number) => {
    clearTimers();
    const current = story.steps[currentStep];
    const next = story.steps[idx];

    if (isSameContent(current, next)) {
      // Same content, different scroll — just smooth scroll, no fade, no remount
      pendingStepRef.current = null;
      setScrollMode('smooth');
      setCurrentStep(idx);
    } else {
      // Different content — quick fade transition
      pendingStepRef.current = idx;
      setVisible(false);
      transitionRef.current = setTimeout(() => {
        pendingStepRef.current = null;
        setScrollMode('instant');
        setCurrentStep(idx);
        setVisible(true);
      }, FADE_MS);
    }
  }, [clearTimers, currentStep, story.steps]);

  // Auto-advance timer (only when autoplay is on, content is visible, and player is in viewport)
  useEffect(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (!autoplay || !visible || !inView) return;

    timerRef.current = setTimeout(() => {
      if (!autoplayRef.current) return;
      const next = (currentStep + 1) % story.steps.length;
      goToStep(next);
    }, step.durationMs);

    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [currentStep, visible, step.durationMs, story.steps.length, autoplay, inView, goToStep]);

  const handleStepClick = useCallback((idx: number) => {
    if (idx === currentStep && pendingStepRef.current === null) return;
    setAutoplay(false);
    autoplayRef.current = false;
    goToStep(idx);
  }, [currentStep, goToStep]);

  const handleToggleAutoplay = useCallback(() => {
    setAutoplay(prev => {
      autoplayRef.current = !prev;
      return !prev;
    });
  }, []);

  const handleUserScroll = useCallback(() => {
    if (autoplayRef.current) {
      setAutoplay(false);
      autoplayRef.current = false;
    }
  }, []);

  const bgForLayout = (layout: string) =>
    layout === 'public' ? '#050a09' : '#FBF9F6';

  const url = step.mockState.pathname === '/'
    ? 'gitbusters.io'
    : `gitbusters.io${step.mockState.pathname}`;

  const Component = step.component;
  const props = step.componentProps || {};

  let content: React.ReactNode;
  if (step.layout === 'backoffice') {
    content = (
      <BackofficeLayout>
        <Component {...props} />
      </BackofficeLayout>
    );
  } else if (step.layout === 'public') {
    content = (
      <PublicLayout>
        <Component {...props} />
      </PublicLayout>
    );
  } else {
    content = <Component {...props} />;
  }

  // mobile + full → stacked (column) with horizontal timeline
  // compact → side-by-side (row) with vertical timeline
  const isRow = compact;

  return (
    <div ref={containerRef} style={{
      margin: mobile ? '8px 0 4px' : compact ? '12px 0 8px' : '16px 0 16px',
      flex: mobile ? '0 0 auto' : '1 1 auto',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: isRow ? 'row' : 'column',
        gap: isRow ? '16px' : '0',
        flex: '1 1 auto',
        minHeight: 0,
      }}>
        <div style={{
          flex: isRow ? '1 1 0%' : '0 0 auto',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <NavigationContext.Provider value={step.mockState}>
            <Viewport
              url={url}
              background={bgForLayout(step.layout)}
              scrollKey={currentContentKey}
              scrollPercent={step.scrollPercent}
              scrollMode={scrollMode}
              onUserScroll={handleUserScroll}
              mobile={mobile}
            >
              <div
                key={currentContentKey}
                style={{
                  opacity: visible ? 1 : 0,
                  transition: `opacity ${FADE_MS}ms ease-out`,
                  minHeight: '900px',
                }}
              >
                {content}
              </div>
            </Viewport>
          </NavigationContext.Provider>
        </div>
        <StepTimeline
          steps={story.steps}
          currentStep={currentStep}
          accent={accent}
          autoplay={autoplay}
          onStepClick={handleStepClick}
          onToggleAutoplay={handleToggleAutoplay}
          layout={isRow ? 'vertical' : 'horizontal'}
        />
      </div>
    </div>
  );
}
