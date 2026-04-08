import { Badge } from '@knowbase/ui/components/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@knowbase/ui/components/card';
import { Separator } from '@knowbase/ui/components/separator';
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  Cpu,
  Globe,
  Instagram,
  MessageSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import CTABanner from '@/sections/CTABanner';
import HowItWorks from '@/sections/HowItWorks';

const featureGroups = [
  {
    group: 'Knowledge Management',
    icon: BookOpen,
    features: [
      {
        title: 'Text Documents',
        description:
          'Paste or upload plain text to build your knowledge base. Knowbase handles chunking and storage automatically.',
      },
      {
        title: 'Q&A Pairs',
        description:
          'Define structured question-and-answer pairs for precise, consistent answers to common queries.',
      },
      {
        title: 'Versioned Sources',
        description:
          'Update knowledge sources any time. Each version is tracked so you can audit what the bot knew at any point.',
      },
    ],
  },
  {
    group: 'AI & Training',
    icon: Cpu,
    features: [
      {
        title: 'Automatic Indexing',
        description:
          'Documents are split into optimal chunks, embedded with state-of-the-art AI models, and stored in a vector database for fast semantic search.',
      },
      {
        title: 'Background Training',
        description:
          'Training jobs run in a background queue so your live chatbot is never interrupted while you add new content.',
      },
      {
        title: 'Semantic Search',
        description:
          'When a user asks a question, Knowbase retrieves the most relevant knowledge chunks and synthesises a precise, grounded answer.',
      },
    ],
  },
  {
    group: 'Channels & Deployment',
    icon: Globe,
    features: [
      {
        title: 'Web Widget',
        description:
          'Embed a floating chat bubble on any website with a single <script> tag. Customise colours and placement to match your brand.',
        icon: Globe,
      },
      {
        title: 'WhatsApp Business',
        description:
          'Connect your WhatsApp Business number in minutes. Customers get instant, accurate answers directly in WhatsApp.',
        icon: MessageSquare,
      },
      {
        title: 'Instagram DMs',
        description:
          'Automatically respond to Instagram Direct Messages with knowledge-backed answers, 24/7.',
        icon: Instagram,
      },
    ],
  },
  {
    group: 'Analytics & Insights',
    icon: BarChart3,
    features: [
      {
        title: 'Conversation Trends',
        description:
          'Track daily conversation volumes and spot usage patterns over time to plan capacity and content updates.',
      },
      {
        title: 'Sentiment Analysis',
        description:
          'Understand whether customers are leaving conversations satisfied, neutral, or frustrated -- and act on it.',
      },
      {
        title: 'Top Topics & Geographic Reach',
        description:
          "See what your customers are asking most and where they're located so you can localise and prioritise content.",
      },
    ],
  },
  {
    group: 'Customisation & Control',
    icon: BrainCircuit,
    features: [
      {
        title: 'Behaviour Configuration',
        description:
          "Write a custom system prompt to define your chatbot's name, personality, escalation rules, and fallback behaviour.",
      },
      {
        title: 'Per-Plan Usage Limits',
        description:
          'Hard limits on chatbots, sources, messages, and training runs per plan keep your costs predictable.',
      },
      {
        title: 'Organisation Management',
        description:
          'Invite team members, manage roles, and keep all your chatbots and data under one organisation.',
      },
    ],
  },
  {
    group: 'Security & Reliability',
    icon: ShieldCheck,
    features: [
      {
        title: 'Secure Auth via Clerk',
        description:
          'Enterprise-grade authentication with SSO, MFA, and session management powered by Clerk.',
      },
      {
        title: 'Encrypted Data Storage',
        description:
          'All knowledge sources and conversation data are stored with encryption at rest and in transit.',
      },
      {
        title: 'Background Job Queue',
        description:
          'Indexing and training tasks run through a reliable queue backed by Redis and BullMQ, with retries on failure.',
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      {/* Page hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Zap className="h-3 w-3" />
            Full feature list
          </Badge>
          <h1 className="mb-6 font-bold text-4xl tracking-tight md:text-5xl">
            Everything Knowbase can do
          </h1>
          <p className="text-muted-foreground text-xl leading-relaxed">
            A complete platform for creating, training, deploying, and analysing AI chatbots —
            built for teams that care about accuracy and control.
          </p>
        </div>
      </section>

      <Separator />

      {/* Feature groups */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl space-y-20">
          {featureGroups.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.group}>
                <div className="mb-8 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <GroupIcon className="h-5 w-5" />
                  </div>
                  <h2 className="font-bold text-2xl">{group.group}</h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {group.features.map((feature) => (
                    <Card key={feature.title} className="transition-shadow hover:shadow-md">
                      <CardHeader>
                        <CardTitle className="text-base">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="leading-relaxed">
                          {feature.description}
                        </CardDescription>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Separator />

      <HowItWorks />

      <Separator />

      <CTABanner />
    </>
  );
}
