import type { ReactNode } from 'react';

type MockPanelProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
};

export function MockPanel({ title, subtitle, children, className = '' }: MockPanelProps) {
  return (
    <article className={`mock-panel ${className}`.trim()}>
      {(title || subtitle) && (
        <header className="mb-4">
          {title && <h3 className="text-sm font-semibold text-violet-950">{title}</h3>}
          {subtitle && <p className="mt-1 text-xs text-violet-700/80">{subtitle}</p>}
        </header>
      )}
      {children}
    </article>
  );
}
