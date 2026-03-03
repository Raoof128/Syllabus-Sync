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
    role: 'First Developer',
    photo: '/images/team/pouya.jpg',
  },
  {
    name: 'Raouf',
    role: 'Second Developer',
    photo: '/images/team/raouf.jpg',
  },
] as const;

export default function AboutPage() {
  const { t } = useTypedTranslation();

  return (
    <div className="min-h-screen bg-mq-background">
      <section className="border-b border-mq-border bg-gradient-to-br from-[#002A45] via-[#113b5f] to-[#001a30]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:gap-10 lg:px-8 lg:py-14">
          <div className="flex-1 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              {UNIVERSITY_CONFIG.name}
            </p>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
              {t('aboutTitle')}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
              {APP_CONFIG.name} helps students organise assessments, schedules, and study priorities
              with clarity. We build practical tools that support real semester workflows.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/signup"
                className="rounded-mq-lg bg-white px-4 py-2 text-sm font-semibold text-[#002A45] transition hover:bg-white/90"
              >
                Get Started
              </Link>
              <a
                href={EXTERNAL_LINKS.documentation}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-mq-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Documentation
              </a>
            </div>
          </div>

          <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-white/20 lg:h-72 lg:w-[420px]">
            <Image
              src="/images/login-bg.png"
              alt="Students collaborating on campus"
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-mq-content sm:text-3xl">Our Values</h2>
        <p className="mt-2 max-w-3xl text-sm text-mq-content-secondary sm:text-base">
          The principles that guide how we design, build, and support student planning.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {VALUE_CARDS.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-mq-border bg-mq-card-background p-5 transition hover:-translate-y-0.5 hover:border-mq-primary/35 hover:shadow-mq"
            >
              <item.icon className="h-5 w-5 text-mq-primary" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-mq-content">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mq-content-secondary">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-mq-content sm:text-3xl">
          Built for Student Success
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-mq-content-secondary sm:text-base">
          Feature design focused on practical student productivity and day-to-day academic control.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {FEATURE_CARDS.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-mq-border bg-mq-card-background p-5 transition hover:-translate-y-0.5 hover:border-mq-primary/35 hover:shadow-mq"
            >
              <item.icon className="h-5 w-5 text-mq-primary" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold text-mq-content">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-mq-content-secondary">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-mq-content sm:text-3xl">Our Developers</h2>
        <p className="mt-2 max-w-3xl text-sm text-mq-content-secondary sm:text-base">
          Built by students for students.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          {DEVELOPERS.map((developer) => (
            <article
              key={developer.name}
              className="overflow-hidden rounded-xl border border-mq-border bg-mq-card-background"
            >
              <div className="relative h-[420px] w-full bg-mq-background-secondary">
                <Image
                  src={developer.photo}
                  alt={`${developer.name} portrait`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-mq-content">{developer.name}</h3>
                <p className="text-sm text-mq-content-secondary">{developer.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
