'use client';

import Link from 'next/link';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import { useTypedTranslation } from '@/lib/hooks/useTypedTranslation';

export default function PrivacyPolicyPage() {
  const { t } = useTypedTranslation();
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
              &larr; {t('privacy_back_to', { appName: APP_CONFIG.name })}
            </Link>
            <h1 className="text-3xl font-bold text-mq-content">{t('privacy_title')}</h1>
            <p className="text-sm text-mq-content-secondary">{t('privacy_last_updated')}</p>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none text-mq-content space-y-6">
            {/* 1. Purpose and Scope */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s1_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                {t('privacy_s1_p1', { appName: APP_CONFIG.name })}
              </p>
              <p className="text-mq-content-secondary leading-relaxed">
                {t('privacy_s1_p2', { appName: APP_CONFIG.name, uniName: UNIVERSITY_CONFIG.name })}
              </p>
            </section>

            {/* 2. What Personal Information We Collect */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s2_title')}</h2>

              <h3 className="text-base font-semibold text-mq-content">{t('privacy_s2_a_title')}</h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s2_a_li1')}</li>
                <li>{t('privacy_s2_a_li2')}</li>
                <li>{t('privacy_s2_a_li3')}</li>
                <li>{t('privacy_s2_a_li4')}</li>
                <li>{t('privacy_s2_a_li5')}</li>
                <li>{t('privacy_s2_a_li6')}</li>
              </ul>

              <h3 className="text-base font-semibold text-mq-content">{t('privacy_s2_b_title')}</h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s2_b_li1')}</li>
                <li>{t('privacy_s2_b_li2')}</li>
              </ul>

              <h3 className="text-base font-semibold text-mq-content">{t('privacy_s2_c_title')}</h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s2_c_li1')}</li>
                <li>{t('privacy_s2_c_li2')}</li>
                <li>{t('privacy_s2_c_li3')}</li>
                <li>{t('privacy_s2_c_li4')}</li>
              </ul>

              <h3 className="text-base font-semibold text-mq-content">{t('privacy_s2_d_title')}</h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s2_d_li1')}</li>
                <li>{t('privacy_s2_d_li2')}</li>
              </ul>

              <h3 className="text-base font-semibold text-mq-content">{t('privacy_s2_e_title')}</h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s2_e_li1')}</li>
                <li>{t('privacy_s2_e_li2')}</li>
                <li>{t('privacy_s2_e_li3')}</li>
              </ul>

              <h3 className="text-base font-semibold text-mq-content">{t('privacy_s2_f_title')}</h3>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s2_f_li1')}</li>
                <li>{t('privacy_s2_f_li2')}</li>
                <li>{t('privacy_s2_f_li3')}</li>
              </ul>

              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s2_footer')}</p>
            </section>

            {/* 3. How We Collect */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s3_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s3_p1')}</p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s3_li1')}</li>
                <li>{t('privacy_s3_li2')}</li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s3_footer')}</p>
            </section>

            {/* 4. Why We Collect and How We Use */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s4_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s4_p1')}</p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s4_li1')}</li>
                <li>{t('privacy_s4_li2')}</li>
                <li>{t('privacy_s4_li3')}</li>
                <li>{t('privacy_s4_li4')}</li>
                <li>{t('privacy_s4_li5')}</li>
                <li>{t('privacy_s4_li6')}</li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s4_footer')}</p>
            </section>

            {/* 5. Disclosure */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s5_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s5_p1')}</p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s5_li1')}</li>
                <li>{t('privacy_s5_li2')}</li>
                <li>{t('privacy_s5_li3')}</li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s5_footer')}</p>
            </section>

            {/* 6. Overseas Disclosure and Third-Party Services */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s6_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s6_p1')}</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-mq-content-secondary border border-mq-border rounded-mq-md">
                  <thead>
                    <tr className="bg-mq-card-background">
                      <th className="text-left px-4 py-2 font-semibold text-mq-content border-b border-mq-border">
                        {t('privacy_s6_table_h1')}
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-mq-content border-b border-mq-border">
                        {t('privacy_s6_table_h2')}
                      </th>
                      <th className="text-left px-4 py-2 font-semibold text-mq-content border-b border-mq-border">
                        {t('privacy_s6_table_h3')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-mq-border">
                      <td className="px-4 py-2">{t('privacy_s6_table_r1_c1')}</td>
                      <td className="px-4 py-2">{t('privacy_s6_table_r1_c2')}</td>
                      <td className="px-4 py-2">{t('privacy_s6_table_r1_c3')}</td>
                    </tr>
                    <tr className="border-b border-mq-border">
                      <td className="px-4 py-2">{t('privacy_s6_table_r2_c1')}</td>
                      <td className="px-4 py-2">{t('privacy_s6_table_r2_c2')}</td>
                      <td className="px-4 py-2">{t('privacy_s6_table_r2_c3')}</td>
                    </tr>
                    <tr className="border-b border-mq-border">
                      <td className="px-4 py-2">{t('privacy_s6_table_r3_c1')}</td>
                      <td className="px-4 py-2">{t('privacy_s6_table_r3_c2')}</td>
                      <td className="px-4 py-2">{t('privacy_s6_table_r3_c3')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">{t('privacy_s6_table_r4_c1')}</td>
                      <td className="px-4 py-2">{t('privacy_s6_table_r4_c2')}</td>
                      <td className="px-4 py-2">{t('privacy_s6_table_r4_c3')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 7. Security */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s7_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s7_p1')}</p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s7_li1')}</li>
                <li>{t('privacy_s7_li2')}</li>
                <li>{t('privacy_s7_li3')}</li>
                <li>{t('privacy_s7_li4')}</li>
                <li>{t('privacy_s7_li5')}</li>
                <li>{t('privacy_s7_li6')}</li>
                <li>{t('privacy_s7_li7')}</li>
                <li>{t('privacy_s7_li8')}</li>
                <li>{t('privacy_s7_li9')}</li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s7_footer')}</p>
            </section>

            {/* 8. Data Retention */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s8_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s8_p1')}</p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s8_li1')}</li>
                <li>{t('privacy_s8_li2')}</li>
                <li>{t('privacy_s8_li3')}</li>
                <li>{t('privacy_s8_li4')}</li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s8_footer')}</p>
            </section>

            {/* 9. Cookies and Analytics */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s9_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s9_p1')}</p>
              <ul className="list-disc pl-6 text-mq-content-secondary space-y-1">
                <li>{t('privacy_s9_li1')}</li>
                <li>{t('privacy_s9_li2')}</li>
                <li>{t('privacy_s9_li3')}</li>
              </ul>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s9_footer')}</p>
            </section>

            {/* 10. Access and Correction */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s10_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s10_p1')}</p>
              <p className="text-mq-content-secondary leading-relaxed">
                {t('privacy_s10_p2_part1')}{' '}
                <Link href="/settings" className="text-mq-primary hover:underline">
                  {t('settings')}
                </Link>{' '}
                {t('privacy_s10_p2_part2')}{' '}
                <Link href="/manage-profiles" className="text-mq-primary hover:underline">
                  {t('manageProfiles')}
                </Link>
                {t('privacy_s10_p2_part3')}{' '}
                <a
                  href={`mailto:${UNIVERSITY_CONFIG.supportEmail}`}
                  className="text-mq-primary hover:underline"
                >
                  {UNIVERSITY_CONFIG.supportEmail}
                </a>
                {t('privacy_s10_p2_part4')}
              </p>
            </section>

            {/* 11. Complaints */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s11_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                {t('privacy_s11_p1_part1')}{' '}
                <a
                  href={`mailto:${UNIVERSITY_CONFIG.supportEmail}?subject=Privacy Complaint - ${APP_CONFIG.name}`}
                  className="text-mq-primary hover:underline"
                >
                  {UNIVERSITY_CONFIG.supportEmail}
                </a>{' '}
                {t('privacy_s11_p1_part2')}
              </p>
              <p className="text-mq-content-secondary leading-relaxed">
                {t('privacy_s11_p2_part1')}{' '}
                <a
                  href="https://www.oaic.gov.au/privacy/privacy-complaints"
                  className="text-mq-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('privacy_s11_p2_link')}
                </a>
                .
              </p>
            </section>

            {/* 12. Notifiable Data Breaches */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s12_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                {t('privacy_s12_p1_part1')}{' '}
                <a
                  href="https://www.oaic.gov.au/privacy/notifiable-data-breaches/about-the-notifiable-data-breaches-scheme"
                  className="text-mq-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('privacy_s12_p1_link')}
                </a>
                .
              </p>
            </section>

            {/* 13. Children and Education */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s13_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">
                {t('privacy_s13_p1', { appName: APP_CONFIG.name, uniName: UNIVERSITY_CONFIG.name })}
              </p>
            </section>

            {/* 14. Changes */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-mq-content">{t('privacy_s14_title')}</h2>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_s14_p1')}</p>
            </section>

            {/* Contact */}
            <section className="space-y-3 border-t border-mq-border pt-6">
              <h2 className="text-xl font-semibold text-mq-content">
                {t('privacy_contact_title')}
              </h2>
              <p className="text-mq-content-secondary leading-relaxed">{t('privacy_contact_p1')}</p>
              <div className="bg-mq-card-background border border-mq-border rounded-mq-md p-4 space-y-1 text-sm text-mq-content-secondary">
                <p>
                  <strong className="text-mq-content">{APP_CONFIG.name}</strong>
                </p>
                <p>
                  {t('privacy_contact_email', { supportEmail: UNIVERSITY_CONFIG.supportEmail })}
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
                  {t('termsOfService')}
                </Link>
                {' | '}
                <Link href="/privacy" className="text-mq-primary hover:underline font-medium">
                  {t('privacyPolicy')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
