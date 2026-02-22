import { cn } from "@/lib/utils";

/**
 * Hover lift animation utility
 * Adds a subtle transform and shadow effect on hover
 */
export const hoverLift = cn(
  "transition-all duration-mq-mid ease-mq-ease",
  "hover:transform hover:translate-y-[-2px] hover:shadow-mq-md",
);

/**
 * Fade-in animation utility
 * Can be applied to elements that should fade in
 */
export const fadeIn = cn("animate-in fade-in duration-mq-slow ease-mq-ease");

/**
 * Utility function to combine hover lift with other classes
 */
export const withHoverLift = (className?: string) => cn(hoverLift, className);

/**
 * Utility function to combine fade-in with other classes
 */
export const withFadeIn = (className?: string) => cn(fadeIn, className);
