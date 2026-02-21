interface StepTimelineProps {
  steps: { label: string }[];
  currentStep: number;
  accent: string;
  autoplay: boolean;
  onStepClick: (index: number) => void;
  onToggleAutoplay: () => void;
  layout?: 'horizontal' | 'vertical';
}

export function StepTimeline({ steps, currentStep, accent, autoplay, onStepClick, onToggleAutoplay, layout = 'horizontal' }: StepTimelineProps) {
  const n = steps.length;

  if (layout === 'vertical') {
    return (
      <div style={{
        width: '260px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '4px 0',
      }}>
        {/* Step list — equally distributed */}
        <div style={{
          flex: '1 1 auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
        }}>
          {/* Background vertical track */}
          <div style={{
            position: 'absolute',
            left: '14px',
            top: '16px',
            bottom: '16px',
            width: '3px',
            background: '#e0dcd6',
            borderRadius: '2px',
          }} />
          {/* Progress fill — height matches space-between step positions */}
          <div style={{
            position: 'absolute',
            left: '14px',
            top: '16px',
            height: `calc(${(currentStep / Math.max(n - 1, 1)) * 100}% - ${(currentStep / Math.max(n - 1, 1)) * 32}px)`,
            width: '3px',
            background: accent,
            borderRadius: '2px',
            transition: 'height 400ms ease-out',
          }} />
          {/* Step rows */}
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            const isPast = i < currentStep;
            return (
              <div
                key={i}
                onClick={() => onStepClick(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '4px 8px 4px 0',
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'background 200ms',
                }}
              >
                <div style={{
                  width: isActive ? '28px' : '24px',
                  height: isActive ? '28px' : '24px',
                  borderRadius: '50%',
                  background: isActive ? accent : isPast ? accent : '#f8f6f2',
                  color: isActive || isPast ? '#fff' : accent,
                  border: `2px solid ${accent}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  fontFamily: 'var(--font-geist-sans)',
                  flexShrink: 0,
                  transition: 'all 300ms ease-out',
                  boxShadow: isActive ? `0 0 0 3px ${accent}22` : 'none',
                  marginLeft: isActive ? '1px' : '3px',
                }}>
                  {i + 1}
                </div>
                <span style={{
                  fontSize: '13px',
                  fontFamily: 'var(--font-source-serif)',
                  color: isActive ? '#111' : '#666',
                  fontWeight: isActive ? 600 : 400,
                  lineHeight: 1.4,
                }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        {/* Autoplay toggle at bottom */}
        <div style={{
          flexShrink: 0,
          paddingTop: '8px',
          marginTop: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <button
            onClick={onToggleAutoplay}
            title={autoplay ? 'Pause auto-advance' : 'Resume auto-advance'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              border: `1.5px solid ${accent}`,
              background: autoplay ? accent : 'transparent',
              color: autoplay ? '#fff' : accent,
              cursor: 'pointer',
              fontSize: '12px',
              lineHeight: 1,
              padding: 0,
            }}
          >
            {autoplay ? '⏸' : '▶'}
          </button>
          <span style={{
            fontSize: '11px',
            color: '#888',
            fontFamily: 'var(--font-geist-sans)',
          }}>
            {autoplay ? 'Playing' : 'Paused'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Timeline track */}
      <div style={{
        position: 'relative',
        height: '40px',
        margin: '16px 0 8px',
      }}>
        {/* Background track */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '0',
          right: '0',
          height: '3px',
          background: '#e0dcd6',
          transform: 'translateY(-50%)',
          borderRadius: '2px',
        }} />
        {/* Progress fill */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '0',
          width: `${((currentStep + 1) / n) * 100}%`,
          height: '3px',
          background: accent,
          transform: 'translateY(-50%)',
          borderRadius: '2px',
          transition: 'width 400ms ease-out',
        }} />
        {/* Step dots */}
        {steps.map((step, i) => {
          const pct = (i / n) * 100;
          const isActive = i === currentStep;
          const isPast = i < currentStep;
          return (
            <div
              key={i}
              onClick={() => onStepClick(i)}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                zIndex: 2,
              }}
              title={step.label}
            >
              <div style={{
                width: isActive ? '30px' : '26px',
                height: isActive ? '30px' : '26px',
                borderRadius: '50%',
                background: isActive ? accent : isPast ? accent : '#fff',
                color: isActive ? '#fff' : isPast ? '#fff' : accent,
                border: `2px solid ${accent}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 600,
                fontFamily: 'var(--font-geist-sans)',
                transition: 'all 300ms ease-out',
                boxShadow: isActive ? `0 0 0 4px ${accent}22` : 'none',
              }}>
                {i + 1}
              </div>
            </div>
          );
        })}
      </div>
      {/* Step label + autoplay toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: '#f8f6f2',
        borderLeft: `3px solid ${accent}`,
        borderRadius: '0 6px 6px 0',
        fontFamily: 'var(--font-source-serif)',
        fontSize: '14px',
        color: '#333',
        minHeight: '40px',
      }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          border: `2px solid ${accent}`,
          color: accent,
          fontSize: '11px',
          fontWeight: 700,
          fontFamily: 'var(--font-geist-sans)',
          flexShrink: 0,
        }}>
          {currentStep + 1}
        </span>
        <span style={{ flex: 1 }}>{steps[currentStep]?.label}</span>
        <button
          onClick={onToggleAutoplay}
          title={autoplay ? 'Pause auto-advance' : 'Resume auto-advance'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: `1.5px solid ${accent}`,
            background: autoplay ? accent : 'transparent',
            color: autoplay ? '#fff' : accent,
            cursor: 'pointer',
            flexShrink: 0,
            fontSize: '12px',
            lineHeight: 1,
            padding: 0,
          }}
        >
          {autoplay ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  );
}
