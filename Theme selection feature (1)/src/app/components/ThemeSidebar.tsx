import { motion } from 'motion/react';
import { Check, Music, Zap } from 'lucide-react';
import { THEMES, useTheme } from '../App';
import type { ThemeDef } from '../App';

function MiniThemeCard({ theme, isActive, onSelect }: {
  theme: ThemeDef;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.025, y: -1 }}
      whileTap={{ scale: 0.975 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        backgroundColor: theme.colors['--card'],
        borderColor: isActive ? theme.colors['--primary'] : theme.colors['--border'],
        fontFamily: theme.fontFamily,
        boxShadow: isActive
          ? `0 0 0 1px ${theme.colors['--primary']}, 0 4px 12px rgba(0,0,0,0.15)`
          : '0 1px 4px rgba(0,0,0,0.1)',
      }}
      className="w-full text-left rounded-xl border-2 p-3 cursor-pointer relative overflow-hidden"
    >
      {/* Background tint from theme gradient */}
      <div
        style={{ backgroundImage: theme.pattern, backgroundSize: '20px 20px', opacity: 0.6 }}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Swatch row */}
      <div className="flex gap-1 mb-2.5 relative">
        {theme.swatches.map((color, i) => (
          <div
            key={i}
            className="h-2 rounded-full flex-1 transition-all duration-300"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Name + active check */}
      <div className="flex items-center justify-between mb-0.5 relative">
        <span
          style={{
            color: theme.colors['--foreground'],
            fontSize: '0.825rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}
        >
          {theme.name}
        </span>
        {isActive && (
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            style={{
              backgroundColor: theme.colors['--primary'],
              color: theme.colors['--primary-foreground'],
              borderRadius: '50%',
              width: 18,
              height: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Check size={10} strokeWidth={3} />
          </motion.span>
        )}
      </div>

      {/* Tagline */}
      <p
        style={{
          color: theme.colors['--muted-foreground'],
          fontSize: '0.7rem',
          marginBottom: 8,
          lineHeight: 1.4,
        }}
        className="relative"
      >
        {theme.tagline}
      </p>

      {/* Audio + animation meta */}
      <div className="flex items-center gap-3 relative">
        <span
          style={{
            color: theme.colors['--muted-foreground'],
            fontSize: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Music size={9} />
          {theme.audio.label}
        </span>
        <span
          style={{
            color: theme.colors['--muted-foreground'],
            fontSize: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Zap size={9} />
          {theme.animDuration}ms
        </span>
      </div>
    </motion.button>
  );
}

export function ThemeSidebar() {
  const { theme, setTheme } = useTheme();

  return (
    <aside
      style={{
        backgroundColor: theme.colors['--card'],
        borderColor: theme.colors['--border'],
        transition: `background-color ${theme.animDuration}ms ${theme.animEasing}, border-color ${theme.animDuration}ms ${theme.animEasing}`,
        width: 268,
        flexShrink: 0,
      }}
      className="border-r flex flex-col h-full"
    >
      {/* Header */}
      <div
        style={{ borderColor: theme.colors['--border'] }}
        className="px-4 pt-5 pb-4 border-b"
      >
        <p
          style={{
            color: theme.colors['--muted-foreground'],
            fontSize: '0.6rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Environment
        </p>
        <h2
          style={{
            color: theme.colors['--foreground'],
            fontSize: '1.05rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          Browse Themes
        </h2>
        <p style={{ color: theme.colors['--muted-foreground'], fontSize: '0.72rem', marginTop: 3 }}>
          Color, audio &amp; animations change together
        </p>
      </div>

      {/* Theme cards list */}
      <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto">
        {THEMES.map(t => (
          <MiniThemeCard
            key={t.id}
            theme={t}
            isActive={theme.id === t.id}
            onSelect={() => setTheme(t.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          borderColor: theme.colors['--border'],
          color: theme.colors['--muted-foreground'],
          fontSize: '0.65rem',
          transition: `border-color ${theme.animDuration}ms ${theme.animEasing}`,
        }}
        className="px-4 py-3 border-t text-center"
      >
        8 environments · select to apply
      </div>
    </aside>
  );
}
