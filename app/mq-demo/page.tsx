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

export default function MQStyleGuidePage() {
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
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </Button>
      </div>

      {/* Navbar Demo */}
      <Navbar
        title="Macquarie University"
        onAction={() => {}}
        actionLabel="Apply Now"
      />

      {/* Hero Demo */}
      <Hero
        title="Welcome to Macquarie University"
        subtitle="Experience world-class education with cutting-edge facilities and innovative teaching methods."
        primaryAction={{
          label: 'Explore Programs',
          onClick: () => {},
        }}
        secondaryAction={{
          label: 'Learn More',
          href: '#learn-more',
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="mb-12 text-center">
          <SectionHeading level="h1" className="mb-4">
            MQ Design System
          </SectionHeading>
          <p className="text-mq-xl text-mq-content-secondary max-w-2xl mx-auto">
            A comprehensive design system built with Macquarie University brand tokens.
          </p>
        </div>

        <div className="space-y-16">
          {/* Buttons */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              Buttons
            </SectionHeading>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>Primary Button</CardTitle>
                  <CardDescription>For main actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="primary">Primary Action</Button>
                </CardContent>
              </Card>

              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>Secondary Button</CardTitle>
                  <CardDescription>For secondary actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary">Secondary Action</Button>
                </CardContent>
              </Card>

              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>Ghost Button</CardTitle>
                  <CardDescription>For subtle actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost">Ghost Action</Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Links */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              Links
            </SectionHeading>
            <Card className={fadeIn}>
              <CardHeader>
                <CardTitle>Link Variants</CardTitle>
                <CardDescription>Different link styles for various contexts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <MQLink href="#default">Default Link</MQLink>
                </div>
                <div>
                  <MQLink href="#subtle" variant="subtle">Subtle Link</MQLink>
                </div>
                <div>
                  <MQLink href="https://mq.edu.au" external>
                    External Link (opens in new tab)
                  </MQLink>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Badges */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              Badges
            </SectionHeading>
            <Card className={fadeIn}>
              <CardHeader>
                <CardTitle>Badge Variants</CardTitle>
                <CardDescription>For labels, tags, and status indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="neutral">Neutral</Badge>
                  <Badge variant="brand">Brand</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Cards */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              Cards
            </SectionHeading>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className={cn(fadeIn, hoverLift)}>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description goes here</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-mq-sm text-mq-content-secondary">
                    This is the card content. Cards can contain various types of content
                    and are great for grouping related information.
                  </p>
                </CardContent>
              </Card>

              <Card className={cn(fadeIn, hoverLift)}>
                <CardHeader>
                  <CardTitle>Another Card</CardTitle>
                  <CardDescription>With different content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="brand">Featured</Badge>
                    <p className="text-mq-sm text-mq-content-secondary">
                      This card demonstrates combining components within cards.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Input */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              Input
            </SectionHeading>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>Text Input</CardTitle>
                  <CardDescription>Standard input with label</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input label="Full Name" placeholder="Enter your full name" />
                </CardContent>
              </Card>

              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>Input with Error</CardTitle>
                  <CardDescription>Input showing validation error</CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="Enter your email"
                    error="Please enter a valid email address"
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Alerts */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              Alerts
            </SectionHeading>
            <div className="space-y-4">
              <Alert variant="info" className={fadeIn}>
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  This is an informational alert. It provides helpful information to users.
                </AlertDescription>
              </Alert>

              <Alert variant="warning" className={fadeIn}>
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This is a warning alert. It indicates something that requires attention.
                </AlertDescription>
              </Alert>

              <Alert variant="success" className={fadeIn}>
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  This is a success alert. It confirms that an action was completed successfully.
                </AlertDescription>
              </Alert>

              <Alert variant="error" className={fadeIn}>
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  This is an error alert. It indicates that something went wrong.
                </AlertDescription>
              </Alert>
            </div>
          </section>

          {/* Animations */}
          <section>
            <SectionHeading level="h2" className="mb-8">
              Animations
            </SectionHeading>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className={hoverLift}>
                <CardHeader>
                  <CardTitle>Hover Lift</CardTitle>
                  <CardDescription>Hover over this card to see the lift effect</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-mq-sm text-mq-content-secondary">
                    This card has the hover lift animation applied. Try hovering over it!
                  </p>
                </CardContent>
              </Card>

              <Card className={fadeIn}>
                <CardHeader>
                  <CardTitle>Fade In</CardTitle>
                  <CardDescription>This card fades in on load</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-mq-sm text-mq-content-secondary">
                    This card uses the fade-in animation utility.
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