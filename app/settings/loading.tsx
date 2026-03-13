import { Loader2 } from 'lucide-react';

export default function SettingsLoading() {
  return (
    <div className="flex items-center justify-center min-h-[30vh]">
      <Loader2 className="h-8 w-8 animate-spin text-mq-primary" />
    </div>
  );
}
