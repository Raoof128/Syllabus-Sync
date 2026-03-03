'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  CalendarCheck,
  BarChart3,
  Download,
  ArrowRight,
} from 'lucide-react';
import { APP_CONFIG, EXTERNAL_LINKS, UNIVERSITY_CONFIG } from '@/lib/config';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

const VALUE_CARDS = [
  {
    icon: Users,
    title: 'Built by students, for students',
    description:
      'We understand how hard it is to juggle classes, assignments, exams, and campus life in one term.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy-first by default',
    description:
      'Your academic planning data stays under your control, with transparent handling and no hidden tracking practices.',
  },
  {
    icon: Sparkles,
    title: 'Clear and transparent',
    description:
      'We use public university information and keep the product experience straightforward and easy to trust.',
  },
  {
    icon: Target,
    title: 'Focused on student outcomes',
    description:
      'Every feature is designed to reduce stress, improve planning, and help students stay ahead.',
  },
] as const;

const FEATURE_CARDS = [
  {
    icon: CalendarCheck,
    title: 'Plan and manage assessments',
    description: 'Capture deadlines, classes, and events in one structured workflow.',
  },
  {
    icon: BarChart3,
    title: 'Visualize study workload',
    description: 'Use calendar insights and widgets to see busy periods before they hit.',
  },
  {
    icon: Download,
    title: 'Keep control of your data',
    description: 'Export and manage your planning information with clear ownership.',
  },
] as const;

const DEVELOPERS = [
  {
    name: 'Pouya',
    role: 'Front-End & UI/UX Developer',
    photo: '/images/team/pouya.jpg',
  },
  {
    name: 'Raouf',
    role: 'Back-End & Cyber Security Developer',
    photo: '/images/team/raouf.jpg',
  },
] as const;

export default function AboutPage() {
  const { t } = useTypedTranslation();

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

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:flex-row lg:items-center lg:gap-14 lg:px-8 lg:py-20">
          <div className="flex-1 space-y-5">
            <p
              className="animate-fade-in text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFB81C]"
              style={{ animationFillMode: 'both' }}
            >
              {UNIVERSITY_CONFIG.name}
            </p>
            <h1
              className="animate-fade-in font-serif text-4xl font-bold leading-[1.15] text-white sm:text-5xl"
              style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
            >
              {t('aboutTitle')}
            </h1>
            <p
              className="animate-fade-in max-w-xl text-[15px] leading-relaxed text-white/75 sm:text-base"
              style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
            >
              {APP_CONFIG.name} helps students organise assessments, schedules, and study
              priorities with clarity. We build practical tools that support real semester
              workflows.
            </p>
            <div
              className="animate-fade-in flex flex-wrap items-center gap-3 pt-1"
              style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
            >
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-mq-lg bg-white px-5 py-2.5 text-sm font-semibold text-mq-primary shadow-lg shadow-black/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-xl hover:shadow-black/20"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <a
                href={EXTERNAL_LINKS.documentation}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-mq-lg border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Documentation
              </a>
            </div>
          </div>

          <div
            className="animate-fade-in relative h-60 w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/30 lg:h-80 lg:w-[440px]"
            style={{ animationDelay: '0.35s', animationFillMode: 'both' }}
          >
            <Image
              src="/images/login-bg.png"
              alt="Students collaborating on campus"
              fill
              sizes="(max-width: 1024px) 100vw, 440px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#76232f]/50 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex items-center gap-3">
          <span className="block h-px w-8 bg-mq-primary" aria-hidden="true" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mq-primary">
            What We Stand For
          </p>
        </div>
        <h2 className="mt-3 font-serif text-3xl font-bold text-mq-content sm:text-4xl">
          Our Values
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-mq-content-secondary">
          The principles that guide how we design, build, and support student planning.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {VALUE_CARDS.map((item, i) => (
            <article
              key={item.title}
              className="animate-fade-in group rounded-xl border border-mq-border bg-mq-card-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-mq-primary/25 hover:shadow-lg hover:shadow-mq-primary/5"
              style={{
                animationDelay: `${0.1 + i * 0.08}s`,
                animationFillMode: 'both',
              }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mq-primary/10 transition-colors duration-300 group-hover:bg-mq-primary/15">
                <item.icon
                  className="h-5 w-5 text-mq-primary"
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-4 text-base font-semibold text-mq-content">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mq-content-secondary">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-y border-mq-border/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex items-center gap-3">
            <span className="block h-px w-8 bg-mq-primary" aria-hidden="true" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mq-primary">
              What We Build
            </p>
          </div>
          <h2 className="mt-3 font-serif text-3xl font-bold text-mq-content sm:text-4xl">
            Built for Student Success
          </h2>
          <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-mq-content-secondary">
            Feature design focused on practical student productivity and day-to-day
            academic control.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {FEATURE_CARDS.map((item, i) => (
              <article
                key={item.title}
                className="animate-fade-in group rounded-xl border border-mq-border bg-mq-card-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-mq-primary/25 hover:shadow-lg hover:shadow-mq-primary/5"
                style={{
                  animationDelay: `${0.1 + i * 0.1}s`,
                  animationFillMode: 'both',
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-mq-primary/10 transition-colors duration-300 group-hover:bg-mq-primary/15">
                  <item.icon
                    className="h-5 w-5 text-mq-primary"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-4 text-base font-semibold text-mq-content">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-mq-content-secondary">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Developers ── */}
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex items-center gap-3">
          <span className="block h-px w-8 bg-mq-primary" aria-hidden="true" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-mq-primary">
            The Team
          </p>
        </div>
        <h2 className="mt-3 font-serif text-3xl font-bold text-mq-content sm:text-4xl">
          Our Developers
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-mq-content-secondary">
          Built with care by students who understand the challenge.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {DEVELOPERS.map((dev, i) => (
            <article
              key={dev.name}
              className="animate-fade-in group relative overflow-hidden rounded-2xl border border-mq-border transition-all duration-500 hover:border-mq-primary/25 hover:shadow-xl hover:shadow-mq-primary/5"
              style={{
                animationDelay: `${0.15 + i * 0.15}s`,
                animationFillMode: 'both',
              }}
            >
              <div className="relative h-[400px] w-full overflow-hidden sm:h-[440px]">
                <Image
                  src={dev.photo}
                  alt={`${dev.name} — ${dev.role}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-2xl font-bold tracking-tight text-white">
                    {dev.name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-white/75">
                    {dev.role}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
