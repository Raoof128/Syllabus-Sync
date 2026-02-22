"use client";

import { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/mq/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/mq/card";
import { Home, Calendar, Newspaper, Map, Users } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/translations";
import { MagicCard } from "@/components/ui/MagicCard";

type QuickActionsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

export const quickActionLinks: {
  href: string;
  labelKey: TranslationKey;
  icon: typeof Home;
}[] = [
  { href: "/home", labelKey: "homeDashboard", icon: Home },
  { href: "/calendar", labelKey: "calendarView", icon: Calendar },
  { href: "/feed", labelKey: "eventsFeed", icon: Newspaper },
  { href: "/map", labelKey: "campusMap", icon: Map },
  { href: "/manage-profiles", labelKey: "manageProfiles", icon: Users },
];

const QuickActions = memo(({ t }: QuickActionsProps) => {
  return (
    <MagicCard data-testid="quick-actions">
      <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
        <CardHeader>
          <CardTitle id="quick-actions-heading">{t("quickActions")}</CardTitle>
        </CardHeader>
        <CardContent
          className="space-y-2"
          role="navigation"
          aria-labelledby="quick-actions-heading"
        >
          {quickActionLinks.map(({ href, labelKey, icon: Icon }) => {
            // Remove emoji from the label if present
            const label = t(labelKey).replace(
              /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*/u,
              "",
            );
            return (
              <Button
                key={href}
                variant="ghost"
                className="w-full h-auto py-2 justify-start rounded-mq-lg bg-mq-card-background text-mq-content border border-mq-border hover:border-mq-primary/20 hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300"
                asChild
              >
                <Link
                  href={href}
                  data-testid={`quick-action-${href.replace("/", "")}`}
                >
                  <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span className="min-w-0 break-words text-left">{label}</span>
                </Link>
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </MagicCard>
  );
});

QuickActions.displayName = "QuickActions";

export default QuickActions;
