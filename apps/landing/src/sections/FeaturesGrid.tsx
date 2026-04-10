import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import { Card, CardContent } from '@knowbase/ui/components/card';
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  Check,
  Globe,
  Instagram,
  MessageSquare,
  Cpu,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const featureSections = [
  {
    badge: 'Knowledge',
    title: 'Knowledge Base for Streamlined Workflows',
    description:
      'Upload documents, paste text, or define Q&A pairs. Your chatbot learns from your content and stays accurate as your knowledge grows.',
    features: [
      { icon: BookOpen, label: 'Automated Ingestion' },
      { icon: BrainCircuit, label: 'Smart AI Training' },
      { icon: Cpu, label: 'Q&A Pairs Support' },
      { icon: Globe, label: 'Integration Hub' },
    ],
    bg: 'bg-violet-50',
    badgeClass: 'bg-violet-100 text-violet-700',
    reverse: false,
    mockup: (
      <Card className="shadow-lg">
        <CardContent className="p-4 space-y-3">
          <p className="font-semibold text-sm text-muted-foreground">Knowledge Sources</p>
          {['Product Manual.pdf', 'FAQ Document.docx', 'Support Guide.txt'].map((file) => (
            <div key={file} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
              <div className="h-8 w-8 rounded-md bg-violet-100 flex items-center justify-center text-violet-600">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{file}</p>
                <p className="text-xs text-muted-foreground">Indexed · Ready</p>
              </div>
              <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                <Check className="h-3 w-3 text-green-600" />
              </div>
            </div>
          ))}
          <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700">
            + Add new source
          </div>
        </CardContent>
      </Card>
    ),
  },
  {
    badge: 'Channels',
    title: 'Multi-Channel Deployment for Every Customer',
    description:
      'Publish your chatbot to your website, WhatsApp Business, and Instagram DMs — all from a single dashboard, configured once.',
    features: [
      { icon: Globe, label: 'Web Widget' },
      { icon: MessageSquare, label: 'WhatsApp Business' },
      { icon: Instagram, label: 'Instagram DMs' },
      { icon: BarChart3, label: 'Unified Dashboard' },
    ],
    bg: 'bg-sky-50',
    badgeClass: 'bg-sky-100 text-sky-700',
    reverse: true,
    mockup: (
      <Card className="shadow-lg">
        <CardContent className="p-4 space-y-3">
          <p className="font-semibold text-sm text-muted-foreground">Active Channels</p>
          {[
            { icon: Globe, name: 'Web Widget', status: 'Live', color: 'bg-green-100 text-green-700', iconBg: 'bg-sky-100 text-sky-600' },
            { icon: MessageSquare, name: 'WhatsApp', status: 'Live', color: 'bg-green-100 text-green-700', iconBg: 'bg-sky-100 text-sky-600' },
            { icon: Instagram, name: 'Instagram DMs', status: 'Live', color: 'bg-green-100 text-green-700', iconBg: 'bg-sky-100 text-sky-600' },
          ].map(({ icon: Icon, name, status, color, iconBg }) => (
            <div key={name} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${iconBg}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">{name}</p>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    ),
  },
  {
    badge: 'Analytics',
    title: 'Clear Insights for Smarter Support Decisions',
    description:
      'Track sentiment, top topics, geographic reach, and channel performance to continuously improve your support experience.',
    features: [
      { icon: BarChart3, label: 'Conversation Analytics' },
      { icon: BrainCircuit, label: 'Sentiment Tracking' },
      { icon: Globe, label: 'Geographic Reach' },
      { icon: Cpu, label: 'Topic Detection' },
    ],
    bg: 'bg-emerald-50',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    reverse: false,
    mockup: (
      <Card className="shadow-lg">
        <CardContent className="p-4 space-y-3">
          <p className="font-semibold text-sm text-muted-foreground">This Month</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Messages', value: '1,842' },
              { label: 'Resolved', value: '94%' },
              { label: 'Avg. Response', value: '1.2s' },
              { label: 'Satisfaction', value: '4.8 ★' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-bold text-lg text-emerald-600">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-1 items-end h-12 pt-2">
            {[40, 65, 50, 80, 70, 90, 75].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm bg-emerald-200" style={{ height: `${h}%` }} />
            ))}
          </div>
        </CardContent>
      </Card>
    ),
  },
];

export default function FeaturesGrid() {
  return (
    <section className="px-6 py-20 space-y-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {featureSections.map((section) => (
          <div
            key={section.badge}
            className={`rounded-3xl ${section.bg} p-8 md:p-12`}
          >
            <div className={`grid items-center gap-10 md:grid-cols-2 ${section.reverse ? 'md:[&>*:first-child]:order-last' : ''}`}>
              {/* Text side */}
              <div>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold mb-4 ${section.badgeClass}`}>
                  {section.badge}
                </span>
                <h3 className="mb-4 font-bold text-2xl md:text-3xl leading-snug">
                  {section.title}
                </h3>
                <p className="mb-6 text-muted-foreground leading-relaxed">
                  {section.description}
                </p>
                <ul className="mb-8 grid grid-cols-2 gap-3">
                  {section.features.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-2 text-sm font-medium">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      {label}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/features">Learn more</Link>
                </Button>
              </div>

              {/* Mockup side */}
              <div>{section.mockup}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
