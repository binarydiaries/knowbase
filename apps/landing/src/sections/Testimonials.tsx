import { Card, CardContent } from '@knowbase/ui/components/card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote:
      'Knowbase cut our support ticket volume by 40% in the first week. The chatbot answers product questions instantly and our team can focus on real issues.',
    name: 'Priya Sharma',
    role: 'Head of Customer Success',
    company: 'Taskify',
    initials: 'PS',
  },
  {
    quote:
      'Setup was incredibly easy — we uploaded our docs, trained the bot, and had it live on our website in under an hour. The WhatsApp integration is a game changer.',
    name: 'Marcus Williams',
    role: 'Founder',
    company: 'ShipFast',
    initials: 'MW',
  },
  {
    quote:
      'Our customers get accurate answers at 2am without a human on call. The analytics dashboard helps us spot gaps in our knowledge base quickly.',
    name: 'Elena Kovač',
    role: 'Product Manager',
    company: 'Loopify',
    initials: 'EK',
  },
  {
    quote:
      'We tried building our own chatbot with raw APIs — it took months and still broke constantly. Knowbase does everything we need and then some.',
    name: 'Jordan Lee',
    role: 'CTO',
    company: 'Buildstack',
    initials: 'JL',
  },
  {
    quote:
      'The Instagram DM integration alone is worth it. We handle hundreds of product inquiries a day automatically and our response time went from hours to seconds.',
    name: 'Amara Osei',
    role: 'E-Commerce Director',
    company: 'Kente & Co.',
    initials: 'AO',
  },
  {
    quote:
      'Knowbase pays for itself within days. We reduced support staffing costs significantly while improving customer satisfaction scores across all channels.',
    name: 'Daniel Park',
    role: 'Operations Lead',
    company: 'Veritas SaaS',
    initials: 'DP',
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="bg-muted/20 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Testimonials
          </p>
          <h2 className="mb-4 font-bold text-3xl tracking-tight md:text-4xl">
            Used by More Than 100+ Businesses
          </h2>
          <p className="mx-auto max-w-xl text-muted-foreground text-lg">
            Run your support at scale with AI that knows your content.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="flex flex-col transition-shadow hover:shadow-md">
              <CardContent className="flex flex-1 flex-col p-6">
                <Stars />
                <p className="flex-1 text-sm leading-relaxed text-foreground mb-6">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-sm text-primary">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
