// app/privacy/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${APP_CONFIG.name} — how we collect, hold, use and disclose personal information under the Australian Privacy Principles.`,
};

export default function PrivacyPolicyPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-mq-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <Link
              href="/home"
              className="text-sm text-mq-primary hover:underline inline-flex items-center gap-1"
            >
              &larr; Back to {APP_CONFIG.name}
            </Link>
            <h1 className="text-3xl font-bold text-mq-content">Privacy Policy</h1>
            <p className="text-sm text-mq-content-secondary">
              Last updated: 16 February 2026 (AEDT)
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none text-mq-content space-y-6">
            {/* 1. Purpose and Scope */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">1. Purpose and scope</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                This Privacy Policy explains how {APP_CONFIG.name} (&quot;we&quot;, &quot;us&quot;,
                &quot;our&quot;) collects, holds, uses and discloses personal information when you
                use our web application and progressive web app (the &quot;Service&quot;). We are
                committed to handling personal information in accordance with the{' '}
                <strong>Australian Privacy Principles (APPs)</strong> under the{' '}
                <em>Privacy Act 1988 (Cth)</em>.
              </p>
              <p className="text-mq-content-secondary leading-relaxed">
                {APP_CONFIG.name} is a campus companion tool developed for students at{' '}
                {UNIVERSITY_CONFIG.name}. This policy applies to all users of the Service.
              </p>
            </section>

            {/* 2. What Personal Information We Collect */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">
                2. What personal information we collect
              </h2>

              <h3 className="text-base font-semibold text-mq-content">
                A) Account and identity data
              </h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>Full name (or display name)</li>
                <li>Email address</li>
                <li>
                  Password (stored as a cryptographic hash &mdash; we never store your raw password)
                </li>
                <li>Student ID, course, and year of study</li>
                <li>Account preferences and settings</li>
                <li>Profile avatar (if uploaded)</li>
              </ul>

              <h3 className="text-base font-semibold text-mq-content">
                B) Multi-factor authentication data
              </h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>
                  TOTP enrolment secrets (time-based one-time password), stored encrypted and served
                  with{' '}
                  <code className="text-xs bg-mq-card-background px-1 py-0.5 rounded">
                    Cache-Control: no-store
                  </code>
                </li>
                <li>
                  WebAuthn/passkey credential IDs and public keys (no biometric data is stored)
                </li>
              </ul>

              <h3 className="text-base font-semibold text-mq-content">C) Usage and device data</h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>Device type, browser, operating system, language preference</li>
                <li>IP address (for security rate-limiting and abuse prevention)</li>
                <li>Timestamps and basic request metadata</li>
                <li>
                  Application error logs and performance diagnostics (collected via Sentry with all
                  text masked and media blocked)
                </li>
              </ul>

              <h3 className="text-base font-semibold text-mq-content">
                D) Learning and timetable content (user-provided)
              </h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>Units/courses, schedules, deadlines, reminders, and to-do items you create</li>
                <li>Calendar events and feed preferences</li>
              </ul>

              <h3 className="text-base font-semibold text-mq-content">
                E) Location data (only with your permission)
              </h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>
                  GPS coordinates for campus map and navigation features &mdash; collected only when
                  you grant browser/device location permission
                </li>
                <li>
                  Location data is processed locally on your device for real-time navigation and is{' '}
                  <strong>not stored on our servers</strong>
                </li>
                <li>
                  You can revoke location permission at any time via your device or browser settings
                </li>
              </ul>

              <h3 className="text-base font-semibold text-mq-content">
                F) Cookies and session data
              </h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>Session cookies (strictly necessary for authentication)</li>
                <li>Security cookies (CSRF protection)</li>
                <li>Theme and language preference cookies</li>
              </ul>

              <p className="text-mq-content-secondary leading-relaxed">
                We do <strong>not</strong> intentionally collect &quot;sensitive information&quot;
                as defined under the Privacy Act (e.g., health, racial/ethnic origin, political
                opinions, religious beliefs) unless strictly necessary and with your explicit
                consent.
              </p>
            </section>

            {/* 3. How We Collect */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">
                3. How we collect personal information
              </h2>
              <p className="text-mq-content-secondary leading-relaxed">We collect information:</p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>
                  <strong>Directly from you</strong> &mdash; when you sign up, update your profile,
                  create content, or adjust settings
                </li>
                <li>
                  <strong>Automatically</strong> &mdash; via session cookies, server logs, and error
                  monitoring
                </li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">
                In accordance with APP 5, we take reasonable steps to notify you at or before the
                point of collection (via in-product notices and this policy).
              </p>
            </section>

            {/* 4. Why We Collect and How We Use */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">
                4. Why we collect and how we use personal information
              </h2>
              <p className="text-mq-content-secondary leading-relaxed">
                We use personal information to:
              </p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>Provide and operate the Service (authentication, core features, data sync)</li>
                <li>Personalise your experience (preferences, saved settings, theme)</li>
                <li>
                  Maintain security (fraud prevention, abuse detection, rate limiting, incident
                  response)
                </li>
                <li>Improve performance and reliability (error tracking, diagnostics)</li>
                <li>Communicate with you (service messages, important security updates)</li>
                <li>Meet legal obligations and enforce our terms</li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">
                We only collect information that is <strong>reasonably necessary</strong> for our
                functions and activities.
              </p>
            </section>

            {/* 5. Disclosure */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">
                5. Disclosure of personal information
              </h2>
              <p className="text-mq-content-secondary leading-relaxed">
                We may disclose personal information to:
              </p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>
                  <strong>Service providers</strong> who assist in operating the Service (see
                  Section 6 for details)
                </li>
                <li>
                  <strong>Authorities</strong> if required by law, court order, or to prevent
                  serious threats to life, health, or safety
                </li>
                <li>
                  <strong>Business transfers</strong> (e.g., acquisition or merger), with
                  appropriate protections
                </li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">
                We do <strong>not</strong> sell personal information.
              </p>
            </section>

            {/* 6. Overseas Disclosure and Third-Party Services */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">
                6. Overseas disclosure and third-party services
              </h2>
              <p className="text-mq-content-secondary leading-relaxed">
                Some service providers may store or process data outside Australia. Where we
                disclose personal information overseas, we take reasonable steps to ensure it is
                handled consistently with the APPs (e.g., contractual controls, security standards).
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-mq-content-secondary border border-mq-border rounded-mq-md">
                  <thead>
                    <tr className="bg-mq-card-background">
                      <th className="text-left px-4 py-2 font-semibold text-mq-content border-b border-mq-border">
                        Service
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-mq-content border-b border-mq-border">
                        Purpose
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-mq-content border-b border-mq-border">
                        Data region
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-mq-border">
                      <td className="px-4 py-2">Supabase</td>
                      <td className="px-4 py-2">Authentication, database, file storage</td>
                      <td className="px-4 py-2">Configured per project (AU/US/EU)</td>
                    </tr>
                    <tr className="border-b border-mq-border">
                      <td className="px-4 py-2">Vercel</td>
                      <td className="px-4 py-2">Hosting and CDN</td>
                      <td className="px-4 py-2">Global edge (US primary)</td>
                    </tr>
                    <tr className="border-b border-mq-border">
                      <td className="px-4 py-2">Sentry</td>
                      <td className="px-4 py-2">Error monitoring and performance diagnostics</td>
                      <td className="px-4 py-2">US</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">OpenRouteService</td>
                      <td className="px-4 py-2">Navigation routing (server-side only)</td>
                      <td className="px-4 py-2">EU (Germany)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. Security */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">
                7. Security of personal information
              </h2>
              <p className="text-mq-content-secondary leading-relaxed">
                We take reasonable steps to protect personal information from misuse, interference
                and loss, and from unauthorised access, modification or disclosure. Our security
                measures include:
              </p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>Encryption in transit (TLS/HTTPS enforced via HSTS)</li>
                <li>Encryption at rest for database and file storage</li>
                <li>Secure password hashing (passwords are never stored in plain text)</li>
                <li>Multi-factor authentication options (TOTP, WebAuthn/passkeys)</li>
                <li>Role-based access controls and least-privilege service keys</li>
                <li>Rate limiting and brute-force protection on authentication endpoints</li>
                <li>Content Security Policy (CSP) with nonces to prevent XSS</li>
                <li>
                  Service worker security: API routes and authenticated pages are{' '}
                  <strong>never cached</strong>; all caches are cleared on logout
                </li>
                <li>Automated session expiry and secure cookie handling</li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">
                No method of electronic transmission or storage is 100% secure. While we strive to
                protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* 8. Data Retention */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">8. Data retention</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                We retain personal information only as long as necessary to:
              </p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>Provide the Service and maintain your account</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce our terms</li>
                <li>Maintain security and audit integrity</li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">
                When your data is no longer required, we take reasonable steps to delete or
                de-identify it. You may request account deletion at any time via your account
                settings or by contacting us.
              </p>
            </section>

            {/* 9. Cookies and Analytics */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">9. Cookies and analytics</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>Keep you signed in and maintain secure sessions</li>
                <li>Remember your preferences (theme, language, accessibility settings)</li>
                <li>
                  Monitor application errors and performance (via Sentry &mdash; with text masking
                  and media blocking enabled for privacy)
                </li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">
                We do <strong>not</strong> use third-party advertising cookies or behavioural
                tracking. You can control cookies via your browser settings.
              </p>
            </section>

            {/* 10. Access and Correction */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">10. Access and correction</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                Under APPs 12 and 13, you may request access to personal information we hold about
                you and request corrections if it is inaccurate, out-of-date, incomplete, irrelevant
                or misleading.
              </p>
              <p className="text-mq-content-secondary leading-relaxed">
                You can view and update most of your information directly in{' '}
                <Link href="/settings" className="text-mq-primary hover:underline">
                  Settings
                </Link>{' '}
                and{' '}
                <Link href="/manage-profiles" className="text-mq-primary hover:underline">
                  Manage Profiles
                </Link>
                . For other access or correction requests, contact us at{' '}
                <a
                  href={`mailto:${UNIVERSITY_CONFIG.supportEmail}`}
                  className="text-mq-primary hover:underline"
                >
                  {UNIVERSITY_CONFIG.supportEmail}
                </a>
                . We may need to verify your identity before fulfilling requests.
              </p>
            </section>

            {/* 11. Complaints */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">11. Complaints</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                If you believe we have breached the Australian Privacy Principles, you may lodge a
                complaint by emailing{' '}
                <a
                  href={`mailto:${UNIVERSITY_CONFIG.supportEmail}?subject=Privacy Complaint - ${APP_CONFIG.name}`}
                  className="text-mq-primary hover:underline"
                >
                  {UNIVERSITY_CONFIG.supportEmail}
                </a>{' '}
                with details of your concern.
              </p>
              <p className="text-mq-content-secondary leading-relaxed">
                We will acknowledge your complaint and respond within a reasonable timeframe
                (generally within 30 days). If you are not satisfied with our response, you may
                complain to the{' '}
                <a
                  href="https://www.oaic.gov.au/privacy/privacy-complaints"
                  className="text-mq-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Office of the Australian Information Commissioner (OAIC)
                </a>
                .
              </p>
            </section>

            {/* 12. Notifiable Data Breaches */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">
                12. Data breaches (Notifiable Data Breaches scheme)
              </h2>
              <p className="text-mq-content-secondary leading-relaxed">
                Where the <em>Privacy Act 1988</em> applies to us, if we experience an eligible data
                breach that is likely to result in serious harm, we will notify affected individuals
                and the OAIC as required under the{' '}
                <a
                  href="https://www.oaic.gov.au/privacy/notifiable-data-breaches/about-the-notifiable-data-breaches-scheme"
                  className="text-mq-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Notifiable Data Breaches (NDB) scheme
                </a>
                .
              </p>
            </section>

            {/* 13. Children and Education */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">13. Education context</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                {APP_CONFIG.name} is designed for university students at {UNIVERSITY_CONFIG.name}.
                We do not knowingly collect personal information from children under 16. If you
                believe a child has provided us with personal information, please contact us and we
                will take steps to delete it.
              </p>
            </section>

            {/* 14. Changes */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">14. Changes to this policy</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                We may update this policy from time to time. We will post the latest version within
                the Service and update the &quot;Last updated&quot; date above. Material changes
                will be communicated via in-app notification.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-3 border-t border-mq-border pt-6">
              <h2 className="text-xl font-semibold text-mq-content">Contact us</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                If you have questions about this Privacy Policy or our handling of personal
                information, contact us at:
              </p>
              <div className="bg-mq-card-background border border-mq-border rounded-mq-md p-4 space-y-1 text-sm text-mq-content-secondary">
                <p>
                  <strong className="text-mq-content">{APP_CONFIG.name}</strong>
                </p>
                <p>
                  Email:{' '}
                  <a
                    href={`mailto:${UNIVERSITY_CONFIG.supportEmail}`}
                    className="text-mq-primary hover:underline"
                  >
                    {UNIVERSITY_CONFIG.supportEmail}
                  </a>
                </p>
                <p>{UNIVERSITY_CONFIG.name}</p>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-mq-border pt-6 text-center text-xs text-mq-content-secondary">
              <p>
                &copy; {currentYear} {APP_CONFIG.name} &mdash; {UNIVERSITY_CONFIG.name}
              </p>
              <p className="mt-1">
                <Link href="/terms" className="text-mq-primary hover:underline">
                  Terms of Service
                </Link>
                {' | '}
                <Link href="/privacy" className="text-mq-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
