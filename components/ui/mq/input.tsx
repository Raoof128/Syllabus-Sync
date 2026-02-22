import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Optional ID for error message element (for aria-describedby) */
  errorId?: string;
  /** Optional hint text displayed below the input */
  hint?: string;
  /** Mark the field as required (adds aria-required and visual indicator) */
  isRequired?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      errorId,
      hint,
      id,
      isRequired,
      required,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const generatedErrorId = `${inputId}-error`;
    const generatedHintId = `${inputId}-hint`;
    const finalErrorId = errorId ?? generatedErrorId;

    // Determine if field is required (either via isRequired prop or native required)
    const fieldRequired = isRequired || required;

    // Build aria-describedby from hint and error
    const describedByIds: string[] = [];
    if (hint) describedByIds.push(generatedHintId);
    if (error) describedByIds.push(finalErrorId);
    const ariaDescribedBy =
      describedByIds.length > 0 ? describedByIds.join(" ") : undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label
            className="text-mq-sm font-medium text-mq-content"
            htmlFor={inputId}
          >
            {label}
            {fieldRequired && (
              <span className="text-mq-error ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-mq border border-mq-border bg-mq-input-background px-3 py-2 text-mq-sm text-mq-content placeholder:text-mq-content-tertiary shadow-xs transition-colors duration-mq-fast ease-mq-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mq-focus focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-mq-error focus-visible:ring-mq-error",
            className,
          )}
          ref={ref}
          id={inputId}
          required={required}
          aria-required={fieldRequired ? "true" : undefined}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={ariaDescribedBy}
          {...props}
        />
        {hint && !error && (
          <p
            id={generatedHintId}
            className="text-mq-sm text-mq-content-secondary"
          >
            {hint}
          </p>
        )}
        {error && (
          <p
            id={finalErrorId}
            className="text-mq-sm text-mq-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
