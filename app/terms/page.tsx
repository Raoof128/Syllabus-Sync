'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

const SECTION_TITLES = [
  'terms_s1_title',
  'terms_s2_title',
  'terms_s3_title',
  'terms_s4_title',
  'terms_s5_title',
  'terms_s6_title',
  'terms_s7_title',
  'terms_s8_title',
  'terms_s9_title',
  'terms_s10_title',
] as const;

export default function TermsPage() {
  const { t } = useTypedTranslation();

  return (
    <div className="min-h-screen bg-mq-background">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#8B1525] via-[#A6192E] to-[#76232f] border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 rounded-mq-lg border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:border-white/35 hover:bg-white/20 mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('terms_back_to', { appName: APP_CONFIG.name })}
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-[#FFB81C] font-semibold">
                {t('terms_legal_doc')}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                {t('terms_title')}
              </h1>
              <p className="text-sm text-white/50">{t('terms_last_updated')}</p>
            </div>
            <div className="hidden sm:flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/15">
              <Image src="/images/shield-icon.svg" alt="" width={28} height={28} aria-hidden="true" />
            </div>
          </div>

          {/* Accent bar */}
          <div className="mt-6 h-0.5 w-12 rounded-full bg-[#FFB81C]" />
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
          {/* Sticky sidebar TOC — desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-1">
              <p className="text-xs uppercase tracking-[0.15em] font-semibold text-mq-content-secondary mb-3">
                {t('terms_sections')}
              </p>
              {SECTION_TITLES.map((key, i) => (
                <a
                  key={i}
                  href={`#section-${i + 1}`}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm text-mq-content-secondary hover:text-mq-content hover:bg-mq-border/30 transition-colors group"
                >
                  <span className="text-xs font-bold text-mq-primary/60 group-hover:text-mq-primary w-5 flex-shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate">{t(key)}</span>
                </a>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <div className="space-y-8">
            {/* 1. Acceptance of Terms */}
            <section
              id="section-1"
              className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300"
            >
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  1
                </span>
                {t('terms_s1_title')}
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                {t('terms_s1_p1', { appName: APP_CONFIG.name })}
              </p>
            </section>

            {/* 2. Description of Service */}
            <section
              id="section-2"
              className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300"
            >
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  2
                </span>
                {t('terms_s2_title')}
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                {t('terms_s2_p1', {
                  appName: APP_CONFIG.name,
                  uniName: UNIVERSITY_CONFIG.name,
                })}
              </p>
            </section>

            {/* 3. User Accounts */}
            <section
              id="section-3"
              className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300"
            >
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  3
                </span>
                {t('terms_s3_title')}
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                {t('terms_s3_p1')}
              </p>
            </section>

            {/* 4. Acceptable Use */}
            <section
              id="section-4"
              className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300"
            >
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  4
                </span>
                {t('terms_s4_title')}
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                {t('terms_s4_p1')}
              </p>
              <ul className="space-y-2">
                {(
                  [
                    'terms_s4_li1',
                    'terms_s4_li2',
                    'terms_s4_li3',
                    'terms_s4_li4',
                    'terms_s4_li5',
                  ] as const
                ).map((key) => (
                  <li
                    key={key}
                    className="flex items-start gap-2 text-sm text-mq-content-secondary"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mq-primary/60" />
                    {t(key)}
                  </li>
                ))}
              </ul>
            </section>

            {/* 5. Intellectual Property */}
            <section
              id="section-5"
              className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300"
            >
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  5
                </span>
                {t('terms_s5_title')}
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                {t('terms_s5_p1', { appName: APP_CONFIG.name })}
              </p>
            </section>

            {/* 6. Privacy */}
            <section
              id="section-6"
              className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300"
            >
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  6
                </span>
                {t('terms_s6_title')}
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                {t('terms_s6_p1', { appName: APP_CONFIG.name })}
              </p>
            </section>

            {/* 7. Disclaimer of Warranties */}
            <section
              id="section-7"
              className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300"
            >
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  7
                </span>
                {t('terms_s7_title')}
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                {t('terms_s7_p1')}
              </p>
            </section>

            {/* 8. Limitation of Liability */}
            <section
              id="section-8"
              className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300"
            >
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  8
                </span>
                {t('terms_s8_title')}
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                {t('terms_s8_p1', {
                  appNameCaps: APP_CONFIG.name.toUpperCase(),
                })}
              </p>
            </section>

            {/* 9. Changes to Terms */}
            <section
              id="section-9"
              className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300"
            >
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  9
                </span>
                {t('terms_s9_title')}
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                {t('terms_s9_p1')}
              </p>
            </section>

            {/* 10. Contact */}
            <section
              id="section-10"
              className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300"
            >
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  10
                </span>
                {t('terms_s10_title')}
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                {t('terms_s10_p1')}{' '}
                <a
                  href={`mailto:${UNIVERSITY_CONFIG.supportEmail}`}
                  className="text-mq-primary hover:underline font-medium"
                >
                  {UNIVERSITY_CONFIG.supportEmail}
                </a>
              </p>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
