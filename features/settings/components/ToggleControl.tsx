'use client';

type ToggleControlProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
  testId?: string;
};

export const ToggleControl = ({ checked, onToggle, label, testId }: ToggleControlProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onToggle}
    className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mq-primary ${checked ? 'bg-mq-primary border-mq-primary' : 'bg-mq-background border-mq-border'}`}
    data-testid={testId}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      aria-hidden="true"
    />
  </button>
);
