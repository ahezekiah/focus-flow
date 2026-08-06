import { useEffect, useState, type CSSProperties } from "react";

// ── Theme identities ───────────────────────────────────────────
export type ThemeId =
  | "focus-flow"
  | "cozy-cabin"
  | "modern-workspace"
  | "library"
  | "night-city"
  | "forest"
  | "cafe"
  | "space-station";

interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  primary: string;
  primaryFg: string;
  secondary: string;
  secondaryFg: string;
  muted: string;
  mutedFg: string;
  accent: string;
  accentFg: string;
  border: string;
  ring: string;
  inputBackground: string;
  switchBackground: string;
}

/** Raw palette + personality for one environment. */
interface ThemeSource {
  id: ThemeId;
  name: string;
  emoji: string;
  tagline: string;
  desc: string;
  colors: ThemeColors;
  fontFamily: string;
  animDuration: number;
  animEasing: string;
  swatches: string[];
  pattern: string;
}

/** A fully derived theme — every token the dashboard paints with. */
export interface DashTheme extends Omit<ThemeSource, "colors">, ThemeColors {
  /** True when the background is light, so overlays must darken instead of lighten. */
  isLight: boolean;
  /** Display name of the theme's typeface, e.g. "Space Mono". */
  fontLabel: string;
  sidebar: string;
  greetingBg: string;
  greetingOverlay: string;
  /** Neutral scrim that adapts to light and dark backgrounds. */
  overlay: (alpha: number) => string;
  /** CSS transition string for the given properties, timed by the theme. */
  transition: (...properties: string[]) => string;
}

