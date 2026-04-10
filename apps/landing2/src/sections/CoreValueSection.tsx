import { FeatureCardSection } from '@/components/FeatureCardSection';
import { MockPanel } from '@/components/MockPanel';
import { coreValueBullets } from '@/data/landing';

export function CoreValueSection() {
  return (
    <FeatureCardSection
      id="features"
      tone="pink"
      title="Train assistants with your real knowledge, not generic internet noise."
      description="Build a dependable response layer by structuring what your bot can cite, how it should answer, and when it should escalate."
      bullets={coreValueBullets}
      visual={
        <MockPanel title="Sign in to Knowbase" subtitle="Workspace access">
          <div className="space-y-3 text-sm">
            <label className="grid gap-1">
              <span className="text-violet-700">Work email</span>
              <input className="input" value="ops@knowbase.ai" readOnly />
            </label>
            <label className="grid gap-1">
              <span className="text-violet-700">Password</span>
              <input className="input" value="••••••••••" readOnly />
            </label>
            <button type="button" className="btn w-full justify-center">
              Continue securely
            </button>
          </div>
        </MockPanel>
      }
    />
  );
}
