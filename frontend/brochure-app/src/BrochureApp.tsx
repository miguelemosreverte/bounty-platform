import { sections } from './scenes';
import { DemoPlayer } from './components/DemoPlayer';
import { SectionHeader, EditorialBlock } from './components/Editorial';
import { BookIndex } from './components/BookIndex';

const today = new Date().toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric',
});

const totalStories = sections.reduce((n, s) => n + s.stories.length, 0);

export function BrochureApp() {
  return (
    <div style={{ background: '#FBF9F6', minHeight: '100vh', color: '#111' }}>
      {/* ── Responsive CSS ── */}
      <style>{`
        .brochure-callouts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .brochure-toc { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .brochure-story {
          max-height: calc(100dvh - 24px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .brochure-title-block { padding: 48px 24px 40px; }
        .brochure-title-block h1 { font-size: 48px; }
        .brochure-section-inner { max-width: 1400px; }
        @media (max-width: 767px) {
          .brochure-callouts { grid-template-columns: 1fr; }
          .brochure-toc { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .brochure-story {
            max-height: none !important;
            overflow: visible !important;
          }
          .brochure-title-block { padding: 24px 12px 20px; }
          .brochure-title-block h1 { font-size: 28px !important; }
          .brochure-section-inner { max-width: 100% !important; }
          .brochure-section { padding: 0 12px !important; }
        }
      `}</style>

      {/* ── Book Index (fixed left nav) ── */}
      <BookIndex sections={sections} />

      {/* ── Masthead ── */}
      <header style={{
        borderBottom: '1px solid #C4B9A7',
        padding: '12px 0',
        textAlign: 'center',
        fontFamily: 'var(--font-geist-sans)',
      }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888' }}>
          GitBusters Product Review &nbsp;·&nbsp; {today} &nbsp;·&nbsp; Confidential
        </div>
      </header>

      {/* ── Title Block ── */}
      <div className="brochure-title-block" style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ height: '3px', background: '#111', margin: '0 auto 24px', width: '100%' }} />
        <div style={{ height: '1px', background: '#111', margin: '0 auto 32px', width: '100%' }} />
        <h1 style={{
          fontFamily: 'var(--font-playfair)',
          fontSize: '48px',
          fontWeight: 700,
          lineHeight: 1.1,
          margin: '0 0 12px',
          color: '#111',
        }}>
          The GitBusters Platform
        </h1>
        <p style={{
          fontFamily: 'var(--font-source-serif)',
          fontStyle: 'italic',
          fontSize: '20px',
          color: '#666',
          margin: '0 0 32px',
        }}>
          A comprehensive product walkthrough — live React components rendering with mock data
        </p>
        <div style={{ height: '1px', background: '#111', margin: '0 auto 4px', width: '100%' }} />
        <div style={{ height: '3px', background: '#111', margin: '0 auto', width: '100%' }} />
      </div>

      {/* ── Executive Summary ── */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 32px' }}>
        <p style={{
          fontFamily: 'var(--font-source-serif)',
          fontSize: '16px',
          lineHeight: 1.8,
          color: '#333',
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
          }}>T</span>
          his document presents a comprehensive product walkthrough of the GitBusters bounty platform.
          Unlike traditional screenshots or video recordings, every interface you see below is a
          <strong> live React component</strong> — the actual production code running with simulated data.
          Each section auto-advances through key user journeys, demonstrating the platform experience
          for developers, maintainers, enterprise users, and administrators.
        </p>
      </div>

      {/* ── Data Callouts ── */}
      <div className="brochure-callouts" style={{ maxWidth: '720px', margin: '0 auto 48px', padding: '0 24px' }}>
        <div style={{ padding: '16px 20px', borderLeft: '4px solid #0274B6', background: '#FFF8E7', borderRadius: '0 6px 6px 0' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-playfair)', color: '#111' }}>{totalStories}</div>
          <div style={{ fontSize: '13px', color: '#666', fontFamily: 'var(--font-source-serif)' }}>Interactive Stories</div>
        </div>
        <div style={{ padding: '16px 20px', borderLeft: '4px solid #1A6B3C', background: '#FFF8E7', borderRadius: '0 6px 6px 0' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-playfair)', color: '#111' }}>4</div>
          <div style={{ fontSize: '13px', color: '#666', fontFamily: 'var(--font-source-serif)' }}>User Roles</div>
        </div>
        <div style={{ padding: '16px 20px', borderLeft: '4px solid #C5922E', background: '#FFF8E7', borderRadius: '0 6px 6px 0' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-playfair)', color: '#111' }}>Live</div>
          <div style={{ fontSize: '13px', color: '#666', fontFamily: 'var(--font-source-serif)' }}>React Components</div>
        </div>
      </div>

      {/* ── Table of Contents ── */}
      <div style={{ maxWidth: '900px', margin: '0 auto 64px', padding: '0 24px' }}>
        <div className="brochure-toc">
          {sections.map(section => (
            <a
              key={section.id}
              href={`#section-${section.id}`}
              style={{
                display: 'block',
                padding: '20px',
                background: '#fff',
                border: '1px solid #e0dcd6',
                borderTop: `3px solid ${section.accent}`,
                borderRadius: '0 0 8px 8px',
                textDecoration: 'none',
                transition: 'box-shadow 200ms, transform 200ms',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.transform = 'none';
              }}
            >
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', fontFamily: 'var(--font-geist-sans)', marginBottom: '6px' }}>
                Section {section.numeral}
              </div>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', fontWeight: 700, color: '#111', marginBottom: '4px' }}>
                {section.title}
              </div>
              <div style={{ fontSize: '12px', color: section.accent, fontFamily: 'var(--font-geist-sans)', fontWeight: 500 }}>
                {section.stories.length} stories →
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Sections ── */}
      {sections.map(section => (
        <section key={section.id} id={`section-${section.id}`} className="brochure-section" style={{ padding: '0 24px', marginBottom: '64px' }}>
          <div className="brochure-section-inner" style={{ margin: '0 auto' }}>
            <SectionHeader
              numeral={section.numeral}
              title={section.title}
              subtitle={section.subtitle}
              accent={section.accent}
            />
            <EditorialBlock editorial={section.editorial} accent={section.accent} />
            {section.stories.map(story => (
              <div key={story.id} id={`story-${story.id}`} className="brochure-story" style={{
                marginBottom: '48px',
                scrollMarginTop: '24px',
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#111',
                  margin: '0 0 6px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  {story.title}
                </h3>
                <p style={{
                  fontFamily: 'var(--font-source-serif)',
                  fontSize: '14px',
                  color: '#666',
                  textAlign: 'center',
                  maxWidth: '600px',
                  margin: '0 auto 12px',
                  lineHeight: 1.6,
                  flexShrink: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }}>
                  {story.description}
                </p>
                <DemoPlayer story={story} accent={section.accent} />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* ── Conclusion ── */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ height: '1px', background: '#C4B9A7', margin: '0 0 32px' }} />
        <p style={{
          fontFamily: 'var(--font-source-serif)',
          fontSize: '16px',
          lineHeight: 1.8,
          color: '#333',
          marginBottom: '24px',
        }}>
          What you have seen above is not a mockup, not a recording, and not a screenshot carousel. Every interface
          was rendered by the actual production React components, with the same Tailwind styles, the same layout
          logic, and the same component hierarchy that runs in the deployed application. The only difference is
          the data source: simulated blockchain state instead of a live Ethereum node.
        </p>
        <blockquote style={{
          margin: '32px 0',
          padding: '24px 28px',
          border: '2px solid #111',
          fontFamily: 'var(--font-source-serif)',
          fontStyle: 'italic',
          fontSize: '18px',
          lineHeight: 1.7,
          color: '#333',
          textAlign: 'center',
        }}>
          "The best way to demonstrate software is to run the software."
        </blockquote>
        <div style={{ height: '1px', background: '#C4B9A7', margin: '32px 0 0' }} />
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #C4B9A7',
        padding: '16px 0',
        textAlign: 'center',
        fontSize: '11px',
        color: '#888',
        fontFamily: 'var(--font-geist-sans)',
      }}>
        GitBusters — Built on Ethereum · Powered by Smart Contracts · Open Source
      </footer>
    </div>
  );
}
