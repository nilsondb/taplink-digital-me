export type ThemeKey = "neon-dark" | "sunset-luxury" | "emerald-elite";

export const THEMES: { key: ThemeKey; name: string; description: string; swatch: string[] }[] = [
  {
    key: "neon-dark",
    name: "Neon Dark",
    description: "Azul neon e roxo sobre fundo escuro com glassmorphism",
    swatch: ["#0b1226", "#3b82f6", "#a855f7"],
  },
  {
    key: "sunset-luxury",
    name: "Sunset Luxury",
    description: "Laranja e rosa influencer premium",
    swatch: ["#1a0f1a", "#fb923c", "#ec4899"],
  },
  {
    key: "emerald-elite",
    name: "Emerald Elite",
    description: "Verde esmeralda corporativo sofisticado",
    swatch: ["#04211a", "#10b981", "#6ee7b7"],
  },
];

export function themeClass(theme: string | null | undefined): string {
  const k = (theme as ThemeKey) || "neon-dark";
  return `theme-${k}`;
}
