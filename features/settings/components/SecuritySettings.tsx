"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/mq/card";
import { Shield, Loader2, LogIn, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/mq/button";
import { MagicCard } from "@/components/ui/MagicCard";
import type { TranslationKey } from "@/lib/i18n/translations";
import { PasskeySecuritySection } from "./security/PasskeySecuritySection";
import { TOTPSetup } from "./security/TOTPSetup";
import { SMSSetup } from "./security/SMSSetup";
import { API_ROUTES } from "@/lib/constants/config";
import type { MFAFactor } from "@/lib/security/mfa";

type SecuritySettingsProps = {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const SecuritySettings = memo(({ t }: SecuritySettingsProps) => {
  const router = useRouter();
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMFAStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(API_ROUTES.AUTH.MFA_STATUS);
      if (res.ok) {
        const json = await res.json();
        setFactors(json.data?.factors ?? []);
      }
    } catch {
      // silently fail — settings page should not crash
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMFAStatus();
  }, [fetchMFAStatus]);

  return (
    <MagicCard data-testid="security-settings">
      <Card className="mq-magic-card-content bg-mq-card-background border border-mq-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" aria-hidden="true" />
            <span id="security-heading">{t("security")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent
          className="space-y-6"
          role="region"
          aria-labelledby="security-heading"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-mq-primary" />
            </div>
          ) : (
            <>
              {/* TOTP Authenticator App */}
              <TOTPSetup
                t={t}
                factors={factors}
                onStatusChange={fetchMFAStatus}
              />

              {/* SMS Verification */}
              <SMSSetup
                t={t}
                factors={factors}
                onStatusChange={fetchMFAStatus}
              />

              {/* Passkeys & Biometric Login */}
              <PasskeySecuritySection t={t} />

              {/* Account Security Actions */}
              <div className="pt-2 border-t border-mq-border space-y-3">
                <h3 className="text-sm font-medium text-mq-content-secondary flex items-center gap-2">
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  {t("accountSecurity" as TranslationKey) || "Account Security"}
                </h3>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() =>
                    router.push("/login?redirectTo=/settings/security")
                  }
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  {t("changePassword" as TranslationKey) || "Change Password"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </MagicCard>
  );
});

SecuritySettings.displayName = "SecuritySettings";

export default SecuritySettings;
