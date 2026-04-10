import { steps } from '@/data/landing';

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section-shell">
      <div className="section-heading">
        <p className="eyebrow">Onboarding workflow</p>
        <h2 className="section-title">From first source sync to fully deployed assistant.</h2>
      </div>
      <div className="timeline mt-10">
        {steps.map((step, index) => (
          <article key={step.title} className={`timeline-item ${index % 2 === 1 ? 'timeline-right' : ''}`.trim()}>
            <div className="timeline-dot">
              <step.icon size={16} />
            </div>
            <div className="timeline-card">
              <p className="text-sm font-semibold text-violet-600">Step {index + 1}</p>
              <h3 className="mt-2 text-xl font-semibold text-violet-950">{step.title}</h3>
              <p className="mt-2 text-sm text-violet-800">{step.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
