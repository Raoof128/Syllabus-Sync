import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-mq px-2 py-1 text-mq-xs font-medium cursor-default transition-colors",
  {
    variants: {
      variant: {
        neutral:
          "bg-mq-background-secondary text-mq-content-secondary border border-mq-border",
        brand: "bg-mq-primary text-white",
        secondary: "bg-mq-secondary text-mq-content border border-mq-sand-400",
      },
      // Tier 5: Typography Hierarchy
      size: {
        default: "text-mq-xs",
        lg: "text-sm font-semibold px-2.5 py-1.5",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
