import type { SectionEditorial } from '../scenes/types';

export function DropCap({ text }: { text: string }) {
  if (!text) return null;
  const first = text[0];
  const rest = text.slice(1);
  return (
    <p style={{
      fontFamily: 'var(--font-source-serif)',
      fontSize: '16px',
      lineHeight: 1.8,
      color: '#333',
      margin: '0 0 16px',
    }}>
      <span style={{
        float: 'left',
        fontFamily: 'var(--font-playfair)',
        fontSize: '64px',
        lineHeight: '52px',
        paddingRight: '10px',
        paddingTop: '4px',
        color: '#111',
        fontWeight: 700,
      }}>{first}</span>
      {rest}
    </p>
  );
}

export function Pullquote({ text, accent }: { text: string; accent: string }) {
  return (
    <blockquote style={{
      margin: '32px 0',
      padding: '20px 24px',
      borderLeft: `4px solid ${accent}`,
      background: '#f8f6f2',
      fontFamily: 'var(--font-source-serif)',
      fontStyle: 'italic',
      fontSize: '18px',
      lineHeight: 1.7,
      color: '#444',
    }}>
      {text}
    </blockquote>
  );
}

export function DataCallout({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) {
  return (
    <div style={{
      padding: '16px 20px',
      borderLeft: `4px solid ${accent}`,
      background: '#FFF8E7',
      borderRadius: '0 6px 6px 0',
    }}>
      <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', fontFamily: 'var(--font-geist-sans)', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-playfair)', color: '#111', margin: '4px 0 2px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: '#666', fontFamily: 'var(--font-source-serif)' }}>
        {detail}
      </div>
    </div>
  );
}

export function SectionHeader({ numeral, title, subtitle, accent }: { numeral: string; title: string; subtitle: string; accent: string }) {
  return (
    <div style={{ margin: '64px 0 32px', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center', marginBottom: '16px' }}>
        <div style={{ flex: 1, maxWidth: '120px', height: '2px', background: '#C4B9A7' }} />
        <span style={{ fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', fontFamily: 'var(--font-geist-sans)', fontWeight: 500 }}>
          Section {numeral}
        </span>
        <div style={{ flex: 1, maxWidth: '120px', height: '2px', background: '#C4B9A7' }} />
      </div>
      <h2 style={{
        fontFamily: 'var(--font-playfair)',
        fontSize: '32px',
        fontWeight: 700,
        color: '#111',
        margin: '0 0 8px',
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: '14px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: accent,
        fontFamily: 'var(--font-geist-sans)',
        fontWeight: 600,
      }}>
        {subtitle}
      </p>
      <div style={{ width: '60px', height: '3px', background: accent, margin: '16px auto 0', borderRadius: '2px' }} />
    </div>
  );
}

export function EditorialBlock({ editorial, accent }: { editorial: SectionEditorial; accent: string }) {
  // Split intro into first sentence (for drop cap) and rest
  const sentences = editorial.intro.split('. ');
  const firstSentence = sentences[0] + '.';
  const restText = sentences.slice(1).join('. ');

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto 32px' }}>
      <DropCap text={firstSentence} />
      {restText && (
        <p style={{
          fontFamily: 'var(--font-source-serif)',
          fontSize: '16px',
          lineHeight: 1.8,
          color: '#333',
          margin: '0 0 16px',
        }}>
          {restText}
        </p>
      )}
      <Pullquote text={editorial.pullquote} accent={accent} />
      {editorial.dataCallouts && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', margin: '24px 0' }}>
          {editorial.dataCallouts.map((dc, i) => (
            <DataCallout key={i} {...dc} accent={accent} />
          ))}
        </div>
      )}
    </div>
  );
}
