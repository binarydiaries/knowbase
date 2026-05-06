import { Mail } from 'lucide-react';
import {
  FaInstagram,
  FaLinkedin,
  FaTwitter,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';


const socialLinks = [
  { Icon: FaTwitter, label: 'Twitter / X', href: 'https://x.com/agenvik' },
  { Icon: FaLinkedin, label: 'LinkedIn', href: 'https://linkedin.com/company/agenvik' },
  { Icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com/agenvik' },
];

const Footer = () => {
  return (
    <footer className="px-6" aria-label="Site footer">
      <div className="w-full mx-auto">
        <div
          className="relative rounded-3xl p-10 md:p-14 overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: "url('/footer-bg.png')" }}
        >
          <div
            className="absolute inset-0 bg-white/50 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <div className="grid md:grid-cols-4 gap-10">
              {/* Logo */}
              <div className="col-span-1">
                <a href="/" aria-label="Agenvik home">
                  <img
                    src="/TextLogo.svg"
                    alt="Agenvik"
                    className="h-7 w-auto"
                  />
                </a>
              </div>

              {/* Quick Links */}
              <nav aria-label="Quick links">
                <h2 className="text-sm font-semibold text-[#301B69] mb-4">
                  Quick Links
                </h2>
                <ul className="space-y-2 text-sm text-[#301B69]/70 list-none">
                  <li>
                    <a href="#" className="hover:text-[#301B69]">Home</a>
                  </li>
                  <li>
                    <a href="#features" className="hover:text-[#301B69]">Features</a>
                  </li>
                  <li>
                    <a href="#how-it-works" className="hover:text-[#301B69]">How it Works</a>
                  </li>
                  <li>
                    <a href="#pricing" className="hover:text-[#301B69]">Pricing</a>
                  </li>
                  <li>
                    <a href="#faq" className="hover:text-[#301B69]">FAQ</a>
                  </li>
                  <li>
                    <Link to="/blog" className="hover:text-[#301B69]">Blog</Link>
                  </li>
                </ul>
              </nav>

              {/* Support */}
              <nav aria-label="Support links">
                <h2 className="text-sm font-semibold text-[#301B69] mb-4">
                  Support
                </h2>
                <ul className="space-y-2 text-sm text-[#301B69]/70 list-none">
                  <li>
                    <a href="https://docs.agenvik.com/" className="hover:text-[#301B69]">
                      User guide
                    </a>
                  </li>
                  <li>
                    <a href="https://docs.agenvik.com/developer-guide/overview" className="hover:text-[#301B69]">
                      Developer Guide
                    </a>
                  </li>
                  <li>
                    <a href="https://docs.agenvik.com/help-and-support/overview" className="hover:text-[#301B69]">
                      Help & Support
                    </a>
                  </li>
                </ul>
              </nav>

              {/* Contact */}
              <address className="not-italic">
                <h2 className="text-sm font-semibold text-[#301B69] mb-4">
                  Contact Us
                </h2>
                <ul className="space-y-3 text-sm text-[#301B69]/70 list-none">
                  <li className="flex items-center gap-2">
                    <Mail size={14} aria-hidden="true" />
                    <a
                      href="mailto:hello@agenvik.com"
                      className="hover:text-[#301B69]"
                    >
                      hello@agenvik.com
                    </a>
                  </li>
                  {/*<li className="flex items-center gap-2">*/}
                  {/*  <Phone size={14} aria-hidden="true" />*/}
                  {/*  <a*/}
                  {/*    href="tel:+14146875892"*/}
                  {/*    className="hover:text-[#301B69]"*/}
                  {/*    onClick={() => {}*/}
                  {/*    }*/}
                  {/*  >*/}
                  {/*    (414) 687-5892*/}
                  {/*  </a>*/}
                  {/*</li>*/}
                  {/*<li className="flex items-start gap-2">*/}
                  {/*  <MapPin*/}
                  {/*    size={14}*/}
                  {/*    className="mt-1 flex-shrink-0"*/}
                  {/*    aria-hidden="true"*/}
                  {/*  />*/}
                  {/*  <span>*/}
                  {/*    Kuberpuram*/}
                  {/*    <br />*/}
                  {/*    San Francisco, CA 94102*/}
                  {/*  </span>*/}
                  {/*</li>*/}
                </ul>
              </address>

              {/* Social */}
              <div>
                <h2 className="text-sm font-semibold text-[#301B69] mb-4">
                  Social
                </h2>
                <ul className="flex gap-3 list-none">
                  {socialLinks.map(({ Icon, label, href }) => (
                    <li key={label}>
                      <a
                        href={href}
                        aria-label={`Agenvik on ${label}`}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-[#301B69] text-white shadow-md hover:opacity-90 transition"
                      >
                        <Icon size={16} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-12 border-t border-[#301B69]/10" />

            <p className="text-center text-sm text-[#301B69]/70 mt-6">
              © 2026 Agenvik. All rights reserved. ·{' '}
              <Link to="/privacy-policy" className="hover:text-[#301B69]">
                Privacy Policy
              </Link>
              {' · '}
              <Link to="/terms" className="hover:text-[#301B69]">
                Terms & Conditions
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
