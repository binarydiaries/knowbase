import { Badge } from '@knowbase/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@knowbase/ui/components/card';
import { Separator } from '@knowbase/ui/components/separator';
import { ArrowRight, Clock } from 'lucide-react';
import CTABanner from '@/sections/CTABanner';

const posts = [
  {
    slug: 'introducing-knowbase',
    title: 'Introducing Knowbase: AI Chatbots for Your Knowledge Base',
    excerpt:
      "Today we're launching Knowbase -- a platform that lets any team build AI-powered chatbots trained on their own documents and deploy them across Web, WhatsApp, and Instagram in minutes.",
    date: 'April 8, 2026',
    readTime: '5 min read',
    category: 'Product',
  },
  {
    slug: 'deploy-whatsapp-chatbot',
    title: 'How to Deploy Your First WhatsApp Chatbot in 10 Minutes',
    excerpt:
      'A step-by-step walkthrough of connecting your WhatsApp Business account to Knowbase, adding a knowledge source, and going live -- in under 10 minutes.',
    date: 'March 25, 2026',
    readTime: '8 min read',
    category: 'Tutorial',
  },
  {
    slug: 'understanding-analytics',
    title: "Understanding Analytics: Making Sense of Your Chatbot Data",
    excerpt:
      "The Knowbase analytics dashboard surfaces conversation trends, sentiment, top topics, and geographic reach. Here's how to read the data and act on it.",
    date: 'March 12, 2026',
    readTime: '6 min read',
    category: 'Guide',
  },
  {
    slug: 'behaviour-config-guide',
    title: "Mastering Behaviour Config: Craft the Perfect Bot Personality",
    excerpt:
      "Your chatbot's personality is just as important as its knowledge. Learn how to write system prompts that make your bot sound helpful, on-brand, and human.",
    date: 'February 28, 2026',
    readTime: '7 min read',
    category: 'Guide',
  },
  {
    slug: 'multi-channel-strategy',
    title: "Multi-Channel Support: Why One Bot on Three Channels Beats Three Bots",
    excerpt:
      "Most teams silo support by channel. With Knowbase, you configure one chatbot and deploy it everywhere. Here's why that changes everything for consistency and maintenance.",
    date: 'February 14, 2026',
    readTime: '5 min read',
    category: 'Strategy',
  },
  {
    slug: 'indexing-explained',
    title: "How Knowbase Indexes Your Documents (And Why It Matters)",
    excerpt:
      "Under the hood, Knowbase splits your content into chunks, embeds them with AI, and stores them in a vector database. Here's a plain-English explanation of why this makes your bot accurate.",
    date: 'January 30, 2026',
    readTime: '6 min read',
    category: 'Technical',
  },
];

const categoryColors: Record<string, 'default' | 'secondary' | 'outline'> = {
  Product: 'default',
  Tutorial: 'secondary',
  Guide: 'secondary',
  Strategy: 'outline',
  Technical: 'outline',
};

export default function BlogPage() {
  return (
    <>
      {/* Page hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-6">Blog</Badge>
          <h1 className="mb-6 font-bold text-4xl tracking-tight md:text-5xl">
            From the Knowbase team
          </h1>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Product updates, tutorials, guides, and insights on AI chatbots and customer support.
          </p>
        </div>
      </section>

      <Separator />

      {/* Posts grid */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Card
                key={post.slug}
                className="group flex flex-col transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant={categoryColors[post.category] ?? 'secondary'} className="text-xs">
                      {post.category}
                    </Badge>
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="leading-relaxed">{post.excerpt}</CardDescription>
                </CardContent>
                <CardFooter className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">{post.date}</span>
                  <span className="flex items-center gap-1 text-primary text-xs font-medium">
                    Read more
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Separator />

      <CTABanner />
    </>
  );
}
