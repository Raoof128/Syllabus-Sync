import { GraduationCap, Chrome } from "lucide-react";

export const Icons = {
  Graduation: GraduationCap,
  Google: Chrome,
} as const;

export type IconName = keyof typeof Icons;
