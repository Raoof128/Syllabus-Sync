'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/mq/button';
import { MQLink } from '@/components/ui/mq/link';
import { Badge } from '@/components/ui/mq/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/mq/card';
import { Input } from '@/components/ui/mq/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/mq/alert';
import { Navbar } from '@/components/ui/mq/navbar';
import { Hero } from '@/components/ui/mq/hero';
import { SectionHeading } from '@/components/ui/mq/section-heading';
import { hoverLift, fadeIn } from '@/components/ui/mq/animations';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function MQStyleGuidePage() {
  const { t } = useTranslation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      const html = document.documentElement;
      if (isDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-mq-background text-mq-content">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsDark(!isDark)}
          className="shadow-mq"
        >
          {isDark ? `☀️ ${t('light')}` : `🌙 ${t('dark')}`}
        </Button>
      </div>

      {/* Navbar Demo */}
      <Navbar
        title={t('welcomeToUni', { uniName: 'Macquarie University' })}
        onAction={() => {}}
        actionLabel={t('applyNow')}
      />

      {/* Hero Demo */}
      <Hero
        title={t('welcomeToUni', { uniName: 'Macquarie University' })}
        subtitle={t('uniDesc')}
        primaryAction={{
          label: t('explorePrograms'),
          onClick: () => {},
        }}
        secondaryAction={{
          label: t('learnMore'),
          href: '#learn-more',
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="mb-12 text-center">
          <SectionHeading level="h1" className="mb-4">
            {t('mqDesignSystem')}
          </SectionHeading>
          <p className="text-mq-xl text-mq-content-secondary max-w-2xl mx-auto">
            {t('mqDesignSystemDesc')}
          </p>
        </div>

        <div className="space-y-16">
          {/* Buttons */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              {t('buttons')}
            </SectionHeading>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>{t('primaryButton')}</CardTitle>
                  <CardDescription>{t('primaryButtonDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="primary">{t('primaryAction')}</Button>
                </CardContent>
              </Card>

              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>{t('secondaryButton')}</CardTitle>
                  <CardDescription>{t('secondaryButtonDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary">{t('secondaryAction')}</Button>
                </CardContent>
              </Card>

              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>{t('ghostButton')}</CardTitle>
                  <CardDescription>{t('ghostButtonDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost">{t('ghostAction')}</Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Links */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              {t('links')}
            </SectionHeading>
            <Card className={fadeIn}>
              <CardHeader>
                <CardTitle>{t('linkVariants')}</CardTitle>
                <CardDescription>{t('linkVariantsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <MQLink href="#default">{t('defaultLink')}</MQLink>
                </div>
                <div>
                  <MQLink href="#subtle" variant="subtle">{t('subtleLink')}</MQLink>
                </div>
                <div>
                  <MQLink href="https://mq.edu.au" external>
                    {t('externalLink')}
                  </MQLink>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Badges */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              {t('badges')}
            </SectionHeading>
            <Card className={fadeIn}>
              <CardHeader>
                <CardTitle>{t('badgeVariants')}</CardTitle>
                <CardDescription>{t('badgeVariantsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="neutral">{t('neutral')}</Badge>
                  <Badge variant="brand">{t('brand')}</Badge>
                  <Badge variant="secondary">{t('secondary')}</Badge>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Cards */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              {t('cards')}
            </SectionHeading>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className={cn(fadeIn, hoverLift)}>
                <CardHeader>
                  <CardTitle>{t('cardTitle')}</CardTitle>
                  <CardDescription>{t('cardDescPlaceholder')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('cardContentPlaceholder')}
                  </p>
                </CardContent>
              </Card>

              <Card className={cn(fadeIn, hoverLift)}>
                <CardHeader>
                  <CardTitle>{t('anotherCard')}</CardTitle>
                  <CardDescription>{t('anotherCardDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="brand">{t('featured')}</Badge>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t('cardDemoDesc')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Input */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              {t('input')}
            </SectionHeading>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>{t('textInput')}</CardTitle>
                  <CardDescription>{t('textInputDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input label={t('fullName')} placeholder={t('enterFullName')} />
                </CardContent>
              </Card>

              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>{t('inputError')}</CardTitle>
                  <CardDescription>{t('inputErrorDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    label={t('emailAddress')}
                    type="email"
                    placeholder={t('enterEmail')}
                    error={t('validEmailError')}
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Alerts */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              {t('alerts')}
            </SectionHeading>
            <div className="space-y-4">
              <Alert variant="info" className={fadeIn}>
                <AlertTitle>{t('information')}</AlertTitle>
                <AlertDescription>
                  {t('infoAlertDesc')}
                </AlertDescription>
              </Alert>

              <Alert variant="warning" className={fadeIn}>
                <AlertTitle>{t('warning')}</AlertTitle>
                <AlertDescription>
                  {t('warningAlertDesc')}
                </AlertDescription>
              </Alert>

              <Alert variant="success" className={fadeIn}>
                <AlertTitle>{t('success')}</AlertTitle>
                <AlertDescription>
                  {t('successAlertDesc')}
                </AlertDescription>
              </Alert>

              <Alert variant="error" className={fadeIn}>
                <AlertTitle>{t('error')}</AlertTitle>
                <AlertDescription>
                  {t('errorAlertDesc')}
                </AlertDescription>
              </Alert>
            </div>
          </section>

          {/* Animations */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              {t('animations')}
            </SectionHeading>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className={hoverLift}>
                <CardHeader>
                  <CardTitle>{t('hoverLift')}</CardTitle>
                  <CardDescription>{t('hoverLiftDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('hoverLiftContent')}
                  </p>
                </CardContent>
              </Card>

              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>{t('fadeIn')}</CardTitle>
                  <CardDescription>{t('fadeInDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-mq-sm text-mq-content-secondary">
                    {t('fadeInContent')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}