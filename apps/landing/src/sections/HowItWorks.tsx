import { Badge } from '@knowbase/ui/components/badge';

const steps = [
  {
    number: '01',
    title: 'Create a chatbot & add knowledge',
    description:
      'Sign up, create your first chatbot, and upload your knowledge sources -- paste text, add Q&A pairs, or write custom content. Knowbase stores and organises everything for you.',
  },
  {
    number: '02',
    title: 'Train and configure behaviour',
    description:
      "Trigger training with one click. Knowbase indexes your documents in the background using AI embeddings. Configure the bot's personality, tone, and response style to match your brand.",
  },
  {
    number: '03',
    title: 'Deploy to your channels',
    description:
      'Connect Web, WhatsApp, or Instagram. Embed the widget on your site with a single script tag, or activate the channel integration -- your chatbot is live within minutes.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-muted/30 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">How it works</Badge>
          <h2 className="mb-4 font-bold text-3xl tracking-tight md:text-4xl">
            From knowledge to chatbot in three steps
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
            No engineers needed. If you can type, you can ship a production-ready AI chatbot.
          </p>
        </div>

        <div className="relative grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-border bg-background shadow-sm">
                <span className="font-bold text-2xl text-primary">{step.number}</span>
              </div>
              <h3 className="mb-3 font-semibold text-lg">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
