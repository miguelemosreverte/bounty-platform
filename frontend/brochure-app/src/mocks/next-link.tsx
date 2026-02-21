import type { ReactNode, AnchorHTMLAttributes } from 'react';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
}

function Link({ href, children, prefetch, replace, scroll, shallow, passHref, legacyBehavior, style, ...rest }: LinkProps) {
  return (
    <a
      href={href}
      onClick={(e) => e.preventDefault()}
      style={{ ...style, cursor: 'default' }}
      {...rest}
    >
      {children}
    </a>
  );
}

export default Link;
