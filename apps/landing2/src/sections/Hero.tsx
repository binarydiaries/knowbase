import { heroButtons, heroChips, previewStats } from '@/data/landing';
import { MockPanel } from '@/components/MockPanel';

export function Hero() {
  return (
    <section id="top" className="section-shell pt-14 md:pt-20">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-5 flex flex-wrap justify-center gap-2">
          {heroChips.map((chip) => (
            <span key={chip} className="chip">
              {chip}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-violet-950 md:text-6xl">Build AI chatbots your team can trust.</h1>
        <p className="section-copy mx-auto mt-6 max-w-2xl">
          Knowbase helps support and growth teams launch grounded chat experiences with governed knowledge, safe behavior rules, and clear rollout plans.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {heroButtons.map((button) => (
            <a key={button.label} href={button.href} className={`btn ${button.variant === 'secondary' ? 'btn-secondary' : ''}`.trim()}>
              {button.label}
            </a>
          ))}
        </div>
      </div>

      <MockPanel className="mt-12 overflow-hidden">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-2xl bg-violet-900 p-4 text-violet-100">
            <p className="text-xs uppercase tracking-wide text-violet-200">Workspace</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="rounded-lg bg-white/10 p-2">Knowledge sources</li>
              <li className="rounded-lg bg-white/10 p-2">Bot behavior</li>
              <li className="rounded-lg bg-white/10 p-2">Channel deployment</li>
              <li className="rounded-lg bg-white/10 p-2">QA monitor</li>
            </ul>
          </aside>
          <div className="space-y-4">
            <div className="rounded-2xl border border-violet-200/80 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-violet-500">Training queue</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {['Help center', 'Product docs', 'Policy pages'].map((src) => (
                  <div key={src} className="rounded-xl bg-violet-50 p-3 text-sm text-violet-800">
                    {src}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-violet-200/80 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-violet-500">Live chat preview</p>
              <div className="mt-3 space-y-3 text-sm">
                <p className="rounded-xl bg-violet-50 p-3 text-violet-900">User: How do I reset SSO for my team?</p>
                <p className="rounded-xl bg-indigo-900 p-3 text-indigo-50">Knowbase Bot: I can guide you through admin steps and share the exact policy article.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {previewStats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-violet-100/80 p-3 text-center">
              <p className="text-xs text-violet-600">{stat.label}</p>
              <p className="text-2xl font-semibold text-violet-950">{stat.value}</p>
            </div>
          ))}
        </div>
      </MockPanel>
    </section>
  );
}
