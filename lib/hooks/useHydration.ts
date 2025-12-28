// lib/hooks/useHydration.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to track client-side hydration status.
 * Returns true once the component has mounted on the client.
 * Useful for avoiding hydration mismatches with localStorage-based stores.
 */
export function useHydration(): boolean {
    const [hydrated, setHydrated] = useState(false);

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        setHydrated(true);
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    return hydrated;
}

