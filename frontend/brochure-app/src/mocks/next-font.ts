interface FontResult {
  className: string;
  variable: string;
  style: { fontFamily: string };
}

export function Geist(_opts?: Record<string, unknown>): FontResult {
  return { className: '', variable: '--font-geist-sans', style: { fontFamily: 'var(--font-geist-sans)' } };
}

export function Geist_Mono(_opts?: Record<string, unknown>): FontResult {
  return { className: '', variable: '--font-geist-mono', style: { fontFamily: 'var(--font-geist-mono)' } };
}

export function Playfair_Display(_opts?: Record<string, unknown>): FontResult {
  return { className: '', variable: '--font-playfair', style: { fontFamily: 'var(--font-playfair)' } };
}

export function Source_Serif_4(_opts?: Record<string, unknown>): FontResult {
  return { className: '', variable: '--font-source-serif', style: { fontFamily: 'var(--font-source-serif)' } };
}
