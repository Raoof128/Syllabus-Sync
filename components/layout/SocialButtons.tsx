// components/layout/SocialButtons.tsx
'use client';

import { memo } from 'react';
import { Linkedin } from 'lucide-react';

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M18.244 2H21l-6.518 7.451L22 22h-6.828l-5.353-7.133L3.62 22H1l7.02-8.03L2 2h6.999l4.837 6.44L18.244 2Zm-1.196 18h1.795L7.98 3.91H6.045l11.003 16.09Z"
    />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
    />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
    />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"
    />
  </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
    />
  </svg>
);

interface SocialLink {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  label: string;
}

const socialLinks: SocialLink[] = [
  {
    name: 'facebook',
    icon: FacebookIcon,
    href: 'https://www.facebook.com/macquarieuni/',
    label: 'Facebook',
  },
  {
    name: 'instagram',
    icon: InstagramIcon,
    href: 'https://www.instagram.com/macquarieuni/',
    label: 'Instagram',
  },
  {
    name: 'linkedin',
    icon: Linkedin,
    href: 'https://www.linkedin.com/school/macquarie-university/',
    label: 'LinkedIn',
  },
  {
    name: 'tiktok',
    icon: TikTokIcon,
    href: 'https://www.tiktok.com/@macquarieuni',
    label: 'TikTok',
  },
  {
    name: 'youtube',
    icon: YouTubeIcon,
    href: 'https://www.youtube.com/user/MacquarieUniversity',
    label: 'YouTube',
  },
  {
    name: 'x',
    icon: XIcon,
    href: 'https://x.com/Macquarie_Uni',
    label: 'X',
  },
];

const SocialButtons = memo(() => {
  return (
    <ul className="social-buttons">
      {socialLinks.map((link) => {
        const Icon = link.icon;
        return (
          <li key={link.name}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label} (opens in new tab)`}
              title={`${link.label} (opens in new tab)`}
            >
              <Icon className="social-icon h-5 w-5" aria-hidden="true" />
              <span className="social-title">{link.label}</span>
              <span className="sr-only">(opens in new tab)</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
});

SocialButtons.displayName = 'SocialButtons';

export default SocialButtons;
