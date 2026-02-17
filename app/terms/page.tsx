'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';

export default function TermsPage() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-mq-background">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <button
              onClick={() => router.back()}
              className="text-sm text-mq-primary hover:underline inline-flex items-center gap-1"
            >
              &larr; Back to {APP_CONFIG.name}
            </button>
            <h1 className="text-3xl font-bold text-mq-content">Terms of Service</h1>
            <p className="text-sm text-mq-content-secondary">Last updated: February 2026</p>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none text-mq-content space-y-6">
            {/* 1. Acceptance of Terms */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">1. Acceptance of Terms</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                By accessing or using {APP_CONFIG.name}, you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use the application.
              </p>
            </section>

            {/* 2. Description of Service */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">2. Description of Service</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                {APP_CONFIG.name} is a student productivity application designed to help {UNIVERSITY_CONFIG.name} students
                manage their academic schedules, deadlines, and campus activities. The service is provided
                &ldquo;as is&rdquo; and we reserve the right to modify or discontinue features at any time.
              </p>
            </section>

            {/* 3. User Accounts */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">3. User Accounts</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for
                all activities that occur under your account. You agree to notify us immediately of any
                unauthorized use of your account.
              </p>
            </section>

            {/* 4. Acceptable Use */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">4. Acceptable Use</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                You agree not to:
              </p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>Use the service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to any part of the service</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Share your account credentials with others</li>
                <li>Upload malicious content or code</li>
              </ul>
            </section>

            {/* 5. Intellectual Property */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">5. Intellectual Property</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                The service and its original content, features, and functionality are owned by {APP_CONFIG.name}
                and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            {/* 6. Privacy */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">6. Privacy</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                Your use of {APP_CONFIG.name} is also governed by our{' '}
                <Link href="/privacy" className="text-mq-primary hover:underline">
                  Privacy Policy
                </Link>
                . Please review our Privacy Policy to understand how we collect, use, and protect your information.
              </p>
            </section>

            {/* 7. Disclaimer of Warranties */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">7. Disclaimer of Warranties</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
              </p>
            </section>

            {/* 8. Limitation of Liability */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">8. Limitation of Liability</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                IN NO EVENT SHALL {APP_CONFIG.name.toUpperCase()} BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
              </p>
            </section>

            {/* 9. Changes to Terms */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">9. Changes to Terms</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material
                changes by posting the new terms on this page. Your continued use of the service after such
                modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            {/* 10. Contact */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">10. Contact Us</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at{' '}
                <a href="mailto:support@syllabussync.app" className="text-mq-primary hover:underline">
                  support@syllabussync.app
                </a>
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="border-t border-mq-border pt-6">
            <p className="text-xs text-mq-content-secondary text-center">
              &copy; {currentYear} {APP_CONFIG.name}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

