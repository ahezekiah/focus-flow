import { useState, createContext, useContext } from 'react';
import { ThemeSidebar } from './components/ThemeSidebar';
import { Workspace } from './components/Workspace';

export type ThemeId = 'focus-flow' | 'cozy-cabin' | 'modern-workspace' | 'library' | 'night-city' | 'forest' | 'cafe' | 'space-station';
export type AudioType = 'binaural' | 'fire' | 'white-noise' | 'rain' | 'city' | 'forest' | 'cafe' | 'space';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  colors: Record<string, string>;
  fontFamily: string;
  animDuration: number;
  animEasing: string;
  audio: { type: AudioType; label: string };
  swatches: string[];
  pattern: string;
}

export const THEMES: ThemeDef[] = [
  {
    id: 'focus-flow',
    name: 'Focus Flow',
    tagline: 'Clear mind, deep work',
    description: 'Minimalist precision. Every element earns its place.',
    icon: '◎',
    colors: {
      '--background': '#F5F7FF',
      '--foreground': '#1E1B4B',
      '--card': '#FFFFFF',
      '--card-foreground': '#1E1B4B',
      '--primary': '#4F46E5',
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#EEF2FF',
      '--secondary-foreground': '#4338CA',
      '--muted': '#F1F0F9',
      '--muted-foreground': '#6366F1',
      '--accent': '#818CF8',
      '--accent-foreground': '#FFFFFF',
      '--border': 'rgba(99, 102, 241, 0.15)',
      '--ring': '#818CF8',
      '--input-background': '#F1F0F9',
      '--switch-background': '#C7D2FE',
    },
    fontFamily: '"Inter", system-ui, sans-serif',
    animDuration: 200,
    animEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    audio: { type: 'binaural', label: 'Binaural Beats' },
    swatches: ['#4F46E5', '#818CF8', '#EEF2FF', '#F5F7FF'],
    pattern: 'radial-gradient(circle, rgba(99,102,241,0.07) 1px, transparent 1px)',
  },
  {
    id: 'cozy-cabin',
    name: 'Cozy Cabin',
    tagline: 'Warm light, easy pace',
    description: 'Earthy warmth for unhurried creative work.',
    icon: '⬡',
    colors: {
      '--background': '#251510',
      '--foreground': '#F2E4D0',
      '--card': '#352017',
      '--card-foreground': '#F2E4D0',
      '--primary': '#E8894A',
      '--primary-foreground': '#1A0A05',
      '--secondary': '#453020',
      '--secondary-foreground': '#E8C9A0',
      '--muted': '#3A2015',
      '--muted-foreground': '#C4956A',
      '--accent': '#F0A875',
      '--accent-foreground': '#1A0A05',
      '--border': 'rgba(232, 169, 74, 0.18)',
      '--ring': '#E8894A',
      '--input-background': '#3A2015',
      '--switch-background': '#6B3A1F',
    },
    fontFamily: '"Lora", Georgia, serif',
    animDuration: 500,
    animEasing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    audio: { type: 'fire', label: 'Crackling Fire' },
    swatches: ['#E8894A', '#F0A875', '#352017', '#F2E4D0'],
    pattern: 'radial-gradient(ellipse at 30% 30%, rgba(232,137,74,0.08) 0%, transparent 60%)',
  },
  {
    id: 'modern-workspace',
    name: 'Modern Workspace',
    tagline: 'Sharp tools, clear signals',
    description: 'High-contrast precision for technical, data-driven work.',
    icon: '⬛',
    colors: {
      '--background': '#0D1117',
      '--foreground': '#E6EDF3',
      '--card': '#161B22',
      '--card-foreground': '#E6EDF3',
      '--primary': '#58A6FF',
      '--primary-foreground': '#0D1117',
      '--secondary': '#21262D',
      '--secondary-foreground': '#8B949E',
      '--muted': '#1C2129',
      '--muted-foreground': '#6E7681',
      '--accent': '#1F6FEB',
      '--accent-foreground': '#FFFFFF',
      '--border': 'rgba(48, 54, 61, 0.9)',
      '--ring': '#58A6FF',
      '--input-background': '#1C2129',
      '--switch-background': '#30363D',
    },
    fontFamily: '"Space Mono", "Courier New", monospace',
    animDuration: 100,
    animEasing: 'linear',
    audio: { type: 'white-noise', label: 'White Noise' },
    swatches: ['#58A6FF', '#1F6FEB', '#161B22', '#E6EDF3'],
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.018) 2px, rgba(255,255,255,0.018) 4px)',
  },
  {
    id: 'library',
    name: 'Library',
    tagline: 'Deep reading, slow thought',
    description: 'Scholarly calm with unhurried typographic sensibility.',
    icon: '◼',
    colors: {
      '--background': '#F3EDE0',
      '--foreground': '#2D2010',
      '--card': '#FAF6ED',
      '--card-foreground': '#2D2010',
      '--primary': '#5C3A20',
      '--primary-foreground': '#FAF6ED',
      '--secondary': '#E8DFC8',
      '--secondary-foreground': '#5C3A20',
      '--muted': '#EDE5CF',
      '--muted-foreground': '#8B6D4E',
      '--accent': '#7B4E2D',
      '--accent-foreground': '#FAF6ED',
      '--border': 'rgba(92, 58, 32, 0.13)',
      '--ring': '#7B4E2D',
      '--input-background': '#EDE5CF',
      '--switch-background': '#C9B79C',
    },
    fontFamily: '"EB Garamond", Georgia, serif',
    animDuration: 600,
    animEasing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    audio: { type: 'rain', label: 'Gentle Rain' },
    swatches: ['#5C3A20', '#7B4E2D', '#FAF6ED', '#2D2010'],
    pattern: 'radial-gradient(ellipse at top center, rgba(92,58,32,0.05) 0%, transparent 65%)',
  },
  {
    id: 'night-city',
    name: 'Night City',
    tagline: 'Neon pulse, electric focus',
    description: 'Cyberpunk streets and electric intensity for late-night sessions.',
    icon: '⬡',
    colors: {
      '--background': '#08080F',
      '--foreground': '#DDE8FF',
      '--card': '#0E0E1C',
      '--card-foreground': '#DDE8FF',
      '--primary': '#FF2D78',
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#1A1A2E',
      '--secondary-foreground': '#9BA8CC',
      '--muted': '#12122A',
      '--muted-foreground': '#6B7BAE',
      '--accent': '#00E5FF',
      '--accent-foreground': '#000000',
      '--border': 'rgba(255, 45, 120, 0.18)',
      '--ring': '#FF2D78',
      '--input-background': '#12122A',
      '--switch-background': '#2A1A3A',
    },
    fontFamily: '"Space Mono", "Courier New", monospace',
    animDuration: 150,
    animEasing: 'cubic-bezier(0.4, 0, 1, 1)',
    audio: { type: 'city', label: 'City Ambience' },
    swatches: ['#FF2D78', '#00E5FF', '#0E0E1C', '#DDE8FF'],
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,45,120,0.03) 3px, rgba(255,45,120,0.03) 4px)',
  },
  {
    id: 'forest',
    name: 'Forest',
    tagline: 'Rooted, still, alive',
    description: 'Deep woodland calm for focused, unhurried thinking.',
    icon: '◉',
    colors: {
      '--background': '#0F1A10',
      '--foreground': '#D4EDCD',
      '--card': '#152115',
      '--card-foreground': '#D4EDCD',
      '--primary': '#5CBA6A',
      '--primary-foreground': '#071009',
      '--secondary': '#1B2E1A',
      '--secondary-foreground': '#8DB98B',
      '--muted': '#132013',
      '--muted-foreground': '#7AAB77',
      '--accent': '#8FD47B',
      '--accent-foreground': '#071009',
      '--border': 'rgba(92, 186, 106, 0.16)',
      '--ring': '#5CBA6A',
      '--input-background': '#132013',
      '--switch-background': '#2A4A2A',
    },
    fontFamily: '"Lora", Georgia, serif',
    animDuration: 450,
    animEasing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    audio: { type: 'forest', label: 'Forest Sounds' },
    swatches: ['#5CBA6A', '#8FD47B', '#152115', '#D4EDCD'],
    pattern: 'radial-gradient(ellipse at 70% 20%, rgba(92,186,106,0.07) 0%, transparent 55%)',
  },
  {
    id: 'cafe',
    name: 'Cafe',
    tagline: 'Warm cups, good ideas',
    description: 'Cheerful and sociable — the corner table with good light.',
    icon: '◎',
    colors: {
      '--background': '#FDF6EC',
      '--foreground': '#2D1E10',
      '--card': '#FFFAF3',
      '--card-foreground': '#2D1E10',
      '--primary': '#C4692E',
      '--primary-foreground': '#FFF8F0',
      '--secondary': '#F5E8D4',
      '--secondary-foreground': '#8B4513',
      '--muted': '#F0E4CE',
      '--muted-foreground': '#A07040',
      '--accent': '#D4915C',
      '--accent-foreground': '#FFF8F0',
      '--border': 'rgba(180, 120, 60, 0.16)',
      '--ring': '#C4692E',
      '--input-background': '#F0E4CE',
      '--switch-background': '#D4B896',
    },
    fontFamily: '"Nunito", system-ui, sans-serif',
    animDuration: 300,
    animEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    audio: { type: 'cafe', label: 'Cafe Chatter' },
    swatches: ['#C4692E', '#D4915C', '#FDF6EC', '#2D1E10'],
    pattern: 'radial-gradient(circle at 20% 80%, rgba(196,105,46,0.06) 0%, transparent 50%)',
  },
  {
    id: 'space-station',
    name: 'Space Station',
    tagline: 'Vast, quiet, precise',
    description: 'The hum of life support. Infinite focus in infinite space.',
    icon: '◼',
    colors: {
      '--background': '#060B14',
      '--foreground': '#B8D4F0',
      '--card': '#0B1220',
      '--card-foreground': '#B8D4F0',
      '--primary': '#4DC8E8',
      '--primary-foreground': '#020810',
      '--secondary': '#0F1D30',
      '--secondary-foreground': '#5B8AB0',
      '--muted': '#0C1828',
      '--muted-foreground': '#4A7899',
      '--accent': '#1E90D4',
      '--accent-foreground': '#FFFFFF',
      '--border': 'rgba(77, 200, 232, 0.13)',
      '--ring': '#4DC8E8',
      '--input-background': '#0C1828',
      '--switch-background': '#1A3050',
    },
    fontFamily: '"Space Mono", "Courier New", monospace',
    animDuration: 220,
    animEasing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    audio: { type: 'space', label: 'Station Hum' },
    swatches: ['#4DC8E8', '#1E90D4', '#0B1220', '#B8D4F0'],
    pattern: 'radial-gradient(circle at 85% 15%, rgba(77,200,232,0.06) 0%, transparent 40%), radial-gradient(circle at 15% 85%, rgba(30,144,212,0.04) 0%, transparent 35%)',
  },
];

