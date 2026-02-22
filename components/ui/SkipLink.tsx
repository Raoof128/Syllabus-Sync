"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";

interface SkipLinkProps {
  targetId?: string;
  className?: string;
}

export function SkipLink({
  targetId = "main-content",
  className,
}: SkipLinkProps) {
  const { t } = useTypedTranslation();

  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "sr-only focus:not-sr-only",
        "focus:absolute focus:top-4 focus:left-4 focus:z-[9999]",
        "focus:px-4 focus:py-2 focus:bg-mq-primary focus:text-white",
        "focus:rounded-mq focus:font-medium focus:shadow-lg",
        "focus:outline-none focus:ring-2 focus:ring-mq-focus focus:ring-offset-2",
        "transition-all duration-200",
        className,
      )}
    >
      {t("skipToContent")}
    </a>
  );
}

export default SkipLink;
