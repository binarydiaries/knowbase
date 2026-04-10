import {
  Bot,
  BrainCircuit,
  CalendarCheck2,
  CircleHelp,
  GitFork,
  Globe,
  Layers,
  Linkedin,
  Mail,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  Twitter,
} from 'lucide-react';

export const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export const heroChips = ['Grounded responses', 'No-code setup', 'Omnichannel deploy'];

export const heroButtons = [
  { label: 'Explore product', href: '#features', variant: 'primary' as const },
  { label: 'See pricing', href: '#pricing', variant: 'secondary' as const },
];

export const coreValueBullets = [
  'Ingest PDFs, docs, links, and help-center pages in minutes.',
  'Auto-tag knowledge and preserve citation context in every answer.',
  'Review confidence signals before publishing to production channels.',
  'Draft fallback replies for gaps so users always get a safe response.',
];

export const managementBullets = [
  'Versioned chatbot prompts with release notes and approvals.',
  'Role-based workspaces for support, sales, and operations teams.',
  'Live conversation QA feed with handoff and escalation controls.',
  'Usage analytics by channel, intent, and unresolved topic clusters.',
];

export const planningBullets = [
  'Visual rollout map to coordinate assistants by region and segment.',
  'Timeline simulator to estimate launch readiness with blockers.',
  'Cross-team checkpoints for content, legal, and policy reviews.',
  'Scenario planning cards for seasonal traffic and campaign spikes.',
];

export const steps = [
  {
    title: 'Connect your knowledge',
    text: 'Attach docs, links, FAQs, and playbooks from the places your team already works.',
    icon: Layers,
  },
  {
    title: 'Shape assistant behavior',
    text: 'Define tone, risk boundaries, fallback rules, and escalation pathways for edge cases.',
    icon: BrainCircuit,
  },
  {
    title: 'Run practical tests',
    text: 'Simulate user questions, inspect answers with citations, and improve weak intents quickly.',
    icon: CircleHelp,
  },
  {
    title: 'Launch across channels',
    text: 'Publish to web chat, in-app support, and social DM entry points with centralized controls.',
    icon: Rocket,
  },
];

export const pricingPlans = [
  {
    name: 'Starter',
    price: '$39',
    subtitle: 'For a single live chatbot',
    features: ['1 workspace', '5k monthly messages', 'Basic source sync', 'Email support'],
    cta: 'Start Starter',
  },
  {
    name: 'Growth',
    price: '$129',
    subtitle: 'For scaling support and sales teams',
    features: ['5 workspaces', '40k monthly messages', 'A/B prompt experiments', 'Priority support'],
    cta: 'Choose Growth',
    highlighted: true,
  },
  {
    name: 'Scale',
    price: '$349',
    subtitle: 'For multi-brand operations',
    features: ['Unlimited workspaces', '200k monthly messages', 'SSO + audit trails', 'Dedicated success manager'],
    cta: 'Contact sales',
  },
];

export const faqs = [
  {
    question: 'How does Knowbase keep chatbot answers accurate?',
    answer:
      'Knowbase grounds responses in your uploaded sources, tracks citation context, and lets reviewers approve updates before release.',
  },
  {
    question: 'Can we launch one chatbot in multiple channels?',
    answer:
      'Yes. You can publish the same assistant to web, product surfaces, and social inbox entry points with channel-specific guardrails.',
  },
  {
    question: 'What happens when the chatbot is not confident?',
    answer:
      'Low-confidence replies can trigger fallback messaging, routing workflows, or immediate handoff to your human support queue.',
  },
  {
    question: 'Do we need developers to maintain the chatbot?',
    answer:
      'Not for daily operations. Non-technical teams can update content, prompts, and behavior policies from the Knowbase dashboard.',
  },
];

export const footerColumns = [
  {
    title: 'Product',
    links: ['Features', 'How it works', 'Pricing', 'Security'],
  },
  {
    title: 'Use cases',
    links: ['Customer support', 'Sales enablement', 'Internal helpdesk', 'Partner portals'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Contact', 'Legal'],
  },
];

export const socialLinks = [
  { label: 'X', href: '#', icon: Twitter },
  { label: 'LinkedIn', href: '#', icon: Linkedin },
  { label: 'Email', href: '#', icon: Mail },
];

export const previewStats = [
  { label: 'Resolved chats', value: '82%' },
  { label: 'Avg response time', value: '1.2s' },
  { label: 'Knowledge sources', value: '146' },
];

export const valueCards = [
  { title: 'Trusted grounding', icon: ShieldCheck, text: 'Every answer can cite its source snippets.' },
  { title: 'Smart routing', icon: GitFork, text: 'Escalate edge cases with policy-first logic.' },
  { title: 'Channel-ready', icon: Globe, text: 'Deploy assistants anywhere your users ask questions.' },
  { title: 'Rapid iteration', icon: Sparkles, text: 'Ship prompt and content updates in the same day.' },
  { title: 'Intent tracking', icon: MessageSquare, text: 'Spot unanswered topics before churn increases.' },
  { title: 'Launch planning', icon: CalendarCheck2, text: 'Coordinate launches with visible ownership steps.' },
  { title: 'Assistant controls', icon: Bot, text: 'Tune personality, tone, and risk boundaries quickly.' },
];
