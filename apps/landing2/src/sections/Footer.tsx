import { footerColumns, socialLinks } from '@/data/landing';

export function Footer() {
  return (
    <footer className="section-shell pb-16">
      <div className="rounded-[2rem] border border-white/40 bg-white/65 p-8 shadow-[0_15px_50px_rgba(72,37,120,0.13)]">
        <div className="grid gap-8 md:grid-cols-[1.2fr_2fr]">
          <div>
            <a href="#top" className="logo-link text-2xl">
              Knowbase
            </a>
            <p className="mt-4 max-w-sm text-sm text-violet-700">AI chatbot operations platform for trustworthy, scalable customer conversations.</p>
            <a href="#pricing" className="btn mt-5">
              Start now
            </a>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold text-violet-900">{column.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-violet-700">
                  {column.links.map((link) => (
                    <li key={link}>
                      <a href="#top" className="footer-link">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-violet-200 pt-5">
          <p className="text-sm text-violet-700">© {new Date().getFullYear()} Knowbase. All rights reserved.</p>
          <div className="flex items-center gap-2">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} className="social-link" aria-label={item.label}>
                <item.icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
