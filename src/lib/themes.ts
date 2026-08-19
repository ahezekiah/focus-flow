export interface AppTheme {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  background: string;
  card: string;
  sidebar: string;
  primary: string;
  accent: string;
  muted: string;
  mutedFg: string;
  foreground: string;
  border: string;
  ring: string;
  greetingBg: string;
  greetingOverlay: string;
}

export const THEMES: Record<string, AppTheme> = {
  "focusflow": {
    id: "focusflow",
    name: "FocusFlow",
    emoji: "🌌",
    desc: "Default deep space — violet primary, amber CTAs",
    background: "#09091c",
    card: "#0f0f26",
    sidebar: "#0c0c1e",
    primary: "#7c6ef7",
    accent: "#e88c45",
    muted: "#141432",
    mutedFg: "#6868a0",
    foreground: "#e4e4f2",
    border: "rgba(255,255,255,0.07)",
    ring: "#7c6ef7",
    greetingBg: "linear-gradient(135deg, #1a1040 0%, #130c38 50%, #0d0828 100%)",
    greetingOverlay: "rgba(124,110,247,0.12)",
  },
  "cozy-cabin": {
    id: "cozy-cabin",
    name: "Cozy Cabin",
    emoji: "🏠",
    desc: "Fireplace warmth — ember orange glow, dark wood tones",
    background: "#0d0a06",
    card: "#140e08",
    sidebar: "#100c07",
    primary: "#d4753a",
    accent: "#c4a548",
    muted: "#1c1408",
    mutedFg: "#7a5e3a",
    foreground: "#f0ddc0",
    border: "rgba(212,117,58,0.09)",
    ring: "#d4753a",
    greetingBg: "linear-gradient(135deg, #2e1408 0%, #1e0d06 50%, #120808 100%)",
    greetingOverlay: "rgba(212,117,58,0.14)",
  },
  "modern-workspace": {
    id: "modern-workspace",
    name: "Modern Workspace",
    emoji: "🖥️",
    desc: "Clean & minimal — electric blue on near-black",
    background: "#060810",
    card: "#0b0d1c",
    sidebar: "#090b16",
    primary: "#4a9eff",
    accent: "#00d4b0",
    muted: "#0f1220",
    mutedFg: "#4a5080",
    foreground: "#e4e8f8",
    border: "rgba(74,158,255,0.09)",
    ring: "#4a9eff",
    greetingBg: "linear-gradient(135deg, #04102c 0%, #050a1c 50%, #04060e 100%)",
    greetingOverlay: "rgba(74,158,255,0.12)",
  },
  "library": {
    id: "library",
    name: "Library",
    emoji: "📚",
    desc: "Warm lamplight — aged gold on antique dark",
    background: "#09080a",
    card: "#120f12",
    sidebar: "#0e0c0e",
    primary: "#b89060",
    accent: "#d4a848",
    muted: "#181418",
    mutedFg: "#6a5a48",
    foreground: "#ede0cc",
    border: "rgba(184,144,96,0.09)",
    ring: "#b89060",
    greetingBg: "linear-gradient(135deg, #201508 0%, #160f08 50%, #0c0808 100%)",
    greetingOverlay: "rgba(184,144,96,0.12)",
  },
  "night-city": {
    id: "night-city",
    name: "Night City",
    emoji: "🌃",
    desc: "Cyberpunk neon — hot pink & cyan on void black",
    background: "#050310",
    card: "#09061e",
    sidebar: "#070418",
    primary: "#ff3eb5",
    accent: "#00ffcc",
    muted: "#0e0828",
    mutedFg: "#6030a0",
    foreground: "#f0d8ff",
    border: "rgba(255,62,181,0.09)",
    ring: "#ff3eb5",
    greetingBg: "linear-gradient(135deg, #1e0430 0%, #120220 50%, #060112 100%)",
    greetingOverlay: "rgba(255,62,181,0.14)",
  },
  "forest": {
    id: "forest",
    name: "Forest",
    emoji: "🌲",
    desc: "Ancient woods — deep green with leaf gold accents",
    background: "#060d08",
    card: "#0a1410",
    sidebar: "#081008",
    primary: "#4caf7a",
    accent: "#88c84a",
    muted: "#0e1812",
    mutedFg: "#406050",
    foreground: "#d0eedc",
    border: "rgba(76,175,122,0.09)",
    ring: "#4caf7a",
    greetingBg: "linear-gradient(135deg, #082416 0%, #060e08 50%, #040a06 100%)",
    greetingOverlay: "rgba(76,175,122,0.12)",
  },
  "space-station": {
    id: "space-station",
    name: "Space Station",
    emoji: "🚀",
    desc: "Cold orbital — ion blue on deep space black",
    background: "#04050e",
    card: "#07091a",
    sidebar: "#060814",
    primary: "#4080ff",
    accent: "#20c8ff",
    muted: "#090c1e",
    mutedFg: "#2848a0",
    foreground: "#c8d8ff",
    border: "rgba(64,128,255,0.09)",
    ring: "#4080ff",
    greetingBg: "linear-gradient(135deg, #080430 0%, #050210 50%, #020208 100%)",
    greetingOverlay: "rgba(64,128,255,0.12)",
  },
};

export const THEME_ORDER = ["focusflow", "cozy-cabin", "modern-workspace", "library", "night-city", "forest", "space-station"];
