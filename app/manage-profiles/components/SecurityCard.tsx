"use client";

import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/mq/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/mq/card";
import { Shield, Lock, Laptop } from "lucide-react";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";
import { MagicCard } from "@/components/ui/MagicCard";
import { SessionsList } from "@/features/settings/components/privacy/SessionsList";

export const SecurityCard = memo(() => {
  const { t } = useTypedTranslation();
  const router = useRouter();
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);

  return (
    <>
      <MagicCard isLiquidEnhanced>
        <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-mq-primary" aria-hidden="true" />
              <span>{t("security")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Change Password */}
            <div className="p-4 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-full bg-mq-primary/10 text-mq-primary shrink-0">
                    <Lock className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-mq-content">
                      {t("changePassword")}
                    </h3>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t("changePasswordDesc")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() => router.push("/reset-password?from=settings")}
                >
                  {t("changePassword")}
                </Button>
              </div>
            </div>

            {/* Manage Sessions */}
            <div className="p-4 bg-mq-card-background rounded-mq-lg border border-mq-border hover:shadow-[0_0_15px_rgba(166,25,46,0.1)] transition-all duration-300">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-full bg-mq-primary/10 text-mq-primary shrink-0">
                    <Laptop className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-mq-content">
                      {t("manageSessions")}
                    </h3>
                    <p className="text-mq-sm text-mq-content-secondary">
                      {t("manageSessionsDesc")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto bg-mq-button-secondary hover:bg-mq-hover-background text-mq-content"
                  onClick={() => setShowSessionsDialog(true)}
                >
                  {t("manageSessions")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </MagicCard>

      <SessionsList
        open={showSessionsDialog}
        onOpenChange={setShowSessionsDialog}
        t={t}
      />
    </>
  );
});

SecurityCard.displayName = "SecurityCard";
