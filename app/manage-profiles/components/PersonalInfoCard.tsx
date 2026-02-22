"use client";

import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "../schema";
import { Input } from "@/components/ui/mq/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/mq/card";
import { User } from "lucide-react";
import { useTypedTranslation } from "@/lib/hooks/useTypedTranslation";
import { MagicCard } from "@/components/ui/MagicCard";

interface Props {
  form: UseFormReturn<ProfileFormValues>;
  email?: string; // Email is read-only, not in Zod form
  disabled?: boolean;
}

export function PersonalInfoCard({ form, email, disabled }: Props) {
  const { t } = useTypedTranslation();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <MagicCard isLiquidEnhanced className="mb-4 sm:mb-6">
      <div className="mq-magic-card-content p-0 bg-mq-card-background border border-mq-border">
        <Card className="border border-mq-border bg-mq-card-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> {t("personalInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input
                id="name"
                {...register("name")} // <--- Zod Magic
                placeholder={t("enterFullName")}
                disabled={disabled}
                className={errors.name ? "border-red-500" : ""}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-red-500 text-xs">{errors.name.message}</p>
              )}
            </div>

            {/* Read Only Email */}
            <div className="space-y-2">
              <Label>{t("emailAddress")}</Label>
              <Input
                value={email}
                disabled
                className="bg-mq-background-subtle opacity-70 cursor-not-allowed"
              />
              <p className="text-mq-xs text-mq-content-tertiary">
                {t("emailCannotBeChanged")}
              </p>
            </div>

            {/* Student ID */}
            <div className="space-y-2">
              <Label htmlFor="studentId">{t("studentId")}</Label>
              <Input
                id="studentId"
                {...register("studentId")}
                placeholder="12345678"
                maxLength={8}
                inputMode="numeric"
                disabled={disabled}
                className={errors.studentId ? "border-red-500" : ""}
                aria-invalid={!!errors.studentId}
              />
              {errors.studentId && (
                <p className="text-red-500 text-xs">
                  {errors.studentId.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MagicCard>
  );
}
