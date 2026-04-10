import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { navItems } from '@/data/landing';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-4 z-30 mx-auto w-[min(1100px,95%)]">
      <nav className="nav-shell" aria-label="Main navigation">
        <a href="#top" className="logo-link" onClick={() => setIsOpen(false)}>
          Knowbase
        </a>
        <button className="menu-btn md:hidden" type="button" aria-label="Toggle menu" onClick={() => setIsOpen((v) => !v)}>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <ul className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="nav-link">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {isOpen && (
        <div className="nav-mobile md:hidden">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="nav-link block" onClick={() => setIsOpen(false)}>
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
