'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Mail, MessageSquare, FileText, ShieldCheck } from 'lucide-react';
import { APP_CONFIG, EXTERNAL_LINKS, UNIVERSITY_CONFIG } from '@/lib/config';

export default function ContactPage() {
  const [contactEmail, setContactEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedFeedback = feedback.trim();
    if (trimmedFeedback.length < 10) {
      setError('Please add a bit more detail so we can help properly.');
      return;
    }

    setError('');
    const subject = encodeURIComponent(`${APP_CONFIG.name} Contact & Feedback`);
    const body = encodeURIComponent(
      `Contact email: ${contactEmail.trim() || 'Not provided'}\n\nFeedback:\n${trimmedFeedback}`,
    );
    window.location.href = `mailto:${UNIVERSITY_CONFIG.supportEmail}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-mq-background">
      <section className="border-b border-mq-border bg-gradient-to-br from-[#002A45] via-[#113b5f] to-[#001a30]">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            Support and Feedback
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-4xl">
            Contact {APP_CONFIG.name}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/85 sm:text-base">
            Found a bug or have a suggestion? Share your feedback. It helps us improve the
            experience for everyone.
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-10">
        <article className="rounded-xl border border-mq-border bg-mq-card-background p-5 lg:col-span-1">
          <h2 className="text-lg font-semibold text-mq-content">Support Channels</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-lg border border-mq-border p-3">
              <p className="flex items-center gap-2 font-medium text-mq-content">
                <Mail className="h-4 w-4 text-mq-primary" aria-hidden="true" />
                Email
              </p>
              <a
                href={`mailto:${UNIVERSITY_CONFIG.supportEmail}`}
                className="mt-1 inline-block text-mq-content-secondary hover:text-mq-primary hover:underline"
              >
                {UNIVERSITY_CONFIG.supportEmail}
              </a>
            </div>

            <div className="rounded-lg border border-mq-border p-3">
              <p className="flex items-center gap-2 font-medium text-mq-content">
                <FileText className="h-4 w-4 text-mq-primary" aria-hidden="true" />
                Helpful Links
              </p>
              <div className="mt-1 flex flex-col gap-1">
                <a
                  href={EXTERNAL_LINKS.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mq-content-secondary hover:text-mq-primary hover:underline"
                >
                  Documentation
                </a>
                <Link
                  href="/about"
                  className="text-mq-content-secondary hover:text-mq-primary hover:underline"
                >
                  About
                </Link>
                <Link
                  href="/privacy"
                  className="text-mq-content-secondary hover:text-mq-primary hover:underline"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-mq-border p-3">
              <p className="flex items-center gap-2 font-medium text-mq-content">
                <ShieldCheck className="h-4 w-4 text-mq-primary" aria-hidden="true" />
                Privacy Notice
              </p>
              <p className="mt-1 text-mq-content-secondary">
                We only use your contact details to respond to your feedback.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-mq-border bg-mq-card-background p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-mq-content">Contact & Feedback</h2>
          <p className="mt-1 text-sm text-mq-content-secondary">
            Tell us what happened and what you would like improved.
          </p>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium text-mq-content">
                Contact email (optional)
              </label>
              <p className="mt-1 text-xs text-mq-content-secondary">
                We only use this if we need to follow up on your feedback.
              </p>
              <input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="you@mq.edu.au"
                className="mt-2 w-full rounded-mq-lg border border-mq-border bg-mq-card-background px-3 py-2 text-sm text-mq-content shadow-sm outline-none transition focus:border-mq-primary focus:ring-2 focus:ring-mq-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="contact-feedback"
                className="block text-sm font-medium text-mq-content"
              >
                Your feedback
              </label>
              <textarea
                id="contact-feedback"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Share details, steps, and what you expected."
                rows={8}
                className="mt-2 w-full rounded-mq-lg border border-mq-border bg-mq-card-background px-3 py-2 text-sm text-mq-content shadow-sm outline-none transition focus:border-mq-primary focus:ring-2 focus:ring-mq-primary/20"
                required
              />
            </div>

            {error && <p className="text-sm text-mq-danger">{error}</p>}
            {submitted && (
              <p className="text-sm text-mq-success">
                Your email draft has been opened. Review and send it when ready.
              </p>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-mq-lg bg-mq-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-mq-primary/90"
            >
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Send feedback
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
