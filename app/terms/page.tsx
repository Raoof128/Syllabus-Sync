'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield } from 'lucide-react';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';

const SECTIONS = [
  'Acceptance of Terms',
  'Description of Service',
  'User Accounts',
  'Acceptable Use',
  'Intellectual Property',
  'Privacy',
  'Disclaimer of Warranties',
  'Limitation of Liability',
  'Changes to Terms',
  'Contact Us',
];

export default function TermsPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-mq-background">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#002A45] to-[#001a30] border-b border-white/10">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {APP_CONFIG.name}
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-mq-primary font-semibold">
                Legal Document
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                Terms of Service
              </h1>
              <p className="text-sm text-white/50">Last updated: February 2026</p>
            </div>
            <div className="hidden sm:flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/15">
              <Shield className="h-6 w-6 text-mq-primary" />
            </div>
          </div>

          {/* Red accent bar */}
          <div className="mt-6 h-0.5 w-12 rounded-full bg-mq-primary" />
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">

          {/* Sticky sidebar TOC — desktop only */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 space-y-1">
              <p className="text-xs uppercase tracking-[0.15em] font-semibold text-mq-content-secondary mb-3">
                Sections
              </p>
              {SECTIONS.map((title, i) => (
                <a
                  key={i}
                  href={`#section-${i + 1}`}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg text-sm text-mq-content-secondary hover:text-mq-content hover:bg-mq-border/30 transition-colors group"
                >
                  <span className="text-xs font-bold text-mq-primary/60 group-hover:text-mq-primary w-5 flex-shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate">{title}</span>
                </a>
              ))}
            </div>
          </aside>

          {/* Main content */}
          <div className="space-y-8">
            {/* 1. Acceptance of Terms */}
            <section id="section-1" className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300">
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  1
                </span>
                Acceptance of Terms
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                By accessing or using {APP_CONFIG.name}, you agree to be bound by these Terms of
                Service. If you do not agree to these terms, please do not use the application.
              </p>
            </section>

            {/* 2. Description of Service */}
            <section id="section-2" className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300">
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  2
                </span>
                Description of Service
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                {APP_CONFIG.name} is a student productivity application designed to help{' '}
                {UNIVERSITY_CONFIG.name} students manage their academic schedules, deadlines, and
                campus activities. The service is provided &ldquo;as is&rdquo; and we reserve the
                right to modify or discontinue features at any time.
              </p>
            </section>

            {/* 3. User Accounts */}
            <section id="section-3" className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300">
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  3
                </span>
                User Accounts
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activities that occur under your account. You agree to notify us
                immediately of any unauthorized use of your account.
              </p>
            </section>

            {/* 4. Acceptable Use */}
            <section id="section-4" className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300">
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  4
                </span>
                Acceptable Use
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">You agree not to:</p>
              <ul className="space-y-2">
                {[
                  'Use the service for any unlawful purpose',
                  'Attempt to gain unauthorized access to any part of the service',
                  'Interfere with or disrupt the service or servers',
                  'Share your account credentials with others',
                  'Upload malicious content or code',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-mq-content-secondary">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mq-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* 5. Intellectual Property */}
            <section id="section-5" className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300">
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  5
                </span>
                Intellectual Property
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                The service and its original content, features, and functionality are owned by{' '}
                {APP_CONFIG.name} and are protected by international copyright, trademark, and other
                intellectual property laws.
              </p>
            </section>

            {/* 6. Privacy */}
            <section id="section-6" className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300">
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  6
                </span>
                Privacy
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                Your use of {APP_CONFIG.name} is also governed by our{' '}
                <Link href="/privacy" className="text-mq-primary hover:underline font-medium">
                  Privacy Policy
                </Link>
                . Please review our Privacy Policy to understand how we collect, use, and protect
                your information.
              </p>
            </section>

            {/* 7. Disclaimer of Warranties */}
            <section id="section-7" className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300">
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  7
                </span>
                Disclaimer of Warranties
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER
                EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE,
                OR ERROR-FREE.
              </p>
            </section>

            {/* 8. Limitation of Liability */}
            <section id="section-8" className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300">
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  8
                </span>
                Limitation of Liability
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                IN NO EVENT SHALL {APP_CONFIG.name.toUpperCase()} BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO
                YOUR USE OF THE SERVICE.
              </p>
            </section>

            {/* 9. Changes to Terms */}
            <section id="section-9" className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300">
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  9
                </span>
                Changes to Terms
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any
                material changes by posting the new terms on this page. Your continued use of the
                service after such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            {/* 10. Contact */}
            <section id="section-10" className="group space-y-3 border-l-2 border-mq-border/40 hover:border-mq-primary/50 pl-5 transition-colors duration-300">
              <h2 className="text-lg font-bold text-mq-content flex items-center gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-mq-primary/10 text-mq-primary flex items-center justify-center text-xs font-bold border border-mq-primary/20">
                  10
                </span>
                Contact Us
              </h2>
              <p className="text-sm text-mq-content-secondary leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a
                  href="mailto:support@syllabussync.app"
                  className="text-mq-primary hover:underline font-medium"
                >
                  support@syllabussync.app
                </a>
              </p>
            </section>

            {/* Footer */}
            <div className="pt-6 border-t border-mq-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Image
                  src="/MQ_Logo_Final.png"
                  alt="Macquarie University"
                  width={32}
                  height={32}
                  className="object-contain opacity-70"
                />
                <p className="text-xs text-mq-content-secondary">
                  &copy; {currentYear} {APP_CONFIG.name}. All rights reserved.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-mq-content-secondary">
                <Link href="/terms" className="text-mq-primary font-medium">
                  Terms
                </Link>
                <span className="text-mq-border">·</span>
                <Link href="/privacy" className="hover:text-mq-primary transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
