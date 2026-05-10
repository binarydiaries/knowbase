import { Link } from 'react-router-dom';

const SecurityPolicyPage = () => {
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
              Last updated: May 10, 2026
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#301B69] mb-4">
              Security Policy
            </h1>
            <p className="text-[#301B69]/70 leading-relaxed">
              Security is a core part of how we build and operate Agenvik. This
              page describes our security practices and how to report
              vulnerabilities responsibly.
            </p>
          </div>

          <div className="space-y-10 text-[#301B69]/80 text-sm leading-relaxed">
            <section aria-labelledby="infrastructure">
              <h2
                id="infrastructure"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                1. Infrastructure Security
              </h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>All traffic is encrypted in transit using TLS 1.2 or higher</li>
                <li>API servers enforce strict CORS policies — only authorised origins are permitted</li>
                <li>Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy) are applied on all responses</li>
                <li>Rate limiting is applied globally to prevent abuse and brute-force attacks</li>
                <li>Database access is restricted to private network only — no public exposure</li>
              </ul>
            </section>

            <section aria-labelledby="data-protection">
              <h2
                id="data-protection"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                2. Data Protection
              </h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Sensitive credentials (third-party access tokens) are encrypted at rest using AES-256-GCM before being stored in our database</li>
                <li>Passwords are never stored — authentication is handled by Clerk using industry-standard protocols</li>
                <li>Data is logically isolated per organisation — no cross-tenant data access is possible</li>
                <li>
                  Your data is{' '}
                  <strong>not used to train AI models</strong> — we use the
                  OpenAI API under a Zero Data Retention agreement for
                  inference only
                </li>
              </ul>
            </section>

            <section aria-labelledby="access-control">
              <h2
                id="access-control"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                3. Access Controls
              </h2>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>All API endpoints require authenticated JWT tokens issued by Clerk</li>
                <li>Every database query is scoped to the authenticated organisation ID — no query can access another tenant's data</li>
                <li>Admin-only endpoints are protected by a separate allowlist guard</li>
                <li>Internal team access to production systems follows the principle of least privilege</li>
              </ul>
            </section>

            <section aria-labelledby="webhook-security">
              <h2
                id="webhook-security"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                4. Webhook Security
              </h2>
              <p>
                All inbound webhooks from third-party platforms (Slack,
                Razorpay) are verified using HMAC-SHA256 signatures before any
                processing occurs. Requests with invalid or missing signatures
                are rejected immediately. Timestamp validation is applied where
                supported to prevent replay attacks.
              </p>
            </section>

            <section aria-labelledby="subprocessors">
              <h2
                id="subprocessors"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                5. Subprocessors
              </h2>
              <p className="mb-3">
                We rely on the following third-party services to operate
                Agenvik. Each is bound by a data processing agreement and their
                own security certifications.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-[#301B69]/10">
                      <th className="text-left py-2 pr-6 font-semibold text-[#301B69]">Provider</th>
                      <th className="text-left py-2 pr-6 font-semibold text-[#301B69]">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#301B69]/5">
                    <tr>
                      <td className="py-2 pr-6">OpenAI</td>
                      <td className="py-2">AI inference (embeddings + chat completions)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6">Clerk</td>
                      <td className="py-2">Authentication &amp; organisation management</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6">Razorpay</td>
                      <td className="py-2">Payment processing</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6">Resend</td>
                      <td className="py-2">Transactional email</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6">Sentry</td>
                      <td className="py-2">Error monitoring (PII collection disabled)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6">PostgreSQL (self-hosted)</td>
                      <td className="py-2">Primary database</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-6">Redis (self-hosted)</td>
                      <td className="py-2">Queue &amp; cache</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="incident-response">
              <h2
                id="incident-response"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                6. Incident Response
              </h2>
              <p>
                In the event of a confirmed security incident affecting customer
                data, we will notify affected customers within{' '}
                <strong>72 hours</strong> of becoming aware of the breach, in
                line with GDPR requirements. Notifications will be sent to the
                email address associated with your account and will include the
                nature of the incident, data affected, and steps being taken.
              </p>
            </section>

            <section aria-labelledby="vulnerability-disclosure">
              <h2
                id="vulnerability-disclosure"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                7. Vulnerability Disclosure
              </h2>
              <p className="mb-3">
                We welcome responsible disclosure of security vulnerabilities.
                If you discover a potential security issue, please report it to
                us before disclosing it publicly.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mb-3">
                <li>
                  Email:{' '}
                  <a
                    href="mailto:security@agenvik.com"
                    className="text-[#301B69] underline"
                  >
                    security@agenvik.com
                  </a>
                </li>
                <li>Include a clear description and steps to reproduce</li>
                <li>Give us reasonable time to investigate and remediate before public disclosure</li>
                <li>Do not access, modify, or delete data belonging to other users</li>
              </ul>
              <p>
                We will acknowledge your report within{' '}
                <strong>2 business days</strong> and keep you updated on our
                progress. We do not pursue legal action against researchers who
                act in good faith.
              </p>
            </section>

            <section aria-labelledby="contact">
              <h2
                id="contact"
                className="text-lg font-semibold text-[#301B69] mb-3"
              >
                8. Contact
              </h2>
              <p>For security-related matters:</p>
              <address className="not-italic mt-3 space-y-1">
                <p>
                  <a
                    href="mailto:security@agenvik.com"
                    className="text-[#301B69] underline"
                  >
                    security@agenvik.com
                  </a>
                </p>
              </address>
              <p className="mt-3">For general enquiries:</p>
              <address className="not-italic mt-3 space-y-1">
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
          {' · '}
          <Link to="/security-policy" className="hover:text-[#301B69]">
            Security
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default SecurityPolicyPage;
