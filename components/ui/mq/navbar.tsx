import React from 'react';
import Link from 'next/link';
import { Button } from './button';
import { MQLink } from './link';
import { useTranslation } from '@/lib/hooks/useTranslation';

interface NavbarProps {
  title?: string;
  navItems?: Array<{
    label: string;
    href: string;
  }>;
  onAction?: () => void;
  actionLabel?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title, navItems, onAction, actionLabel }) => {
  const { t } = useTranslation();

  const defaultTitle = t('macquarieUniversity');
  const defaultNavItems = [
    { label: t('navHome'), href: '/' },
    { label: t('navAbout'), href: '/about' },
    { label: t('navPrograms'), href: '/programs' },
    { label: t('navContact'), href: '/contact' },
  ];
  const defaultActionLabel = t('applyNow');

  const finalTitle = title || defaultTitle;
  const finalNavItems = navItems || defaultNavItems;
  const finalActionLabel = actionLabel || defaultActionLabel;

  return (
    <nav className="mq-liquid-glass border-b border-[var(--liquid-glass-border)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link
                href="/"
                className="text-mq-xl font-bold text-mq-content hover:text-mq-primary transition-colors duration-mq-fast"
              >
                {finalTitle}
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {finalNavItems.map((item) => (
                <MQLink
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-mq-sm font-medium text-mq-content-secondary hover:border-mq-primary hover:text-mq-content"
                >
                  {item.label}
                </MQLink>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {onAction && (
              <Button variant="primary" size="sm" onClick={onAction}>
                {finalActionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
