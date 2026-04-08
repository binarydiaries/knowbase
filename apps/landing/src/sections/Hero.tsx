import { Badge } from '@knowbase/ui/components/badge';
import { Button } from '@knowbase/ui/components/button';
import { Card, CardContent } from '@knowbase/ui/components/card';
import { ArrowRight, MessageCircle, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:py-32">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary/5 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Left: Copy */}
          <div className="max-w-xl">
            <Badge variant="secondary" className="mb-6 gap-1.5">
              <Sparkles className="h-3 w-3" />
              AI-Powered Knowledge Chatbots
            </Badge>

            <h1 className="mb-6 font-bold text-5xl leading-tight tracking-tight md:text-6xl">
              Build AI Chatbots{' '}
              <span className="text-primary">Trained on Your Knowledge</span>
            </h1>

            <p className="mb-8 text-muted-foreground text-xl leading-relaxed">
              Create intelligent chatbots from your documents and Q&A pairs. Deploy them across Web,
              WhatsApp, and Instagram in minutes — no engineering required.
            </p>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="http://localhost:4001">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>

            <p className="mt-4 text-muted-foreground text-sm">
              Free plan available · No credit card required
            </p>
          </div>

          {/* Right: Abstract UI mockup */}
          <div className="relative">
            <Card className="shadow-2xl">
              <CardContent className="p-0">
                {/* Mockup header */}
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

                {/* Chat messages */}
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
                      To reset your password, click "Forgot Password" on the login page and enter
                      your email. You'll receive a reset link within 2 minutes.
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

                {/* Input */}
                <div className="border-t border-border px-4 py-3">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-muted-foreground text-sm">
                    Type a message…
                    <ArrowRight className="ml-auto h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating badges */}
            <div className="absolute -right-4 -top-4 hidden lg:block">
              <Badge className="shadow-md">WhatsApp ✓</Badge>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden lg:block">
              <Badge variant="secondary" className="shadow-md">
                Instagram ✓
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
