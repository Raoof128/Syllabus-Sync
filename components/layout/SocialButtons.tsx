// components/layout/SocialButtons.tsx
'use client';

import { memo } from 'react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

interface SocialLink {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
    label: string;
}

const socialLinks: SocialLink[] = [
    {
        name: 'github',
        icon: Github,
        href: 'https://github.com/Macquarie-University',
        label: 'GitHub',
    },
    {
        name: 'twitter',
        icon: Twitter,
        href: 'https://twitter.com/Macquarie_Uni',
        label: 'Twitter',
    },
    {
        name: 'linkedin',
        icon: Linkedin,
        href: 'https://www.linkedin.com/school/macquarie-university/',
        label: 'LinkedIn',
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
                            className="flex items-center justify-center w-full h-full"
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
