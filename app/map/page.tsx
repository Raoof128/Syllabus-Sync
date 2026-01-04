// app/map/page.tsx
import { Metadata } from 'next';
import { APP_CONFIG, UNIVERSITY_CONFIG } from '@/lib/config';
import MapClient from './MapClient';

export const metadata: Metadata = {
    title: `${APP_CONFIG.name} - Campus Map`,
    description: 'Navigate the campus with an interactive map featuring building locations and directions.',
    openGraph: {
        title: `${APP_CONFIG.name} - Campus Map`,
        description: 'Navigate the campus with an interactive map featuring building locations and directions.',
        type: 'website',
        images: [
            {
                url: `${UNIVERSITY_CONFIG.website}/MQ_Logo_Final.png`,
                alt: `${APP_CONFIG.name} logo`,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        images: [`${UNIVERSITY_CONFIG.website}/MQ_Logo_Final.png`],
    },
};

export default function MapPage() {
    return <MapClient />;
}
