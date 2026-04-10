import { FeatureCardSection } from '@/components/FeatureCardSection';
import { MockPanel } from '@/components/MockPanel';
import { planningBullets } from '@/data/landing';

export function PlanningSection() {
  return (
    <FeatureCardSection
      tone="lilac"
      title="Plan launches visually before the first user message arrives."
      description="Map milestones, approvals, and confidence thresholds so each chatbot rollout has clear ownership and fewer surprises."
      bullets={planningBullets}
      visual={
        <MockPanel title="Knowledge + Q&A form" subtitle="Readiness checklist">
          <form className="grid gap-3 text-sm" onSubmit={(event) => event.preventDefault()}>
            <label className="grid gap-1">
              <span className="text-violet-700">Primary source set</span>
              <input className="input" value="Knowledge base / Help center" readOnly />
            </label>
            <label className="grid gap-1">
              <span className="text-violet-700">Example user question</span>
              <input className="input" value="How do I rotate API keys safely?" readOnly />
            </label>
            <label className="grid gap-1">
              <span className="text-violet-700">Expected answer behavior</span>
              <textarea className="input min-h-20" value="Provide exact steps and link to security policy; escalate if account mismatch detected." readOnly />
            </label>
            <div className="rounded-xl border border-violet-200 bg-white p-3 text-violet-800">Status: 94% scenario pass rate · Ready for staged rollout</div>
          </form>
        </MockPanel>
      }
    />
  );
}
