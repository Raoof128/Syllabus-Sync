import React from 'react';
import Link from 'next/link';
import { Button } from './button';
import { MQLink } from './link';

interface NavbarProps {
  title?: string;
  navItems?: Array<{
    label: string;
    href: string;
  }>;
  onAction?: () => void;
  actionLabel?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  title = 'Macquarie University',
  navItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Programs', href: '/programs' },
    { label: 'Contact', href: '/contact' },
  ],
  onAction,
  actionLabel = 'Apply Now',
}) => {
  return (
    <nav className="bg-mq-background border-b border-mq-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-mq-xl font-bold text-mq-content hover:text-mq-primary transition-colors duration-mq-fast">
                {title}
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
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
                {actionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};