interface ThemeCtxValue {
  theme: ThemeDef;
  setTheme: (id: ThemeId) => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({
  theme: THEMES[0],
  setTheme: () => {},
  audioEnabled: false,
  toggleAudio: () => {},
});

export function useTheme() {
  return useContext(ThemeCtx);
}

export default function App() {
  const [themeId, setThemeId] = useState<ThemeId>('focus-flow');
  const [audioEnabled, setAudioEnabled] = useState(false);

  const theme = THEMES.find(t => t.id === themeId)!;

  return (
    <ThemeCtx.Provider
      value={{
        theme,
        setTheme: setThemeId,
        audioEnabled,
        toggleAudio: () => setAudioEnabled(v => !v),
      }}
    >
      <div
        style={{
          ...(theme.colors as unknown as React.CSSProperties),
          fontFamily: theme.fontFamily,
          backgroundColor: theme.colors['--background'],
          color: theme.colors['--foreground'],
          transition: [
            `background-color ${theme.animDuration}ms ${theme.animEasing}`,
            `color ${theme.animDuration}ms ${theme.animEasing}`,
          ].join(', '),
        }}
        className="size-full flex overflow-hidden"
      >
        <ThemeSidebar />
        <Workspace />
      </div>
    </ThemeCtx.Provider>
  );
}
