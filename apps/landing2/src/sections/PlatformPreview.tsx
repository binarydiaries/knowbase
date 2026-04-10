import { MockPanel } from '@/components/MockPanel';
import { valueCards } from '@/data/landing';

export function PlatformPreview() {
  return (
    <section className="section-shell">
      <div className="section-heading">
        <p className="eyebrow">Platform snapshot</p>
        <h2 className="section-title">A single control room for chatbot operations.</h2>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {valueCards.map((card) => (
          <MockPanel key={card.title} className="h-full">
            <card.icon size={18} className="text-violet-600" />
            <h3 className="mt-3 text-base font-semibold text-violet-950">{card.title}</h3>
            <p className="mt-2 text-sm text-violet-700/90">{card.text}</p>
          </MockPanel>
        ))}
      </div>
    </section>
  );
}
