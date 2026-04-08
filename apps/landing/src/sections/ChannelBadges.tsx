import { Badge } from '@knowbase/ui/components/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@knowbase/ui/components/card';
import { Globe, Instagram, MessageSquare } from 'lucide-react';

const channels = [
  {
    icon: Globe,
    name: 'Web Widget',
    description:
      'Embed a floating chat widget on any website with a single script tag. Fully customisable to match your brand.',
    badge: 'Available now',
    badgeVariant: 'default' as const,
  },
  {
    icon: MessageSquare,
    name: 'WhatsApp',
    description:
      'Connect your WhatsApp Business account and let customers get instant answers right where they already are.',
    badge: 'Available now',
    badgeVariant: 'default' as const,
  },
  {
    icon: Instagram,
    name: 'Instagram DMs',
    description:
      'Automatically respond to Instagram Direct Messages with accurate, on-brand answers powered by your knowledge base.',
    badge: 'Available now',
    badgeVariant: 'default' as const,
  },
];

export default function ChannelBadges() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-bold text-3xl tracking-tight md:text-4xl">
            Meet your customers wherever they are
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            One chatbot, multiple channels. Configure once and deploy everywhere your customers
            expect support.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <Card key={channel.name} className="text-center transition-shadow hover:shadow-md">
                <CardHeader className="items-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" />
                  </div>
                  <Badge variant={channel.badgeVariant} className="mb-2 text-xs">
                    {channel.badge}
                  </Badge>
                  <CardTitle className="text-lg">{channel.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-relaxed">{channel.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
