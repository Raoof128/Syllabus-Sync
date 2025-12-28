// components/home/QuickActions.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Map, Calendar } from 'lucide-react';

export default function QuickActions() {
    return (
        <div className="flex gap-4">
            <Button asChild size="lg">
                <Link href="/map" className="gap-2">
                    <Map className="h-5 w-5" />
                    Open Map
                </Link>
            </Button>

            <Button asChild variant="outline" size="lg">
                <Link href="/calendar" className="gap-2">
                    <Calendar className="h-5 w-5" />
                    View Calendar
                </Link>
            </Button>
        </div>
    );
}
