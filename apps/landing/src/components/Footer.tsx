import { Separator } from '@knowbase/ui/components/separator';
import { Github, Linkedin, Twitter, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const footerLinks = {
  'Quick Links': [
    { label: 'Features', to: '/features' },
    { label: 'How It Works', to: '/#how-it-works' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Blog', to: '/blog' },
  ],
  Support: [
    { label: 'Documentation', to: '/' },
    { label: 'Help Center', to: '/' },
    { label: 'Contact', to: '/' },
  ],
  'Contact Us': [
    { label: 'hello@knowbase.ai', to: 'mailto:hello@knowbase.ai' },
    { label: 'Privacy Policy', to: '/' },
    { label: 'Terms of Service', to: '/' },
  ],
};

const socials = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-3.5 w-3.5" />
              </div>
              Knowbase
            </Link>
            <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
              AI-powered chatbots trained on your knowledge base, deployed anywhere.
            </p>
            <div className="mt-5 flex gap-3">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="mb-4 font-semibold text-sm">{group}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 text-muted-foreground text-sm sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Knowbase. All rights reserved.</p>
          <p>Built for teams who value knowledge.</p>
        </div>
      </div>
    </footer>
  );
}
