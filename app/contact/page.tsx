'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  FileText,
  ShieldCheck,
  ArrowRight,
  Send,
} from 'lucide-react';
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
      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-mq-border bg-gradient-to-br from-[#8B1525] via-[#A6192E] to-[#76232f]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-[#FFB81C]/10 blur-[80px]" />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <p
            className="animate-fade-in text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFB81C]"
            style={{ animationFillMode: 'both' }}
          >
            Support &amp; Feedback
          </p>
          <h1
            className="animate-fade-in mt-3 font-serif text-4xl font-bold leading-[1.15] text-white sm:text-5xl"
            style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
          >
            Contact {APP_CONFIG.name}
          </h1>
          <p
            className="animate-fade-in mt-4 max-w-2xl text-[15px] leading-relaxed text-white/75 sm:text-base"
            style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
          >
            Found a bug or have a suggestion? Share your feedback — it helps us improve the
            experience for everyone.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8 lg:py-20">
        {/* ── Sidebar ── */}
        <div
          className="animate-fade-in space-y-5 lg:col-span-1"
          style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          <div>
            <div className="flex items-center gap-3">
              <span className="block h-px w-8 bg-mq-primary" aria-hidden="true" />
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mq-primary">
                Reach Out
              </p>
            </div>
            <h2 className="mt-3 font-serif text-2xl font-bold text-mq-content">
              Support Channels
            </h2>
          </div>

          <article className="group rounded-xl border border-mq-border bg-mq-card-background p-5 transition-all duration-300 hover:border-mq-primary/25 hover:shadow-lg hover:shadow-mq-primary/5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mq-primary/10 transition-colors duration-300 group-hover:bg-mq-primary/15">
                <Mail className="h-4 w-4 text-mq-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-mq-content">Email</p>
                <a
                  href={`mailto:${UNIVERSITY_CONFIG.supportEmail}`}
                  className="mt-0.5 inline-block text-sm text-mq-content-secondary transition-colors hover:text-mq-primary"
                >
                  {UNIVERSITY_CONFIG.supportEmail}
                </a>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-mq-border bg-mq-card-background p-5 transition-all duration-300 hover:border-mq-primary/25 hover:shadow-lg hover:shadow-mq-primary/5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mq-primary/10">
                <FileText className="h-4 w-4 text-mq-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-mq-content">Helpful Links</p>
                <div className="mt-1.5 flex flex-col gap-1.5">
                  <a
                    href={EXTERNAL_LINKS.documentation}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-mq-content-secondary transition-colors hover:text-mq-primary"
                  >
                    Documentation
                    <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </a>
                  <Link
                    href="/about"
                    className="text-sm text-mq-content-secondary transition-colors hover:text-mq-primary"
                  >
                    About
                  </Link>
                  <Link
                    href="/privacy"
                    className="text-sm text-mq-content-secondary transition-colors hover:text-mq-primary"
                  >
                    Privacy Policy
                  </Link>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-mq-border bg-mq-card-background p-5 transition-all duration-300 hover:border-mq-primary/25 hover:shadow-lg hover:shadow-mq-primary/5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mq-primary/10">
                <ShieldCheck className="h-4 w-4 text-mq-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-mq-content">Privacy Notice</p>
                <p className="mt-0.5 text-sm leading-relaxed text-mq-content-secondary">
                  We only use your contact details to respond to your feedback.
                </p>
              </div>
            </div>
          </article>
        </div>

        {/* ── Form ── */}
        <article
          className="animate-fade-in rounded-2xl border border-mq-border bg-mq-card-background p-6 sm:p-8 lg:col-span-2"
          style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          <div className="flex items-center gap-3">
            <span className="block h-px w-8 bg-mq-primary" aria-hidden="true" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mq-primary">
              Get In Touch
            </p>
          </div>
          <h2 className="mt-3 font-serif text-2xl font-bold text-mq-content">
            Contact &amp; Feedback
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-mq-content-secondary">
            Tell us what happened and what you would like improved.
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="contact-email"
                className="block text-sm font-semibold text-mq-content"
              >
                Contact email
                <span className="ml-1.5 text-xs font-normal text-mq-content-secondary">
                  (optional)
                </span>
              </label>
              <p className="mt-1 text-xs leading-relaxed text-mq-content-secondary">
                We only use this if we need to follow up on your feedback.
              </p>
              <input
                id="contact-email"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="you@mq.edu.au"
                className="mt-2.5 w-full rounded-mq-lg border border-mq-border bg-mq-input-background px-4 py-2.5 text-sm text-mq-content shadow-sm outline-none transition-all duration-200 placeholder:text-mq-content-secondary/50 focus:border-mq-primary focus:ring-2 focus:ring-mq-primary/20"
              />
            </div>

            <div>
              <label
                htmlFor="contact-feedback"
                className="block text-sm font-semibold text-mq-content"
              >
                Your feedback
              </label>
              <textarea
                id="contact-feedback"
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Share details, steps, and what you expected."
                rows={7}
                className="mt-2.5 w-full rounded-mq-lg border border-mq-border bg-mq-input-background px-4 py-3 text-sm text-mq-content shadow-sm outline-none transition-all duration-200 placeholder:text-mq-content-secondary/50 focus:border-mq-primary focus:ring-2 focus:ring-mq-primary/20"
                required
              />
            </div>

            {error && (
              <p className="animate-fade-in text-sm font-medium text-mq-danger">{error}</p>
            )}
            {submitted && (
              <p className="animate-fade-in text-sm font-medium text-mq-success">
                Your email draft has been opened. Review and send it when ready.
              </p>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2.5 rounded-mq-lg bg-mq-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-mq-primary/90 hover:shadow-md"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Send feedback
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}
