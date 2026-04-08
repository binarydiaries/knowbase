import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@knowbase/ui/components/card';
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  Cpu,
  Globe,
  ShieldCheck,
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Knowledge Base',
    description:
      'Upload documents, paste text, or define Q&A pairs. Your chatbot learns from your content and stays up to date as you add more.',
  },
  {
    icon: Globe,
    title: 'Multi-Channel Deploy',
    description:
      'Publish your chatbot to your website, WhatsApp Business, and Instagram DMs -- all from a single dashboard.',
  },
  {
    icon: Cpu,
    title: 'Smart Indexing',
    description:
      'Documents are automatically chunked, embedded, and indexed in the background so your bot always delivers accurate answers.',
  },
  {
    icon: BarChart3,
    title: 'Conversation Analytics',
    description:
      'Track sentiment, top topics, geographic reach, and channel performance to continuously improve your support experience.',
  },
  {
    icon: BrainCircuit,
    title: 'Behaviour Config',
    description:
      "Customise your bot's personality, tone, and system prompt. Define how it greets users, handles edge cases, and escalates to humans.",
  },
  {
    icon: ShieldCheck,
    title: 'Usage Controls',
    description:
      'Hard per-plan limits on chatbots, knowledge sources, messages, and training runs keep costs predictable and your team in control.',
  },
];

interface FeaturesGridProps {
  limit?: number;
}

export default function FeaturesGrid({ limit }: FeaturesGridProps) {
  const displayed = limit ? features.slice(0, limit) : features;

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-3xl tracking-tight md:text-4xl">
            Everything you need to build smarter support
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            From ingesting your knowledge base to deploying across every channel your customers
            use -- Knowbase handles it all.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
