import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createLoginSchema = (t: (key: any) => string) =>
  z.object({
    email: z
      .string()
      .min(1, t("loginEmailRequired"))
      .email(t("loginValidEmail")),
    password: z.string().min(1, t("loginPasswordRequired")),
  });

// Default schema for use in non-i18n contexts (e.g. server actions)
export const loginSchema = createLoginSchema((key: string) => {
  const fallbacks: Record<string, string> = {
    loginEmailRequired: "Email is required",
    loginValidEmail: "Please enter a valid university email",
    loginPasswordRequired: "Password is required",
  };
  return fallbacks[key] || key;
});

export type LoginFormData = z.infer<typeof loginSchema>;
