// components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Calendar, MessageSquare, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Map + Live', href: '/map-live', icon: MapPin },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Feed', href: '/feed', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-48 bg-gray-50 border-r border-gray-200 min-h-screen p-4">
            <div className="mb-8">
                <h1 className="text-xl font-bold">The Syllabus Sync</h1>
            </div>

            <nav className="space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}