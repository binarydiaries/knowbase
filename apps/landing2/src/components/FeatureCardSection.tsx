import type { ReactNode } from 'react';

type FeatureCardSectionProps = {
  id?: string;
  title: string;
  description: string;
  bullets: string[];
  visual: ReactNode;
  tone: 'pink' | 'blue' | 'lilac';
  reverse?: boolean;
};

export function FeatureCardSection({ id, title, description, bullets, visual, tone, reverse }: FeatureCardSectionProps) {
  return (
    <section id={id} className="section-shell">
      <div className={`feature-card ${tone} ${reverse ? 'lg:grid-flow-col-dense' : ''}`}>
        <div className={reverse ? 'lg:col-start-2' : ''}>
          <h2 className="section-title">{title}</h2>
          <p className="section-copy mt-4">{description}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {bullets.map((bullet) => (
              <li key={bullet} className="bullet-card">
                {bullet}
              </li>
            ))}
          </ul>
        </div>
        <div className={reverse ? 'lg:col-start-1' : ''}>{visual}</div>
      </div>
    </section>
  );
}
