import { Check, Type, Zap } from "lucide-react";
import { THEMES, THEME_ORDER, type DashTheme, type ThemeId } from "./themes";

// ── Single theme card ──────────────────────────────────────────
function ThemeCard({
  t,
  isActive,
  activeTheme,
  onSelect,
}: {
  t: DashTheme;
  isActive: boolean;
  activeTheme: DashTheme;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={isActive}
      className="rounded-2xl overflow-hidden text-left hover:scale-[1.02] active:scale-[0.99]"
      style={{
        boxShadow: isActive ? `0 0 0 2px ${t.primary}, 0 0 24px ${t.primary}30` : "none",
        transition: activeTheme.transition("transform", "box-shadow"),
      }}
    >
      {/* Visual preview */}
      <div className="h-32 relative overflow-hidden" style={{ background: t.greetingBg }}>
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 70% 30%, ${t.greetingOverlay}, transparent 60%)` }}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: t.pattern, backgroundSize: "20px 20px", opacity: 0.6 }}
        />

        {/* Mini UI mockup inside preview */}
        <div
          className="absolute inset-3 rounded-xl overflow-hidden"
          style={{ background: `${t.card}cc`, border: `1px solid ${t.border}` }}
        >
          <div className="p-3 space-y-2">
            {/* fake header bar */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md" style={{ background: t.primary }} />
              <div className="h-1.5 rounded-full w-14" style={{ background: `${t.foreground}30` }} />
            </div>
            {/* fake progress bar */}
            <div className="h-1 rounded-full overflow-hidden" style={{ background: `${t.foreground}10` }}>
              <div
                className="h-full rounded-full w-2/5"
                style={{ background: `linear-gradient(to right, ${t.primary}, ${t.accent})` }}
              />
            </div>
            {/* fake cards row */}
            <div className="flex gap-1.5 mt-1">
              <div
                className="h-8 flex-1 rounded-lg"
                style={{ background: `${t.primary}20`, border: `1px solid ${t.primary}30` }}
              />
              <div className="h-8 flex-1 rounded-lg" style={{ background: t.overlay(0.06) }} />
              <div className="h-8 flex-1 rounded-lg" style={{ background: t.overlay(0.06) }} />
            </div>
          </div>
        </div>

        {isActive && (
          <div
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: t.primary, color: t.primaryFg }}
          >
            <Check className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Theme info — rendered in the theme's own typeface */}
      <div
        className="p-3.5"
        style={{ background: t.card, borderTop: `1px solid ${t.border}`, fontFamily: t.fontFamily }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base" style={{ color: t.primary }}>{t.emoji}</span>
          <span className="text-sm font-semibold" style={{ color: t.foreground }}>{t.name}</span>
          {isActive && (
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${t.primary}25`, color: t.primary }}
            >
              Active
            </span>
          )}
        </div>

        <p className="text-xs font-medium mb-1.5" style={{ color: t.primary }}>{t.tagline}</p>
        <p className="text-xs leading-relaxed" style={{ color: t.mutedFg }}>{t.desc}</p>

        {/* Palette swatches */}
        <div className="flex gap-1.5 mt-3">
          {t.swatches.map((c, ci) => (
            <div
              key={ci}
              className="w-4 h-4 rounded-full border"
              style={{ background: c, borderColor: `${t.foreground}15` }}
            />
          ))}
        </div>

        {/* Typeface + motion pacing */}
        <div className="flex items-center gap-3 mt-3 pt-2.5" style={{ borderTop: `1px solid ${t.border}` }}>
          <span className="flex items-center gap-1 text-xs" style={{ color: t.mutedFg }}>
            <Type className="w-3 h-3" /> {t.fontLabel}
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: t.mutedFg }}>
            <Zap className="w-3 h-3" /> {t.animDuration}ms
          </span>
        </div>
      </div>
    </button>
  );
}

// ── Themes view ────────────────────────────────────────────────
export function ThemeSelectionView({
  activeThemeId,
  onSelect,
  theme,
}: {
  activeThemeId: ThemeId;
  onSelect: (id: ThemeId) => void;
  theme: DashTheme;
}) {
  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold" style={{ color: theme.foreground }}>Themes</h2>
        <p className="text-sm mt-0.5" style={{ color: theme.mutedFg }}>
          Choose your workspace environment — colours, typeface and pacing change together
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {THEME_ORDER.map(id => (
          <ThemeCard
            key={id}
            t={THEMES[id]}
            isActive={id === activeThemeId}
            activeTheme={theme}
            onSelect={() => onSelect(id)}
          />
        ))}
      </div>

      <p className="text-xs mt-5" style={{ color: theme.mutedFg }}>
        {THEME_ORDER.length} environments · your selection is remembered for next time
      </p>
    </div>
  );
}
