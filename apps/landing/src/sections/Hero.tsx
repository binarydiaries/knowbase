import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import { Card, CardContent } from '@knowbase/ui/components/card';
import { ArrowRight, MessageCircle, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-violet-50 via-purple-50/40 to-white" />
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute -right-32 top-16 h-80 w-80 rounded-full bg-purple-200/30 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <Badge variant="secondary" className="mb-6 gap-1.5">
          <Sparkles className="h-3 w-3" />
          AI-Powered Knowledge Chatbots
        </Badge>

        <h1 className="mb-6 font-bold text-5xl leading-tight tracking-tight md:text-6xl lg:text-7xl">
          The Fastest Way to{' '}
          <span className="text-primary">Build Your AI Chatbot</span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-muted-foreground text-xl leading-relaxed">
          Create intelligent chatbots from your documents and Q&A pairs. Deploy them across Web,
          WhatsApp, and Instagram in minutes — no engineering required.
        </p>

        <div className="mb-4 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <a href="http://localhost:4001">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/pricing">Contact Sales</Link>
          </Button>
        </div>

        <p className="mb-16 text-muted-foreground text-sm">
          Free plan available · No credit card required
        </p>

        {/* Dashboard mockup */}
        <div className="mx-auto max-w-3xl">
          <Card className="shadow-2xl ring-1 ring-border">
            <CardContent className="p-0">
              {/* Mockup header bar */}
              <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="mx-auto flex h-6 w-48 items-center justify-center rounded-md bg-background px-2 text-muted-foreground text-xs">
                  app.knowbase.ai
                </div>
              </div>

              {/* Mockup content */}
              <div className="grid divide-x divide-border md:grid-cols-3">
                {/* Sidebar */}
                <div className="hidden space-y-3 p-4 md:block">
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Your Chatbots</p>
                  {['Support Bot', 'Sales Assistant', 'Onboarding Bot'].map((name, i) => (
                    <div
                      key={name}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${i === 0 ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                      {name}
                    </div>
                  ))}
                </div>

                {/* Chat area */}
                <div className="col-span-2 flex flex-col">
                  <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Support Bot</p>
                      <p className="text-muted-foreground text-xs">Online · Powered by Knowbase</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Web
                    </Badge>
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        U
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
                        How do I reset my password?
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Zap className="h-3.5 w-3.5" />
                      </div>
                      <div className="rounded-2xl rounded-tl-sm border border-border bg-background px-3 py-2 text-sm">
                        To reset your password, click "Forgot Password" on the login page and
                        enter your email. You'll receive a reset link within 2 minutes.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        U
                      </div>
                      <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
                        What if I don't receive the email?
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                      <MessageCircle className="h-3 w-3 animate-pulse" />
                      Bot is typing…
                    </div>
                  </div>

                  <div className="border-t border-border px-4 py-3">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-muted-foreground text-sm">
                      Type a message…
                      <ArrowRight className="ml-auto h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
