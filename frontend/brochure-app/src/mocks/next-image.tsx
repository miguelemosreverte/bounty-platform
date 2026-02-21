// Import the mascot image as a Vite asset (inlined as base64 via assetsInlineLimit)
import mascotUrl from '../../public/mascot.jpeg';

interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

// Map known static asset paths to imported URLs
const assetMap: Record<string, string> = {
  '/mascot.jpeg': mascotUrl,
};

function Image({ src, alt, width, height, className, fill, style, ...rest }: ImageProps) {
  const resolvedSrc = assetMap[src] || src;
  const imgStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : { ...style };

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={imgStyle}
    />
  );
}

export default Image;
