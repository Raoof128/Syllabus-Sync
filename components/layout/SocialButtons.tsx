// components/layout/SocialButtons.tsx
'use client';

import { memo } from 'react';
import { Globe, Linkedin, Mail } from 'lucide-react';

const XIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
    >
        <path
            fill="currentColor"
            d="M18.244 2H21l-6.518 7.451L22 22h-6.828l-5.353-7.133L3.62 22H1l7.02-8.03L2 2h6.999l4.837 6.44L18.244 2Zm-1.196 18h1.795L7.98 3.91H6.045l11.003 16.09Z"
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
        name: 'x',
        icon: XIcon,
        href: 'https://x.com/Macquarie_Uni',
        label: 'X',
    },
    {
        name: 'linkedin',
        icon: Linkedin,
        href: 'https://www.linkedin.com/school/macquarie-university/',
        label: 'LinkedIn',
    },
    {
        name: 'website',
        icon: Globe,
        href: 'https://www.mq.edu.au',
        label: 'MQ Website',
    },
    {
        name: 'email',
        icon: Mail,
        href: 'mailto:support@mq.edu.au',
        label: 'Email',
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
                            aria-label={link.label}
                        >
                            <Icon className="social-icon h-5 w-5" aria-hidden="true" />
                            <span className="social-title">{link.label}</span>
                        </a>
                    </li>
                );
            })}
        </ul>
    );
});

SocialButtons.displayName = 'SocialButtons';

export default SocialButtons;
