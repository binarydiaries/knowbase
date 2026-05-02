import { Link } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      {/* Nav */}
      <header className="px-6 py-4 border-b border-[#301B69]/10 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" aria-label="Agenvik home">
            <img src="/TextLogo.svg" alt="Agenvik" className="h-7 w-auto" />
          </Link>
          <Link
            to="/"
            className="text-sm text-[#301B69]/70 hover:text-[#301B69] transition"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-3xl border border-[#301B69]/10 shadow-sm p-10 md:p-14">
          <div className="mb-10">
            <p className="text-xs text-[#301B69]/50 mb-2">
              Last updated: April 21, 2026
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#301B69] mb-4">
              Privacy Policy
            </h1>
            <p className="text-[#301B69]/70 leading-relaxed">
              At Agenvik, we take your privacy seriously. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your
              information when you use our platform. Please read it carefully.
            </p>
          </div>

          <div className="space-y-10 text-[#301B69]/80 text-sm leading-relaxed">
            <section aria-labelledby="info-collect">
              <h2
                id="info-collect"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                1. Information We Collect
              </h2>
              <p className="mb-3">
                We collect information you provide directly to us when you:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Create an account or organization</li>
                <li>Subscribe to a paid plan</li>
                <li>Upload knowledge sources or configure AI agents</li>
                <li>Contact us for support</li>
              </ul>
              <p className="mt-3">
                This may include your name, email address, billing information,
                and any content you upload to the platform. We also
                automatically collect usage data such as IP addresses, browser
                type, pages visited, and interaction logs.
              </p>
            </section>

            <section aria-labelledby="how-use">
              <h2
                id="how-use"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                2. How We Use Your Information
              </h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Provide, operate, and maintain the Agenvik platform</li>
                <li>Process billing and manage your subscription</li>
                <li>
                  Train and improve your AI agents based on your uploaded
                  knowledge
                </li>
                <li>
                  Send transactional emails (account updates, billing receipts)
                </li>
                <li>Respond to your support requests</li>
                <li>
                  Monitor and analyze usage patterns to improve our service
                </li>
                <li>Comply with legal obligations</li>
              </ul>
              <p className="mt-3">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section aria-labelledby="data-sharing">
              <h2
                id="data-sharing"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                3. How We Share Your Information
              </h2>
              <p className="mb-3">We may share your information with:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Service providers</strong> — third-party vendors that
                  help us operate the platform (e.g., cloud hosting, payment
                  processors, authentication)
                </li>
                <li>
                  <strong>AI model providers</strong> — anonymized or necessary
                  data may be passed to LLM providers to generate responses for
                  your agents
                </li>
                <li>
                  <strong>Legal authorities</strong> — if required by law, court
                  order, or to protect our rights
                </li>
              </ul>
              <p className="mt-3">
                All third-party providers are bound by their own privacy
                policies and data processing agreements.
              </p>
            </section>

            <section aria-labelledby="data-retention">
              <h2
                id="data-retention"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                4. Data Retention
              </h2>
              <p>
                We retain your data for as long as your account is active or as
                needed to provide our services. If you delete your account, we
                will delete or anonymize your personal information within 30
                days, except where retention is required by law.
              </p>
            </section>

            <section aria-labelledby="security">
              <h2
                id="security"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                5. Security
              </h2>
              <p>
                We implement industry-standard security measures including
                encryption in transit (TLS), encryption at rest, and access
                controls. However, no method of transmission over the internet
                is 100% secure. We encourage you to use a strong password and
                keep your credentials confidential.
              </p>
            </section>

            <section aria-labelledby="cookies">
              <h2
                id="cookies"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                6. Cookies
              </h2>
              <p>
                We use cookies and similar tracking technologies to maintain
                session state, remember preferences, and analyze usage. You can
                control cookie settings through your browser. Disabling cookies
                may affect certain features of the platform.
              </p>
            </section>

            <section aria-labelledby="your-rights">
              <h2
                id="your-rights"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                7. Your Rights
              </h2>
              <p className="mb-3">
                Depending on your location, you may have the right to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to or restrict processing of your data</li>
                <li>Data portability</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, contact us at{' '}
                <a
                  href="mailto:privacy@agenvik.com"
                  className="text-[#301B69] underline"
                >
                  privacy@agenvik.com
                </a>
                .
              </p>
            </section>

            <section aria-labelledby="children">
              <h2
                id="children"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                8. Children's Privacy
              </h2>
              <p>
                Agenvik is not directed at children under 13. We do not
                knowingly collect personal information from children. If you
                believe we have inadvertently collected such information, please
                contact us immediately.
              </p>
            </section>

            <section aria-labelledby="changes">
              <h2
                id="changes"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                9. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of significant changes via email or a notice on the
                platform. Continued use of Agenvik after changes take effect
                constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section aria-labelledby="contact">
              <h2
                id="contact"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                10. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at:
              </p>
              <address className="not-italic mt-3 space-y-1">
                <p>
                  <strong>Agenvik</strong>
                </p>
                {/*<p>794 McAllister St, San Francisco, CA 94102</p>*/}
                <p>
                  <a
                    href="mailto:hello@agenvik.com"
                    className="text-[#301B69] underline"
                  >
                    hello@agenvik.com
                  </a>
                </p>
              </address>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-sm text-[#301B69]/50 py-8">
        <p>
          © 2026 Agenvik. All rights reserved. ·{' '}
          <Link to="/privacy-policy" className="hover:text-[#301B69]">
            Privacy Policy
          </Link>
          {' · '}
          <Link to="/terms" className="hover:text-[#301B69]">
            Terms & Conditions
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default PrivacyPolicyPage;