const THEME_SOURCES: ThemeSource[] = [
  {
    id: "focus-flow",
    name: "Focus Flow",
    emoji: "◎",
    tagline: "Clear mind, deep work",
    desc: "Minimalist precision. Every element earns its place.",
    colors: {
      background: "#F5F7FF",
      foreground: "#1E1B4B",
      card: "#FFFFFF",
      primary: "#4F46E5",
      primaryFg: "#FFFFFF",
      secondary: "#EEF2FF",
      secondaryFg: "#4338CA",
      muted: "#F1F0F9",
      mutedFg: "#6366F1",
      accent: "#818CF8",
      accentFg: "#FFFFFF",
      border: "rgba(99, 102, 241, 0.15)",
      ring: "#818CF8",
      inputBackground: "#F1F0F9",
      switchBackground: "#C7D2FE",
    },
    fontFamily: '"Inter", system-ui, sans-serif',
    animDuration: 200,
    animEasing: "cubic-bezier(0.4, 0, 0.2, 1)",
    swatches: ["#4F46E5", "#818CF8", "#EEF2FF", "#F5F7FF"],
    pattern: "radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px)",
  },
  {
    id: "cozy-cabin",
    name: "Cozy Cabin",
    emoji: "⬡",
    tagline: "Warm light, easy pace",
    desc: "Earthy warmth for unhurried creative work.",
    colors: {
      background: "#251510",
      foreground: "#F2E4D0",
      card: "#352017",
      primary: "#E8894A",
      primaryFg: "#1A0A05",
      secondary: "#453020",
      secondaryFg: "#E8C9A0",
      muted: "#3A2015",
      mutedFg: "#C4956A",
      accent: "#F0A875",
      accentFg: "#1A0A05",
      border: "rgba(232, 169, 74, 0.18)",
      ring: "#E8894A",
      inputBackground: "#3A2015",
      switchBackground: "#6B3A1F",
    },
    fontFamily: '"Lora", Georgia, serif',
    animDuration: 500,
    animEasing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    swatches: ["#E8894A", "#F0A875", "#352017", "#F2E4D0"],
    pattern: "radial-gradient(ellipse at 30% 30%, rgba(232,137,74,0.08) 0%, transparent 60%)",
  },
  {
    id: "modern-workspace",
    name: "Modern Workspace",
    emoji: "⬛",
    tagline: "Sharp tools, clear signals",
    desc: "High-contrast precision for technical, data-driven work.",
    colors: {
      background: "#0D1117",
      foreground: "#E6EDF3",
      card: "#161B22",
      primary: "#58A6FF",
      primaryFg: "#0D1117",
      secondary: "#21262D",
      secondaryFg: "#8B949E",
      muted: "#1C2129",
      mutedFg: "#6E7681",
      accent: "#1F6FEB",
      accentFg: "#FFFFFF",
      border: "rgba(48, 54, 61, 0.9)",
      ring: "#58A6FF",
      inputBackground: "#1C2129",
      switchBackground: "#30363D",
    },
    fontFamily: '"Space Mono", "Courier New", monospace',
    animDuration: 100,
    animEasing: "linear",
    swatches: ["#58A6FF", "#1F6FEB", "#161B22", "#E6EDF3"],
    pattern:
      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.018) 2px, rgba(255,255,255,0.018) 4px)",
  },
  {
    id: "library",
    name: "Library",
    emoji: "◼",
    tagline: "Deep reading, slow thought",
    desc: "Scholarly calm with unhurried typographic sensibility.",
    colors: {
      background: "#F3EDE0",
      foreground: "#2D2010",
      card: "#FAF6ED",
      primary: "#5C3A20",
      primaryFg: "#FAF6ED",
      secondary: "#E8DFC8",
      secondaryFg: "#5C3A20",
      muted: "#EDE5CF",
      mutedFg: "#8B6D4E",
      accent: "#7B4E2D",
      accentFg: "#FAF6ED",
      border: "rgba(92, 58, 32, 0.13)",
      ring: "#7B4E2D",
      inputBackground: "#EDE5CF",
      switchBackground: "#C9B79C",
    },
    fontFamily: '"EB Garamond", Georgia, serif',
    animDuration: 600,
    animEasing: "cubic-bezier(0.16, 1, 0.3, 1)",
    swatches: ["#5C3A20", "#7B4E2D", "#FAF6ED", "#2D2010"],
    pattern: "radial-gradient(ellipse at top center, rgba(92,58,32,0.05) 0%, transparent 65%)",
  },
  {
    id: "night-city",
    name: "Night City",
    emoji: "⬡",
    tagline: "Neon pulse, electric focus",
    desc: "Cyberpunk streets and electric intensity for late-night sessions.",
    colors: {
      background: "#08080F",
      foreground: "#DDE8FF",
      card: "#0E0E1C",
      primary: "#FF2D78",
      primaryFg: "#FFFFFF",
      secondary: "#1A1A2E",
      secondaryFg: "#9BA8CC",
      muted: "#12122A",
      mutedFg: "#6B7BAE",
      accent: "#00E5FF",
      accentFg: "#000000",
      border: "rgba(255, 45, 120, 0.18)",
      ring: "#FF2D78",
      inputBackground: "#12122A",
      switchBackground: "#2A1A3A",
    },
    fontFamily: '"Space Mono", "Courier New", monospace',
    animDuration: 150,
    animEasing: "cubic-bezier(0.4, 0, 1, 1)",
    swatches: ["#FF2D78", "#00E5FF", "#0E0E1C", "#DDE8FF"],
    pattern:
      "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,45,120,0.03) 3px, rgba(255,45,120,0.03) 4px)",
  },
  {
    id: "forest",
    name: "Forest",
    emoji: "◉",
    tagline: "Rooted, still, alive",
    desc: "Deep woodland calm for focused, unhurried thinking.",
    colors: {
      background: "#0F1A10",
      foreground: "#D4EDCD",
      card: "#152115",
      primary: "#5CBA6A",
      primaryFg: "#071009",
      secondary: "#1B2E1A",
      secondaryFg: "#8DB98B",
      muted: "#132013",
      mutedFg: "#7AAB77",
      accent: "#8FD47B",
      accentFg: "#071009",
      border: "rgba(92, 186, 106, 0.16)",
      ring: "#5CBA6A",
      inputBackground: "#132013",
      switchBackground: "#2A4A2A",
    },
    fontFamily: '"Lora", Georgia, serif',
    animDuration: 450,
    animEasing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    swatches: ["#5CBA6A", "#8FD47B", "#152115", "#D4EDCD"],
    pattern: "radial-gradient(ellipse at 70% 20%, rgba(92,186,106,0.07) 0%, transparent 55%)",
  },
  {
    id: "cafe",
    name: "Cafe",
    emoji: "◎",
    tagline: "Warm cups, good ideas",
    desc: "Cheerful and sociable — the corner table with good light.",
    colors: {
      background: "#FDF6EC",
      foreground: "#2D1E10",
      card: "#FFFAF3",
      primary: "#C4692E",
      primaryFg: "#FFF8F0",
      secondary: "#F5E8D4",
      secondaryFg: "#8B4513",
      muted: "#F0E4CE",
      mutedFg: "#A07040",
      accent: "#D4915C",
      accentFg: "#FFF8F0",
      border: "rgba(180, 120, 60, 0.16)",
      ring: "#C4692E",
      inputBackground: "#F0E4CE",
      switchBackground: "#D4B896",
    },
    fontFamily: '"Nunito", system-ui, sans-serif',
    animDuration: 300,
    animEasing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    swatches: ["#C4692E", "#D4915C", "#FDF6EC", "#2D1E10"],
    pattern: "radial-gradient(circle at 20% 80%, rgba(196,105,46,0.06) 0%, transparent 50%)",
  },
  {
    id: "space-station",
    name: "Space Station",
    emoji: "◼",
    tagline: "Vast, quiet, precise",
    desc: "The hum of life support. Infinite focus in infinite space.",
    colors: {
      background: "#060B14",
      foreground: "#B8D4F0",
      card: "#0B1220",
      primary: "#4DC8E8",
      primaryFg: "#020810",
      secondary: "#0F1D30",
      secondaryFg: "#5B8AB0",
      muted: "#0C1828",
      mutedFg: "#4A7899",
      accent: "#1E90D4",
      accentFg: "#FFFFFF",
      border: "rgba(77, 200, 232, 0.13)",
      ring: "#4DC8E8",
      inputBackground: "#0C1828",
      switchBackground: "#1A3050",
    },
    fontFamily: '"Space Mono", "Courier New", monospace',
    animDuration: 220,
    animEasing: "cubic-bezier(0.4, 0, 0.2, 1)",
    swatches: ["#4DC8E8", "#1E90D4", "#0B1220", "#B8D4F0"],
    pattern:
      "radial-gradient(circle at 85% 15%, rgba(77,200,232,0.06) 0%, transparent 40%), radial-gradient(circle at 15% 85%, rgba(30,144,212,0.04) 0%, transparent 35%)",
  },
];

