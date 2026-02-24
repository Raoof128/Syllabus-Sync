import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useHomeEventListeners() {
  const router = useRouter();

  // Listen for custom events from child components
  useEffect(() => {
    const handleAddUnitEvent = () => {
      // Navigate to calendar page where units can be managed
      router.push('/calendar');
    };

    const handleAddDeadlineEvent = () => {
      // Navigate to calendar page where deadline can be added
      router.push('/calendar');
    };

    window.addEventListener('add-unit', handleAddUnitEvent);
    window.addEventListener('add-deadline', handleAddDeadlineEvent);

    return () => {
      window.removeEventListener('add-unit', handleAddUnitEvent);
      window.removeEventListener('add-deadline', handleAddDeadlineEvent);
    };
  }, [router]);
}
