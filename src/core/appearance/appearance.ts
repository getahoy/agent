import { z } from "zod";

export const appearanceSchema = z.enum(["system", "light", "dark"]);
export const resolvedThemeSchema = z.enum(["light", "dark"]);

export type Appearance = z.infer<typeof appearanceSchema>;
export type ResolvedTheme = z.infer<typeof resolvedThemeSchema>;