// ── Derivation helpers ─────────────────────────────────────────
/** Perceived brightness of a #rrggbb colour, 0 (black) to 1 (white). */
function brightness(hex: string): number {
  const v = hex.replace("#", "");
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function buildTheme(src: ThemeSource): DashTheme {
  const c = src.colors;
  const isLight = brightness(c.background) > 0.5;
  const scrim = isLight ? "0,0,0" : "255,255,255";

  return {
    ...src,
    ...c,
    isLight,
    fontLabel: src.fontFamily.split(",")[0].replace(/"/g, "").trim(),
    sidebar: c.card,
    greetingBg: `linear-gradient(135deg, ${c.secondary} 0%, ${c.muted} 50%, ${c.background} 100%)`,
    greetingOverlay: `${c.primary}1F`,
    overlay: (alpha: number) => `rgba(${scrim},${alpha})`,
    transition: (...properties: string[]) =>
      (properties.length ? properties : ["all"])
        .map(p => `${p} ${src.animDuration}ms ${src.animEasing}`)
        .join(", "),
  };
}

// ── Public API ─────────────────────────────────────────────────
export const THEME_ORDER: ThemeId[] = THEME_SOURCES.map(t => t.id);

export const THEMES: Record<ThemeId, DashTheme> = Object.fromEntries(
  THEME_SOURCES.map(src => [src.id, buildTheme(src)])
) as Record<ThemeId, DashTheme>;

export const DEFAULT_THEME_ID: ThemeId = "focus-flow";

/** Maps the active theme onto the shadcn CSS variables the ui/ components read. */
export function themeCssVars(t: DashTheme): CSSProperties {
  return {
    "--font-display": t.fontFamily,
    "--background": t.background,
    "--foreground": t.foreground,
    "--card": t.card,
    "--card-foreground": t.foreground,
    "--popover": t.card,
    "--popover-foreground": t.foreground,
    "--primary": t.primary,
    "--primary-foreground": t.primaryFg,
    "--secondary": t.secondary,
    "--secondary-foreground": t.secondaryFg,
    "--muted": t.muted,
    "--muted-foreground": t.mutedFg,
    "--accent": t.accent,
    "--accent-foreground": t.accentFg,
    "--border": t.border,
    "--input": t.border,
    "--input-background": t.inputBackground,
    "--switch-background": t.switchBackground,
    "--ring": t.ring,
    "--sidebar": t.sidebar,
    "--sidebar-foreground": t.foreground,
    "--sidebar-primary": t.primary,
    "--sidebar-primary-foreground": t.primaryFg,
    "--sidebar-accent": t.muted,
    "--sidebar-accent-foreground": t.foreground,
    "--sidebar-border": t.border,
    "--sidebar-ring": t.ring,
  } as CSSProperties;
}

const STORAGE_KEY = "focusflow:dash-theme";

function readStoredThemeId(): ThemeId | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && stored in THEMES ? (stored as ThemeId) : null;
  } catch {
    return null;
  }
}

/** Holds the selected environment and remembers it between visits. */
export function useThemeSelection() {
  const [themeId, setThemeId] = useState<ThemeId>(() => readStoredThemeId() ?? DEFAULT_THEME_ID);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // Storage unavailable (private mode) — selection stays for this visit only.
    }
  }, [themeId]);

  return { themeId, theme: THEMES[themeId], setThemeId };
}
