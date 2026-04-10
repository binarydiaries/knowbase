import { FeatureCardSection } from '@/components/FeatureCardSection';
import { MockPanel } from '@/components/MockPanel';
import { managementBullets } from '@/data/landing';

export function ManagementSection() {
  return (
    <FeatureCardSection
      tone="blue"
      reverse
      title="Manage chatbot quality as teams and channels grow."
      description="Coordinate contributors, review changes, and monitor live conversation quality from one workflow-friendly workspace."
      bullets={managementBullets}
      visual={
        <div className="grid gap-3">
          <MockPanel title="Create chatbot" subtitle="Internal support assistant">
            <div className="grid gap-3 text-sm">
              <label className="grid gap-1">
                <span className="text-violet-700">Assistant name</span>
                <input className="input" value="Helpdesk Copilot" readOnly />
              </label>
              <label className="grid gap-1">
                <span className="text-violet-700">Primary goal</span>
                <textarea
                  className="input min-h-20"
                  value="Deflect repetitive support questions and hand off account-specific tickets."
                  readOnly
                />
              </label>
              <div className="rounded-xl bg-violet-100 p-3 text-violet-800">Channels: Web widget, in-app panel, Instagram DM</div>
            </div>
          </MockPanel>

          <MockPanel title="Behavior settings" subtitle="Policy and escalation controls">
            <div className="space-y-2 text-sm text-violet-800">
              <div className="flex items-center justify-between rounded-xl bg-white p-3">
                <span>Friendly, concise tone</span>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Enabled</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white p-3">
                <span>Escalate billing disputes</span>
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">Enabled</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white p-3">
                <span>Auto-answer legal topics</span>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">Review</span>
              </div>
            </div>
          </MockPanel>
        </div>
      }
    />
  );
}
