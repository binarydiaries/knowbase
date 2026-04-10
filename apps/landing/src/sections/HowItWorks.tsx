import { Button } from '@knowbase/ui/components/button';
import { Card, CardContent } from '@knowbase/ui/components/card';
import { ArrowRight, Bot, Calendar, Settings2, BarChart3 } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Bot,
    title: 'Setup your Account',
    description:
      'Sign up and create your first chatbot. Give it a name, choose a default language, and set your brand tone in minutes.',
    mockupLines: ['Name: Support Bot', 'Language: English', 'Tone: Professional'],
  },
  {
    number: '02',
    icon: Calendar,
    title: 'Add Your Knowledge',
    description:
      'Upload documents, paste text, or define Q&A pairs. Knowbase indexes everything using AI embeddings in the background.',
    mockupLines: ['Product Manual.pdf ✓', 'FAQ Document.docx ✓', 'Support Guide.txt ✓'],
  },
  {
    number: '03',
    icon: Settings2,
    title: 'Configure Behaviour',
    description:
      "Set your bot's personality, system prompt, and escalation rules. Preview responses before going live.",
    mockupLines: ['System prompt set', 'Escalation: enabled', 'Preview: ✓ Passed'],
  },
  {
    number: '04',
    icon: BarChart3,
    title: 'Deploy & Track',
    description:
      'Activate Web, WhatsApp, or Instagram channels. Monitor conversations, satisfaction scores, and topics in real-time.',
    mockupLines: ['Web Widget: Live', 'WhatsApp: Live', 'Messages today: 142'],
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            How it works
          </p>
          <h2 className="mb-4 font-bold text-3xl tracking-tight md:text-4xl">
            Steps to Seamless AI Chatbot Setup
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            No engineers needed. If you can type, you can ship a production-ready AI chatbot.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-bold text-2xl text-primary/30">{step.number}</span>
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">{step.title}</h3>
                  <p className="mb-5 text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                  {/* Mini mockup */}
                  <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 space-y-1.5">
                    {step.mockupLines.map((line) => (
                      <p key={line} className="text-xs text-muted-foreground font-mono">
                        {line}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mid-section CTA */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl bg-primary/5 px-8 py-6 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-semibold text-lg">Ready to deploy your AI chatbot?</p>
            <p className="text-muted-foreground text-sm">
              Set up your account and go live in under 10 minutes.
            </p>
          </div>
          <Button asChild>
            <a href="http://localhost:4001">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
