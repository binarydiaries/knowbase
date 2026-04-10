type PricingCardProps = {
  name: string;
  price: string;
  subtitle: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

export function PricingCard({ name, price, subtitle, features, cta, highlighted }: PricingCardProps) {
  return (
    <article className={`pricing-card ${highlighted ? 'highlighted' : ''}`.trim()}>
      <p className="text-sm font-semibold text-violet-700">{name}</p>
      <p className="mt-3 text-4xl font-bold text-violet-950">{price}</p>
      <p className="mt-2 text-sm text-violet-700/80">{subtitle}</p>
      <ul className="mt-6 space-y-2 text-sm text-violet-900/90">
        {features.map((feature) => (
          <li key={feature}>• {feature}</li>
        ))}
      </ul>
      <a href="#pricing" className="btn mt-7 w-full justify-center">
        {cta}
      </a>
    </article>
  );
}
