/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback, type ElementType, type SetStateAction } from "react";
import {
  Home, Music2, Waves, BarChart2, Timer, Palette,
  Play, Pause, SkipForward, SkipBack, Volume2,
  Flame, Target, ChevronRight, Check, ArrowRight,
  Clock, TrendingUp, Plus, Upload, X, ListMusic, Library,
} from "lucide-react";
import { ThemeSelectionView } from "./dash/ThemeSelectionView";
import { AudioFilesView } from "./dash/AudioFilesView";
import { PlaylistsView } from "./dash/PlaylistsView";
import { themeCssVars, useThemeSelection, type DashTheme, type ThemeId } from "./dash/themes";
import { getDefaultPlaylist, listPlaylists, listAudioFiles, type AudioFile, type Playlist, type FocusSession, updateSessionStatus, createSession } from "./lib/api";
import { isBackendConfigured } from "./lib/amplify";
import { updateAccount, type AccountRecord } from "./lib/accounts";
import { ambientAudio, DEFAULT_TRACK, releaseAmbientMusic } from "./lib/ambientMusic";

// ── Types ──────────────────────────────────────────────────────
type Nav = "home" | "focus" | "music" | "audio" | "playlists" | "sounds" | "analytics" | "themes";
type FocusPhase = "idle" | "setup" | "review" | "active" | "complete";
type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

interface FocusConfig {
  duration: number;
  objective: string;
  task: string;
  audio?: {
    id: string;
    name: string;
    type: "playlist" | "track";
  };
}

interface SessionErrors {
  duration?: string;
  objective?: string;
  task?: string;
}

interface Task {
  id: number;
  text: string;
  done: boolean;
}

interface Track {
  id: string;
  name: string;
  url: string;
  duration: number;
  size: string;
}

// ── Helpers ────────────────────────────────────────────────────
function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function fmt(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function fmtDuration(s: number): string {
  if (!s || !isFinite(s)) return "--:--";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

function fmtBytes(b: number): string {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** What the dashboard tracks the day against until daily goals are settable. */
const DAILY_GOAL_LABEL = "4 hours a day";
const DAILY_GOAL_MINUTES = 240;

function fmtGoalShort(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function generateHeatmap(): number[][] {
  return Array.from({ length: 7 }, () =>
    Array.from({ length: 26 }, () => {
      const r = Math.random();
      return r < 0.35 ? 0 : r < 0.55 ? 1 : r < 0.72 ? 2 : r < 0.88 ? 3 : 4;
    })
  );
}

// ── Static Data ────────────────────────────────────────────────
const TOD = {
  morning: { icon: "☀️", label: "Morning", quote: "The secret of getting ahead is getting started." },
  afternoon: { icon: "⛅", label: "Afternoon", quote: "Focus is not about saying yes. It's about saying no." },
  evening: { icon: "🌆", label: "Evening", quote: "End your day knowing you gave it everything." },
  night: { icon: "🌙", label: "Night", quote: "Late nights, big dreams." },
};

const RECOMMENDED = [
  { emoji: "☕", title: "Morning Coffee", desc: "Easy wake-up beats", plays: "142K" },
  { emoji: "💻", title: "Programming Flow", desc: "Deep code sessions", plays: "891K" },
  { emoji: "📚", title: "Reading Session", desc: "Calm focus music", plays: "234K" },
  { emoji: "🌧", title: "Rainy Focus", desc: "Rain + ambient mix", plays: "567K" },
  { emoji: "🧠", title: "Deep Concentration", desc: "Binaural + lo-fi", plays: "1.2M" },
];

const MUSIC_CATS: Record<string, { emoji: string; title: string; desc: string; tracks: string }[]> = {
  Programming: [
    { emoji: "⚡", title: "Frontend Flow", desc: "React & UI focus", tracks: "94 tracks" },
    { emoji: "🔧", title: "Backend Grind", desc: "APIs & databases", tracks: "76 tracks" },
    { emoji: "🧮", title: "Algorithm Mode", desc: "DSA deep work", tracks: "58 tracks" },
    { emoji: "🎨", title: "UI Design", desc: "Visual creative work", tracks: "62 tracks" },
    { emoji: "🐛", title: "Debug Session", desc: "Patient problem-solving", tracks: "45 tracks" },
    { emoji: "🚀", title: "Sprint Mode", desc: "High-velocity coding", tracks: "81 tracks" },
  ],
  Writing: [
    { emoji: "✍️", title: "Creative Writing", desc: "Narrative flow", tracks: "67 tracks" },
    { emoji: "📄", title: "Research Papers", desc: "Academic focus", tracks: "53 tracks" },
    { emoji: "📖", title: "Journaling", desc: "Reflective calm", tracks: "41 tracks" },
    { emoji: "📝", title: "Essay Work", desc: "Structured thought", tracks: "48 tracks" },
  ],
  Reading: [
    { emoji: "📗", title: "Light Reading", desc: "Easy fiction vibes", tracks: "72 tracks" },
    { emoji: "📘", title: "Textbooks", desc: "Dense material focus", tracks: "58 tracks" },
    { emoji: "📕", title: "Novels", desc: "Story immersion", tracks: "63 tracks" },
    { emoji: "🔬", title: "Science", desc: "Technical study", tracks: "49 tracks" },
  ],
  Relaxation: [
    { emoji: "😴", title: "Sleep", desc: "Drift off slowly", tracks: "31 tracks" },
    { emoji: "🧘", title: "Meditation", desc: "Mindful silence", tracks: "28 tracks" },
    { emoji: "🤸", title: "Stretching", desc: "Light movement", tracks: "22 tracks" },
    { emoji: "☕", title: "Break Time", desc: "Reset and recharge", tracks: "39 tracks" },
  ],
};

const SOUNDS_DATA = [
  { id: "rain", name: "Rain", emoji: "🌧", color: "#6eb5ff", default: 40 },
  { id: "fireplace", name: "Fireplace", emoji: "🔥", color: "#ff8f4e", default: 20 },
  { id: "cafe", name: "Café", emoji: "☕", color: "#c49a6c", default: 60 },
  { id: "wind", name: "Wind", emoji: "💨", color: "#a8d8ea", default: 10 },
  { id: "ocean", name: "Ocean", emoji: "🌊", color: "#4ecdc4", default: 0 },
  { id: "forest", name: "Forest", emoji: "🌲", color: "#6bcb77", default: 0 },
  { id: "thunder", name: "Thunder", emoji: "⚡", color: "#9d7fe3", default: 0 },
  { id: "birds", name: "Birds", emoji: "🐦", color: "#ffdb70", default: 0 },
];

const PRESETS = [
  { name: "My Cozy Room", desc: "Rain · Café · Fireplace", emoji: "🏠" },
  { name: "Forest Morning", desc: "Forest · Birds · Wind", emoji: "🌲" },
  { name: "Study Hall", desc: "Café · Wind", emoji: "📚" },
];

const ACHIEVEMENTS = [
  { icon: "🌅", name: "Early Bird", desc: "Focused before 8 AM for 7 days", earned: true },
  { icon: "🧠", name: "Deep Thinker", desc: "100 hours of focused work", earned: true },
  { icon: "🌙", name: "Night Owl", desc: "Focused after midnight", earned: true },
  { icon: "🔥", name: "On Fire", desc: "30-day streak achieved", earned: false },
  { icon: "⚡", name: "Speed Runner", desc: "10 sessions in one day", earned: false },
  { icon: "🎯", name: "Precision", desc: "50 sessions without skipping", earned: false },
];

const INIT_TASKS: Task[] = [
  { id: 1, text: "Finish Assignment", done: true },
  { id: 2, text: "Read Chapter 4", done: false },
  { id: 3, text: "Practice React", done: false },
  { id: 4, text: "Study Math", done: false },
];

const HEATMAP = generateHeatmap();

/** An audio file from the Audio Files page, as a playable track. */
const cloudTrack = (file: AudioFile): Track => ({
  id: `cloud:${file.id}`,
  name: file.name,
  url: file.playUrl ?? "",
  duration: 0,
  size: fmtBytes(file.sizeBytes),
});

/** The tracks of a saved playlist, in the order the designer chose them. */
const playlistTracks = (playlist: Playlist): Track[] =>
  playlist.tracks
    .filter(track => track.playUrl)
    .map(track => ({ id: `cloud:${track.id}`, name: track.name, url: track.playUrl, duration: 0, size: "" }));

// ── Sidebar ────────────────────────────────────────────────────
function Sidebar({
  active, onNav, theme, name, goalLabel, progressPct, onSignOut,
}: {
  active: Nav;
  onNav: (n: Nav) => void;
  theme: DashTheme;
  name: string;
  goalLabel: string;
  progressPct: number;
  onSignOut: () => void;
}) {
  const items: { id: Nav; icon: ElementType; label: string }[] = [
    { id: "home", icon: Home, label: "Home" },
    { id: "focus", icon: Timer, label: "Focus" },
    { id: "music", icon: Music2, label: "Music" },
    { id: "audio", icon: Library, label: "Audio Files" },
    { id: "playlists", icon: ListMusic, label: "Playlists" },
    { id: "sounds", icon: Waves, label: "Sounds" },
    { id: "analytics", icon: BarChart2, label: "Analytics" },
    { id: "themes", icon: Palette, label: "Themes" },
  ];

  return (
    <aside
      className="w-56 flex flex-col border-r py-5 shrink-0 h-full"
      style={{ background: theme.sidebar, borderColor: theme.border }}
    >
      <div className="px-5 mb-7">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: theme.primary }}>
            <Timer className="w-4 h-4" style={{ color: theme.primaryFg }} />
          </div>
          <span className="font-display font-bold text-sm tracking-tight" style={{ color: theme.foreground }}>FocusFlow</span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {items.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left"
              style={{
                background: isActive ? `${theme.primary}20` : undefined,
                color: isActive ? theme.primary : theme.mutedFg,
              }}
              onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = theme.foreground; (e.currentTarget as HTMLElement).style.background = theme.overlay(0.05); } }}
              onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.color = theme.mutedFg; (e.currentTarget as HTMLElement).style.background = ""; } }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mb-3 mt-4">
        <div className="rounded-xl p-3" style={{ background: theme.overlay(0.03), border: `1px solid ${theme.border}` }}>
          <p className="text-xs mb-1" style={{ color: theme.mutedFg }}>Daily Goal</p>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: `linear-gradient(to right, ${theme.primary}, ${theme.accent})` }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: theme.mutedFg }}>
            1h 15m <span style={{ color: `${theme.foreground}60` }}>/ {goalLabel}</span>
          </p>
        </div>
      </div>

      <div className="px-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`, color: theme.primaryFg }}
          >
            {name[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: theme.foreground }}>{name}</p>
            <p className="text-xs" style={{ color: theme.mutedFg }}>Score: 89 · 🔥 12</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="mt-3 w-full text-xs text-left transition-colors"
          style={{ color: theme.mutedFg }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.foreground; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = theme.mutedFg; }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ── Now Playing ────────────────────────────────────────────────
/**
 * What the customer is hearing right now. It is the first thing on the home page so a
 * new arrival can see the ambience that greeted them and what is coming next.
 */
function NowPlayingCard({
  theme,
  queueName,
  playlist,
  currentTrackIdx,
  isPlaying,
}: {
  theme: DashTheme;
  queueName: string | null;
  playlist: Track[];
  currentTrackIdx: number | null;
  isPlaying: boolean;
}) {
  return (
    <section
      aria-label="Now playing"
      className="rounded-2xl p-5"
      style={{ background: theme.card, border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-center justify-between mb-3 gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: theme.mutedFg }}>
            Now Playing
          </p>
          <h3 className="text-lg font-semibold font-display truncate" style={{ color: theme.foreground }}>
            {queueName ?? "Your library"}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: theme.mutedFg }}>
            <span>{isPlaying ? "Playing" : "Paused"}</span> ·{" "}
            {playlist.length} {playlist.length === 1 ? "track" : "tracks"}
          </p>
        </div>
        {isPlaying && <NowPlayingBars color={theme.primary} />}
      </div>

      <ul className="space-y-1" aria-label="Now playing tracks">
        {playlist.map((track, idx) => {
          const isActive = currentTrackIdx === idx;
          return (
            <li
              key={track.id}
              className="flex items-center gap-2.5 text-sm truncate"
              style={{ color: isActive ? theme.primary : theme.mutedFg }}
            >
              <span className="text-xs font-data w-5 shrink-0" style={{ color: theme.mutedFg }}>
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="truncate">{track.name}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ── Home View ──────────────────────────────────────────────────
function HomeView({
  onStartFocus,
  tasks,
  onToggleTask,
  theme,
  queueName,
  playlist,
  currentTrackIdx,
  isPlaying,
  name,
  goalLabel,
  progressPct,
  remainingLabel,
}: {
  onStartFocus: () => void;
  tasks: Task[];
  onToggleTask: (id: number) => void;
  theme: DashTheme;
  queueName: string | null;
  playlist: Track[];
  currentTrackIdx: number | null;
  isPlaying: boolean;
  name: string;
  goalLabel: string;
  progressPct: number;
  remainingLabel: string;
}) {
  const tod = getTimeOfDay();
  const cfg = TOD[tod];
  const day = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      {/* Greeting */}
      <div
        className="relative rounded-2xl p-8 overflow-hidden"
        style={{ background: theme.greetingBg, border: `1px solid ${theme.border}` }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at top right, ${theme.greetingOverlay}, transparent 60%)` }}
        />
        <div className="relative flex items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest font-data mb-2" style={{ color: `${theme.foreground}40` }}>{day}</p>
            <h1 className="font-display text-3xl font-bold mb-2" style={{ color: theme.foreground }}>
              {cfg.icon} {cfg.label} vibes, {name}.
            </h1>
            <p className="text-sm italic max-w-sm" style={{ color: `${theme.foreground}50` }}>"{cfg.quote}"</p>
          </div>
          <button
            onClick={onStartFocus}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 shrink-0 mt-1"
            style={{ background: theme.accent, color: theme.accentFg }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
          >
            Start Session <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Now Playing — the ambience a new arrival is already hearing */}
      {playlist.length > 0 && (
        <NowPlayingCard
          theme={theme}
          queueName={queueName}
          playlist={playlist}
          currentTrackIdx={currentTrackIdx}
          isPlaying={isPlaying}
        />
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className="col-span-2 rounded-2xl p-5"
          style={{ background: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: theme.mutedFg }}>Today's Goal</p>
              <h3 className="text-lg font-semibold font-display" style={{ color: theme.foreground }}>Focus: {goalLabel}</h3>
            </div>
            <Target className="w-5 h-5 opacity-40" style={{ color: theme.primary }} />
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1.5" style={{ color: theme.mutedFg }}>
              <span>Completed: 1h 15m</span><span>{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: `linear-gradient(to right, ${theme.primary}, ${theme.accent})` }} />
            </div>
          </div>
          <div className="flex gap-8 text-sm">
            {[["Remaining", remainingLabel], ["Sessions Today", "3 / 8"], ["Best Time", "9 AM"]].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs mb-0.5" style={{ color: theme.mutedFg }}>{label}</p>
                <p className="font-semibold font-data" style={{ color: theme.foreground }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-5 flex flex-col" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider" style={{ color: theme.mutedFg }}>Current Streak</p>
            <Flame className="w-4 h-4" style={{ color: theme.accent }} />
          </div>
          <div className="flex-1">
            <p className="text-5xl font-bold font-data leading-none mt-1" style={{ color: theme.foreground }}>12</p>
            <p className="text-sm mt-1.5" style={{ color: theme.mutedFg }}>days in a row</p>
            <p className="text-xs mt-0.5 opacity-50" style={{ color: theme.mutedFg }}>Longest: 37 days</p>
          </div>
          <div className="flex gap-1 mt-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i < 5 ? theme.accent : theme.overlay(0.08) }} />
            ))}
          </div>
        </div>
      </div>

      {/* Recommended + Tasks */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-display" style={{ color: theme.foreground }}>Recommended for You</h3>
            <button className="text-xs transition-colors" style={{ color: theme.primary }}>See all</button>
          </div>
          <div className="space-y-1">
            {RECOMMENDED.map((p, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left group transition-colors duration-150"
                style={{}}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = theme.overlay(0.04); }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <span className="text-xl w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: theme.overlay(0.05) }}>
                  {p.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: theme.foreground }}>{p.title}</p>
                  <p className="text-xs" style={{ color: theme.mutedFg }}>{p.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-data" style={{ color: theme.mutedFg }}>{p.plays}</span>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center transition-colors" style={{ background: theme.overlay(0.05) }}>
                    <Play className="w-3 h-3 fill-current" style={{ color: theme.mutedFg }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2 rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-display" style={{ color: theme.foreground }}>Today's Tasks</h3>
            <span className="text-xs font-data" style={{ color: theme.mutedFg }}>
              {tasks.filter(t => t.done).length}/{tasks.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {tasks.map(task => (
              <button
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className="w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = theme.overlay(0.04); }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <div
                  className="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all duration-150"
                  style={{
                    background: task.done ? theme.primary : "transparent",
                    borderColor: task.done ? theme.primary : theme.overlay(0.18),
                  }}
                >
                  {task.done && <Check className="w-3 h-3" style={{ color: theme.primaryFg }} />}
                </div>
                <span
                  className="text-sm transition-colors"
                  style={{ color: task.done ? `${theme.mutedFg}80` : theme.foreground, textDecoration: task.done ? "line-through" : "none" }}
                >
                  {task.text}
                </span>
              </button>
            ))}
          </div>
          <button
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs transition-all"
            style={{ border: `1px dashed ${theme.border}`, color: theme.mutedFg }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = theme.foreground; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = theme.mutedFg; }}
          >
            <Plus className="w-3 h-3" /> Add task
          </button>
        </div>
      </div>

      {/* Weekly Bar Chart */}
      <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold font-display" style={{ color: theme.foreground }}>Weekly Progress</h3>
          <span className="text-xs" style={{ color: theme.mutedFg }}>This week</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => {
            const h = [2.5, 3.1, 1.8, 4.2, 0.9, 0, 0][i];
            const maxH = 4.5;
            return (
              <div key={d} className="flex flex-col items-center gap-2">
                <div className="w-full flex items-end" style={{ height: 64 }}>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: h > 0 ? `${(h / maxH) * 100}%` : "8%",
                      background: i === 3 ? theme.primary : h > 0 ? `${theme.primary}35` : theme.overlay(0.05),
                    }}
                  />
                </div>
                <span className="text-xs" style={{ color: theme.mutedFg }}>{d}</span>
                <span className="text-xs font-data opacity-50" style={{ color: theme.mutedFg }}>{h > 0 ? `${h}h` : "—"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Focus Setup ────────────────────────────────────────────────
function FocusSetupView({
  onContinue,
  theme,
}: {
  onContinue: (config: FocusConfig) => void;
  theme: DashTheme;
}) {
  const [duration, setDuration] = useState<number | undefined>();
  const [customSelected, setCustomSelected] = useState(false);
  const [customDuration, setCustomDuration] = useState("");

  const [objective, setObjective] = useState("");
  const [task, setTask] = useState("");

  const [errors, setErrors] = useState<SessionErrors>({});

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);

  const [selectedAudio, setSelectedAudio] =
    useState<FocusConfig["audio"]>();

  const durations = [25, 45, 60, 90];

  useEffect(() => {
    async function loadAudioOptions() {
      if (!isBackendConfigured) return;

      try {
        const [playlistResults, audioResults] = await Promise.all([
          listPlaylists(),
          listAudioFiles(),
        ]);

        setPlaylists(playlistResults);
        setAudioFiles(audioResults);
      } catch (error) {
        console.error("Could not load session audio:", error);
      }
    }

    void loadAudioOptions();
  }, []);

  function choosePresetDuration(minutes: number) {
    setDuration(minutes);
    setCustomSelected(false);
    setCustomDuration("");

    setErrors(prev => ({
      ...prev,
      duration: undefined,
    }));
  }

  function chooseCustom() {
    setDuration(undefined);
    setCustomSelected(true);

    setErrors(prev => ({
      ...prev,
      duration: undefined,
    }));
  }

  function handleContinue() {
    let finalDuration: number | undefined = duration;

    if (customSelected) {
      const minutes = Number(customDuration);

      if (
        customDuration.trim() &&
        Number.isFinite(minutes) &&
        Number.isInteger(minutes) &&
        minutes > 0
      ) {
        finalDuration = minutes;
      } else {
        finalDuration = undefined;
      }
    }

    const nextErrors: SessionErrors = {};

    if (finalDuration === undefined) {
      nextErrors.duration = "Choose a valid session length.";
    }

    if (!objective.trim()) {
      nextErrors.objective = "Enter an objective for this session.";
    }

    if (!task.trim()) {
      nextErrors.task = "Enter a task for this session.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // Explicit guard so TypeScript knows this is definitely a number.
    if (finalDuration === undefined) {
      return;
    }

    setErrors({});

    const config: FocusConfig = {
      duration: finalDuration,
      objective: objective.trim(),
      task: task.trim(),
    };

    if (selectedAudio) {
      config.audio = selectedAudio;
    }

    onContinue(config);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2
          className="font-display text-2xl font-bold mb-1"
          style={{ color: theme.foreground }}
        >
          New Focus Session
        </h2>

        <p
          className="text-sm"
          style={{ color: theme.mutedFg }}
        >
          Choose your session length and define what you want to accomplish.
        </p>
      </div>

      <div className="space-y-7">

        {/* Duration */}
        <div>
          <label
            className="text-xs uppercase tracking-wider block mb-3"
            style={{ color: theme.mutedFg }}
          >
            Duration
            <span
              className="ml-1"
              style={{ color: theme.accent }}
            >
              *
            </span>
          </label>

          <div className="flex gap-2">
            {durations.map(minutes => (
              <button
                key={minutes}
                type="button"
                onClick={() => choosePresetDuration(minutes)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background:
                    duration === minutes && !customSelected
                      ? `${theme.primary}20`
                      : "transparent",
                  border: `1px solid ${duration === minutes && !customSelected
                      ? theme.primary
                      : theme.border
                    }`,
                  color:
                    duration === minutes && !customSelected
                      ? theme.primary
                      : theme.mutedFg,
                }}
              >
                {minutes}m
              </button>
            ))}

            <button
              type="button"
              onClick={chooseCustom}
              className="px-4 py-3 rounded-xl text-sm font-medium"
              style={{
                border: `1px solid ${customSelected ? theme.primary : theme.border
                  }`,
                color: customSelected
                  ? theme.primary
                  : theme.mutedFg,
              }}
            >
              Custom
            </button>
          </div>

          {customSelected && (
            <div className="mt-3">
              <input
                type="number"
                min="1"
                step="1"
                value={customDuration}
                onChange={e => {
                  setCustomDuration(e.target.value);

                  setErrors(prev => ({
                    ...prev,
                    duration: undefined,
                  }));
                }}
                placeholder="Enter minutes"
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{
                  background: theme.card,
                  border: `1px solid ${errors.duration ? "#ef4444" : theme.border
                    }`,
                  color: theme.foreground,
                }}
                aria-invalid={Boolean(errors.duration)}
              />
            </div>
          )}

          {errors.duration && (
            <p
              className="mt-2 text-sm"
              style={{ color: "#ef4444" }}
              role="alert"
            >
              {errors.duration}
            </p>
          )}
        </div>

        {/* Objective */}
        <div>
          <label
            htmlFor="session-objective"
            className="text-xs uppercase tracking-wider block mb-3"
            style={{ color: theme.mutedFg }}
          >
            Objective
            <span
              className="ml-1"
              style={{ color: theme.accent }}
            >
              *
            </span>
          </label>

          <textarea
            id="session-objective"
            value={objective}
            onChange={e => {
              setObjective(e.target.value);

              setErrors(prev => ({
                ...prev,
                objective: undefined,
              }));
            }}
            placeholder="What do you want to accomplish?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl outline-none resize-none"
            style={{
              background: theme.card,
              border: `1px solid ${errors.objective ? "#ef4444" : theme.border
                }`,
              color: theme.foreground,
            }}
            aria-invalid={Boolean(errors.objective)}
            aria-describedby={
              errors.objective
                ? "session-objective-error"
                : undefined
            }
          />

          {errors.objective && (
            <p
              id="session-objective-error"
              className="mt-2 text-sm"
              style={{ color: "#ef4444" }}
              role="alert"
            >
              {errors.objective}
            </p>
          )}
        </div>

        {/* Task */}
        <div>
          <label
            htmlFor="session-task"
            className="text-xs uppercase tracking-wider block mb-3"
            style={{ color: theme.mutedFg }}
          >
            Task
            <span
              className="ml-1"
              style={{ color: theme.accent }}
            >
              *
            </span>
          </label>

          <input
            id="session-task"
            type="text"
            value={task}
            onChange={e => {
              setTask(e.target.value);

              setErrors(prev => ({
                ...prev,
                task: undefined,
              }));
            }}
            placeholder="What are you working on?"
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{
              background: theme.card,
              border: `1px solid ${errors.task ? "#ef4444" : theme.border
                }`,
              color: theme.foreground,
            }}
            aria-invalid={Boolean(errors.task)}
            aria-describedby={
              errors.task
                ? "session-task-error"
                : undefined
            }
          />

          {errors.task && (
            <p
              id="session-task-error"
              className="mt-2 text-sm"
              style={{ color: "#ef4444" }}
              role="alert"
            >
              {errors.task}
            </p>
          )}
        </div>

        {/* Background Audio */}
        <div>
          <label
            className="text-xs uppercase tracking-wider block mb-3"
            style={{ color: theme.mutedFg }}
          >
            Background Audio
            <span className="normal-case ml-2">
              (optional)
            </span>
          </label>

          <div className="space-y-3">

            <button
              type="button"
              onClick={() => setSelectedAudio(undefined)}
              className="w-full text-left px-4 py-3 rounded-xl"
              style={{
                border: `1px solid ${!selectedAudio
                    ? theme.primary
                    : theme.border
                  }`,
                color: !selectedAudio
                  ? theme.primary
                  : theme.foreground,
              }}
            >
              No background audio
            </button>

            {playlists.length > 0 && (
              <div>
                <p
                  className="text-xs mb-2"
                  style={{ color: theme.mutedFg }}
                >
                  Playlists
                </p>

                <div className="space-y-2">
                  {playlists.map(playlist => {
                    const selected =
                      selectedAudio?.type === "playlist" &&
                      selectedAudio.id === playlist.id;

                    return (
                      <button
                        key={playlist.id}
                        type="button"
                        onClick={() =>
                          setSelectedAudio({
                            id: playlist.id,
                            name: playlist.name,
                            type: "playlist",
                          })
                        }
                        className="w-full text-left px-4 py-3 rounded-xl"
                        style={{
                          background: selected
                            ? `${theme.primary}15`
                            : "transparent",
                          border: `1px solid ${selected
                              ? theme.primary
                              : theme.border
                            }`,
                          color: theme.foreground,
                        }}
                      >
                        🎵 {playlist.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {audioFiles.length > 0 && (
              <div>
                <p
                  className="text-xs mb-2"
                  style={{ color: theme.mutedFg }}
                >
                  Individual Tracks
                </p>

                <div className="space-y-2">
                  {audioFiles.map(track => {
                    const selected =
                      selectedAudio?.type === "track" &&
                      selectedAudio.id === track.id;

                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() =>
                          setSelectedAudio({
                            id: track.id,
                            name: track.name,
                            type: "track",
                          })
                        }
                        className="w-full text-left px-4 py-3 rounded-xl"
                        style={{
                          background: selected
                            ? `${theme.accent}15`
                            : "transparent",
                          border: `1px solid ${selected
                              ? theme.accent
                              : theme.border
                            }`,
                          color: theme.foreground,
                        }}
                      >
                        🎧 {track.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-4 font-bold text-base rounded-xl"
          style={{
            background: theme.accent,
            color: theme.accentFg,
          }}
        >
          Review Session →
        </button>
      </div>
    </div>
  );
}

// ── Review Session ─────────────────────────────────────────────
function ReviewItem({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: DashTheme;
}) {
  return (
    <div>
      <p
        className="text-xs uppercase tracking-wider mb-1"
        style={{ color: theme.mutedFg }}
      >
        {label}
      </p>

      <p
        className="font-medium"
        style={{ color: theme.foreground }}
      >
        {value}
      </p>
    </div>
  );
}

function SessionReviewView({
  config,
  onBack,
  onStart,
  theme,
}: {
  config: FocusConfig;
  onBack: () => void;
  onStart: () => void;
  theme: DashTheme;
}) {


  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2
          className="font-display text-2xl font-bold mb-1"
          style={{ color: theme.foreground }}
        >
          Review Session
        </h2>

        <p
          className="text-sm"
          style={{ color: theme.mutedFg }}
        >
          Make sure everything looks right before you start.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 space-y-5"
        style={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
        }}
      >

        <ReviewItem
          label="Duration"
          value={`${config.duration} minutes`}
          theme={theme}
        />



        <ReviewItem
          label="Task"
          value={config.task}
          theme={theme}
        />


        <ReviewItem
          label="Objective"
          value={config.objective}
          theme={theme}
        />


        {config.audio && (
          <ReviewItem
            label="Background Audio"
            value={`${config.audio.name} ${config.audio.type === "playlist"
                ? "(Playlist)"
                : "(Track)"
              }`}
            theme={theme}
          />
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl font-medium"
          style={{
            border: `1px solid ${theme.border}`,
            color: theme.foreground,
          }}
        >
          Back
        </button>

        <button
          type="button"
          onClick={onStart}
          className="px-6 py-3 rounded-xl font-semibold"
          style={{
            background: theme.primary,
            color: theme.primaryFg,
          }}
        >
          Start Session
        </button>
      </div>
    </div>
  );
}


// ── Active Session ─────────────────────────────────────────────
function ActiveSessionView({
  config,
  secondsLeft,
  totalSeconds,
  isPaused,
  onPause,
  onResume,
  onEnd,
  theme,
}: {
  config: FocusConfig;
  secondsLeft: number;
  totalSeconds: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  theme: DashTheme;
}) {
  const r = 90;
  const circ = 2 * Math.PI * r;
  const filledArc = circ * (secondsLeft / totalSeconds);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-8 py-12">
      <p
        className="text-xs uppercase tracking-widest mb-10 font-data"
        style={{ color: theme.mutedFg }}
      >
        {config.task}
      </p>

      <div className="relative mb-10">
        <svg width="224" height="224" className="-rotate-90">
          <circle cx="112" cy="112" r={r} fill="none" stroke={theme.overlay(0.04)} strokeWidth="6" />
          <circle
            cx="112" cy="112" r={r} fill="none"
            stroke={theme.primary} strokeWidth="6"
            strokeDasharray={`${filledArc} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold tracking-tight font-data" style={{ color: theme.foreground }}>{fmt(secondsLeft)}</span>
          <span
            className="text-xs mt-2"
            style={{
              color: isPaused ? theme.accent : theme.mutedFg,
            }}
          >
            {isPaused ? "paused" : "remaining"}
          </span>
        </div>
      </div>


      <div className="flex gap-2.5 mb-14 flex-wrap justify-center">
        {config.audio && (
          <span
            className="px-3.5 py-1.5 rounded-full text-xs"
            style={{
              background: theme.overlay(0.04),
              border: `1px solid ${theme.overlay(0.07)}`,
              color: theme.mutedFg,
            }}
          >
            🎵 {config.audio.name}
          </span>
        )}

        {config.objective && (
          <span
            className="px-3.5 py-1.5 rounded-full text-xs"
            style={{
              background: theme.overlay(0.04),
              border: `1px solid ${theme.overlay(0.07)}`,
              color: theme.mutedFg,
            }}
          >
            🎯 {config.objective}
          </span>
        )}

        <span
          className="px-3.5 py-1.5 rounded-full text-xs"
          style={{
            background: theme.overlay(0.04),
            border: `1px solid ${theme.overlay(0.07)}`,
            color: "#4ade80",
          }}
        >
          🔔 Notifications Off
        </span>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={isPaused ? onResume : onPause}
          className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: theme.primary,
            color: theme.primaryFg,
          }}
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4" />
              Resume Session
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              Pause Session
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onEnd}
          className="px-8 py-3 rounded-xl text-sm font-medium transition-all"
          style={{
            border: `1px solid ${theme.border}`,
            color: theme.mutedFg,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = theme.foreground;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = theme.mutedFg;
          }}
        >
          End Session
        </button>
      </div>
    </div>
  );
}

// ── Session Complete ───────────────────────────────────────────
function SessionCompleteView({ config, onDone, theme }: { config: FocusConfig; onDone: () => void; theme: DashTheme }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-8 py-12 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: theme.foreground }}>Session Complete!</h2>
      <p
        className="mb-8 max-w-xs text-sm"
        style={{ color: theme.mutedFg }}
      >
        You focused for{" "}
        <span
          className="font-semibold"
          style={{ color: theme.primary }}
        >
          {config.duration} minutes
        </span>{" "}
        working on {config.task}.
      </p>
      <div
        className="flex gap-6 rounded-2xl px-10 py-6 mb-8"
        style={{ background: theme.card, border: `1px solid ${theme.border}` }}
      >
        {[["Focused", `${config.duration}m`], ["Streak Day", "+1"], ["Total Hours", "413h"]].map(([label, val], i, arr) => (
          <div key={label} className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold font-data" style={{ color: theme.foreground }}>{val}</p>
              <p className="text-xs mt-1" style={{ color: theme.mutedFg }}>{label}</p>
            </div>
            {i < arr.length - 1 && <div className="w-px h-10" style={{ background: theme.border }} />}
          </div>
        ))}
      </div>
      <button
        onClick={onDone}
        className="px-8 py-3 font-semibold rounded-xl transition-opacity"
        style={{ background: theme.primary, color: theme.primaryFg }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

// ── Now Playing Bars ───────────────────────────────────────────
function NowPlayingBars({ color }: { color: string }) {
  return (
    <>
      <style>{`
        @keyframes ff-bar {
          0%,100%{transform:scaleY(.25)}
          50%{transform:scaleY(1)}
        }
      `}</style>
      <div className="flex items-end gap-px h-3.5">
        {[0, 180, 90].map(d => (
          <div
            key={d}
            className="w-0.5 h-full rounded-full origin-bottom"
            style={{ background: color, animation: `ff-bar 0.75s ease-in-out ${d}ms infinite` }}
          />
        ))}
      </div>
    </>
  );
}

// ── Library View ────────────────────────────────────────────────
interface LibraryViewProps {
  theme: DashTheme;
  playlist: Track[];
  currentTrackIdx: number | null;
  isPlaying: boolean;
  onSelectTrack: (idx: number) => void;
  onAddTracks: (files: FileList) => void;
  onRemoveTrack: (id: string) => void;
}

function LibraryView({
  theme, playlist, currentTrackIdx, isPlaying,
  onSelectTrack, onAddTracks, onRemoveTrack,
}: LibraryViewProps) {
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) onAddTracks(e.dataTransfer.files);
  };

  const hasTrack = playlist.length > 0;

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        className="rounded-2xl transition-all duration-150 cursor-pointer"
        style={{
          border: `2px dashed ${dragging ? theme.primary : theme.border}`,
          background: dragging ? `${theme.primary}08` : "transparent",
          padding: hasTrack ? "16px 20px" : "40px 20px",
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files) { onAddTracks(e.target.files); e.target.value = ""; } }}
        />
        {hasTrack ? (
          <div className="flex items-center gap-3">
            <Upload className="w-4 h-4 shrink-0" style={{ color: theme.mutedFg }} />
            <span className="text-sm" style={{ color: theme.mutedFg }}>
              Drop more files or <span style={{ color: theme.primary }}>browse</span> — MP3, M4A, WAV, FLAC
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${theme.primary}15` }}>
              <Upload className="w-6 h-6" style={{ color: theme.primary }} />
            </div>
            <div>
              <p className="font-semibold font-display" style={{ color: theme.foreground }}>Drop audio files here</p>
              <p className="text-sm mt-1" style={{ color: theme.mutedFg }}>
                or <span style={{ color: theme.primary }}>browse your files</span>
              </p>
              <p className="text-xs mt-2 opacity-50" style={{ color: theme.mutedFg }}>MP3 · M4A · WAV · FLAC · OGG</p>
            </div>
          </div>
        )}
      </div>

      {/* Track list */}
      {hasTrack && (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${theme.border}` }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: `${theme.card}cc`, borderBottom: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-2">
              <ListMusic className="w-4 h-4" style={{ color: theme.mutedFg }} />
              <span className="text-sm font-medium" style={{ color: theme.foreground }}>
                {playlist.length} {playlist.length === 1 ? "track" : "tracks"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: theme.mutedFg }}>
                {fmtDuration(playlist.reduce((sum, t) => sum + t.duration, 0))} total
              </span>
            </div>
          </div>

          <div className="divide-y" style={{ divideColor: theme.border } as React.CSSProperties}>
            {playlist.map((track, idx) => {
              const isActive = currentTrackIdx === idx;
              const isThisPlaying = isActive && isPlaying;

              return (
                <div
                  key={track.id}
                  className="flex items-center gap-3 px-4 py-3 group transition-colors cursor-pointer"
                  style={{
                    background: isActive ? `${theme.primary}10` : "transparent",
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                  onClick={() => onSelectTrack(idx)}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = theme.overlay(0.03); }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  {/* Track number / playing indicator */}
                  <div className="w-8 flex items-center justify-center shrink-0">
                    {isThisPlaying ? (
                      <NowPlayingBars color={theme.primary} />
                    ) : (
                      <span
                        className="text-xs font-data group-hover:hidden"
                        style={{ color: isActive ? theme.primary : theme.mutedFg }}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    )}
                    {!isThisPlaying && (
                      <Play
                        className="w-3.5 h-3.5 fill-current hidden group-hover:block"
                        style={{ color: theme.primary }}
                      />
                    )}
                  </div>

                  {/* Waveform icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-base"
                    style={{ background: isActive ? `${theme.primary}20` : theme.overlay(0.05) }}
                  >
                    🎵
                  </div>

                  {/* Name + size */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: isActive ? theme.primary : theme.foreground }}
                    >
                      {track.name}
                    </p>
                    {track.size && (
                      <p className="text-xs mt-0.5" style={{ color: theme.mutedFg }}>{track.size}</p>
                    )}
                  </div>

                  {/* Duration */}
                  <span className="text-xs font-data shrink-0 mr-2" style={{ color: theme.mutedFg }}>
                    {fmtDuration(track.duration)}
                  </span>

                  {/* Remove button */}
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: theme.overlay(0.06) }}
                    onClick={e => { e.stopPropagation(); onRemoveTrack(track.id); }}
                  >
                    <X className="w-3 h-3" style={{ color: theme.mutedFg }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Music View ─────────────────────────────────────────────────
interface MusicViewProps {
  theme: DashTheme;
  playlist: Track[];
  currentTrackIdx: number | null;
  isPlaying: boolean;
  onSelectTrack: (idx: number) => void;
  onAddTracks: (files: FileList) => void;
  onRemoveTrack: (id: string) => void;
}

function MusicView({ theme, playlist, currentTrackIdx, isPlaying, onSelectTrack, onAddTracks, onRemoveTrack }: MusicViewProps) {
  const [tab, setTab] = useState("My Library");
  const tabs = ["My Library", "Programming", "Writing", "Reading", "Relaxation"];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold" style={{ color: theme.foreground }}>Music Library</h2>
        <p className="text-sm mt-0.5" style={{ color: theme.mutedFg }}>Organized for focused work</p>
      </div>

      <div className="flex gap-1 rounded-xl p-1 mb-6 w-fit overflow-x-auto scrollbar-hide" style={{ background: theme.overlay(0.04), border: `1px solid ${theme.border}` }}>
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap"
            style={{
              background: tab === t ? theme.card : "transparent",
              color: tab === t ? theme.foreground : theme.mutedFg,
            }}
          >
            {t === "My Library" ? (
              <span className="flex items-center gap-1.5">
                <ListMusic className="w-3.5 h-3.5" />
                My Library
                {playlist.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-data" style={{ background: `${theme.primary}30`, color: theme.primary }}>
                    {playlist.length}
                  </span>
                )}
              </span>
            ) : t}
          </button>
        ))}
      </div>

      {tab === "My Library" ? (
        <LibraryView
          theme={theme}
          playlist={playlist}
          currentTrackIdx={currentTrackIdx}
          isPlaying={isPlaying}
          onSelectTrack={onSelectTrack}
          onAddTracks={onAddTracks}
          onRemoveTrack={onRemoveTrack}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {(MUSIC_CATS[tab] ?? []).map((p, i) => (
            <button
              key={i}
              className="rounded-2xl p-5 text-left transition-all duration-150 group"
              style={{ background: theme.card, border: `1px solid ${theme.border}` }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${theme.primary}40`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">{p.emoji}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: theme.overlay(0.05) }}>
                  <Play className="w-3.5 h-3.5 fill-current" style={{ color: theme.mutedFg }} />
                </div>
              </div>
              <h4 className="font-semibold mb-1 font-display" style={{ color: theme.foreground }}>{p.title}</h4>
              <p className="text-sm mb-3" style={{ color: theme.mutedFg }}>{p.desc}</p>
              <p className="text-xs font-data opacity-50" style={{ color: theme.mutedFg }}>{p.tracks}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sounds View ────────────────────────────────────────────────
function SoundsView({ theme }: { theme: DashTheme }) {
  const defaultLevels = Object.fromEntries(SOUNDS_DATA.map(s => [s.id, s.default]));
  const [levels, setLevels] = useState<Record<string, number>>(defaultLevels);
  const active = SOUNDS_DATA.filter(s => levels[s.id] > 0);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold" style={{ color: theme.foreground }}>Ambient Sounds</h2>
        <p className="text-sm mt-0.5" style={{ color: theme.mutedFg }}>Layer sounds to build your perfect environment</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {SOUNDS_DATA.map(s => (
          <div key={s.id} className="rounded-2xl p-4" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{s.emoji}</span>
                <span className="text-sm font-medium" style={{ color: theme.foreground }}>{s.name}</span>
              </div>
              <span className="text-xs font-data" style={{ color: theme.mutedFg }}>{levels[s.id]}%</span>
            </div>
            <input
              type="range" min="0" max="100" value={levels[s.id]}
              onChange={e => setLevels(prev => ({ ...prev, [s.id]: Number(e.target.value) }))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: s.color }}
            />
          </div>
        ))}
      </div>

      {active.length > 0 && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold font-display" style={{ color: theme.foreground }}>Current Mix</h3>
            <button
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: `${theme.primary}20`, color: theme.primary }}
            >
              Save Preset
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {active.map(s => (
              <div
                key={s.id}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                style={{ background: theme.overlay(0.05), border: `1px solid ${theme.border}` }}
              >
                <span className="text-sm">{s.emoji}</span>
                <span className="text-xs" style={{ color: theme.foreground }}>{s.name}</span>
                <span className="text-xs font-data" style={{ color: theme.mutedFg }}>{levels[s.id]}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-3 font-display" style={{ color: theme.foreground }}>Saved Presets</h3>
        <div className="space-y-2">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all"
              style={{ background: theme.card, border: `1px solid ${theme.border}` }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${theme.primary}40`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = theme.border; }}
            >
              <span className="text-2xl">{p.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: theme.foreground }}>{p.name}</p>
                <p className="text-xs" style={{ color: theme.mutedFg }}>{p.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4" style={{ color: theme.mutedFg }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Analytics View ─────────────────────────────────────────────
function AnalyticsView({ theme }: { theme: DashTheme }) {
  const intensityAlphas = [0.04, 0.25, 0.45, 0.70, 1];

  return (
    <div className="p-6 max-w-5xl space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold" style={{ color: theme.foreground }}>Analytics</h2>
        <p className="text-sm mt-0.5" style={{ color: theme.mutedFg }}>Your productivity insights</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Focused This Week", value: "18h", sub: "+2h vs last week", Icon: Clock },
          { label: "Sessions Completed", value: "26", sub: "286 all time", Icon: Target },
          { label: "Avg Session", value: "42m", sub: "per session", Icon: TrendingUp },
          { label: "Best Streak", value: "37d", sub: "current: 12 days", Icon: Flame },
        ].map(({ label, value, sub, Icon }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-wider leading-tight" style={{ color: theme.mutedFg }}>{label}</p>
              <Icon className="w-4 h-4 shrink-0 opacity-25" style={{ color: theme.foreground }} />
            </div>
            <p className="text-3xl font-bold font-data" style={{ color: theme.foreground }}>{value}</p>
            <p className="text-xs mt-1" style={{ color: theme.mutedFg }}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-6" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold font-display" style={{ color: theme.foreground }}>Activity — Past 26 Weeks</h3>
          <div className="flex items-center gap-2 text-xs" style={{ color: theme.mutedFg }}>
            <span>Less</span>
            {intensityAlphas.map((a, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `${theme.primary}${Math.round(a * 255).toString(16).padStart(2, "0")}` }} />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {HEATMAP[0].map((_, week) => (
            <div key={week} className="flex flex-col gap-1">
              {HEATMAP.map((row, day) => (
                <div
                  key={day}
                  title={`${row[week]} sessions`}
                  className="w-3 h-3 rounded-sm hover:scale-125 transition-transform cursor-pointer"
                  style={{ background: `${theme.primary}${Math.round(intensityAlphas[row[week]] * 255).toString(16).padStart(2, "0")}` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: theme.mutedFg }}>Favorite Environment</p>
          <p className="text-xl font-bold mt-1" style={{ color: theme.foreground }}>🌧 Rain + Café</p>
          <p className="text-sm mt-1" style={{ color: theme.mutedFg }}>Most played: Coding Flow · 412h total</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: theme.mutedFg }}>Peak Productivity</p>
          <p className="text-xl font-bold mt-1 font-data" style={{ color: theme.foreground }}>9 AM – 11 AM</p>
          <p className="text-sm mt-1" style={{ color: theme.mutedFg }}>40% more sessions completed before noon</p>
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <h3 className="font-semibold mb-4 font-display" style={{ color: theme.foreground }}>Achievements</h3>
        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a, i) => (
            <div
              key={i}
              className="rounded-xl p-4 transition-all"
              style={{
                background: a.earned ? `${theme.primary}10` : theme.overlay(0.02),
                border: `1px solid ${a.earned ? `${theme.primary}30` : theme.border}`,
                opacity: a.earned ? 1 : 0.45,
              }}
            >
              <div className="text-2xl mb-2">{a.icon}</div>
              <p className="text-sm font-semibold mb-1 font-display" style={{ color: a.earned ? theme.foreground : theme.mutedFg }}>{a.name}</p>
              <p className="text-xs" style={{ color: theme.mutedFg }}>{a.desc}</p>
              {a.earned && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs" style={{ color: theme.primary }}>
                  <Check className="w-3 h-3" /> Unlocked
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Bottom Player ──────────────────────────────────────────────
interface BottomPlayerProps {
  theme: DashTheme;
  playlist: Track[];
  /** Where the queue came from — a playlist name, or null for the library. */
  queueName: string | null;
  currentTrackIdx: number | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement>;
}

function BottomPlayer({ theme, playlist, queueName, currentTrackIdx, isPlaying, onPlayPause, onNext, onPrev, audioRef }: BottomPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);

  const track = currentTrackIdx !== null ? playlist[currentTrackIdx] : null;
  const progress = duration > 0 ? currentTime / duration : 0;

  // Subscribe to audio element time events
  useEffect(() => {
    const audio = audioRef.current;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(isFinite(audio.duration) ? audio.duration : 0);
    const onDurChange = () => setDuration(isFinite(audio.duration) ? audio.duration : 0);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onDurChange);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onDurChange);
    };
  }, [audioRef]);

  // Reset display when track changes
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [currentTrackIdx]);

  // Sync volume
  useEffect(() => { audioRef.current.volume = volume; }, [volume, audioRef]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  return (
    <section
      aria-label="Player"
      className="h-20 flex items-center px-6 gap-6 shrink-0"
      style={{ background: theme.sidebar, borderTop: `1px solid ${theme.border}` }}
    >
      {/* Track info */}
      <div className="flex items-center gap-3 w-56 shrink-0">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${theme.primary}40, ${theme.accent}30)`, border: `1px solid ${theme.border}` }}
        >
          <span className="text-lg">{track ? "🎵" : "💻"}</span>
          {isPlaying && track && (
            <div className="absolute bottom-1 right-1">
              <NowPlayingBars color={theme.primary} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: theme.foreground }}>
            {track ? track.name : "No track selected"}
          </p>
          <p className="text-xs truncate" style={{ color: theme.mutedFg }}>
            {!track ? (
              "Add files in Music → My Library"
            ) : queueName ? (
              <>
                <span>{queueName}</span> · {playlist.length} tracks
              </>
            ) : (
              `${playlist.length} tracks in library`
            )}
          </p>
        </div>
      </div>

      {/* Controls + scrubber */}
      <div className="flex-1 flex flex-col items-center gap-2">
        <div className="flex items-center gap-5">
          <button
            onClick={onPrev}
            aria-label="Previous track"
            className="transition-opacity hover:opacity-70 disabled:opacity-30"
            style={{ color: theme.mutedFg }}
            disabled={playlist.length === 0}
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={onPlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 transition-transform active:scale-95 disabled:opacity-30"
            style={{ background: theme.foreground }}
            disabled={playlist.length === 0}
          >
            {isPlaying
              ? <Pause className="w-4 h-4 fill-current" style={{ color: theme.background }} />
              : <Play className="w-4 h-4 fill-current ml-0.5" style={{ color: theme.background }} />}
          </button>
          <button
            onClick={onNext}
            aria-label="Next track"
            className="transition-opacity hover:opacity-70 disabled:opacity-30"
            style={{ color: theme.mutedFg }}
            disabled={playlist.length === 0}
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        <div className="flex items-center gap-3 w-full max-w-sm">
          <span
            role="timer"
            aria-label="Elapsed time"
            className="text-xs font-data w-8 text-right"
            style={{ color: theme.mutedFg }}
          >
            {fmtDuration(currentTime)}
          </span>
          <div
            className="flex-1 h-1 rounded-full overflow-hidden cursor-pointer group relative"
            style={{ background: theme.overlay(0.08) }}
            onClick={handleSeek}
          >
            <div
              className="h-full rounded-full transition-none pointer-events-none"
              style={{ width: `${progress * 100}%`, background: `linear-gradient(to right, ${theme.primary}, ${theme.accent})` }}
            />
          </div>
          <span className="text-xs font-data w-8" style={{ color: theme.mutedFg }}>
            {fmtDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 w-28 shrink-0">
        <Volume2 className="w-4 h-4 shrink-0" style={{ color: theme.mutedFg }} />
        <input
          type="range"
          aria-label="Volume"
          min={0} max={1} step={0.01}
          value={volume}
          onChange={e => setVolume(Number(e.target.value))}
          className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: theme.primary }}
        />
      </div>
    </section>
  );
}

// ── App ────────────────────────────────────────────────────────
export default function Dashboard({ account, onSignOut, onAccountChange }: { account: AccountRecord; onSignOut: () => void; onAccountChange: (account: AccountRecord) => void }) {
  const [nav, setNav] = useState<Nav>("home");
  const [phase, setPhase] = useState<FocusPhase>("idle");
  const [focusConfig, setFocusConfig] = useState<FocusConfig | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [persistedSession, setPersistedSession] = useState<FocusSession | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (!account.task?.title) return INIT_TASKS;
    return [{ id: 0, text: account.task.title, done: false }, ...INIT_TASKS];
  });
  const { themeId, theme, setThemeId } = useThemeSelection(account.theme?.id);

  function handleThemeSelect(id: ThemeId) {
    setThemeId(id);
    onAccountChange(updateAccount(account.email, { theme: { id } }));
  }
  const displayName = account.name;

  const goalMinutes = DAILY_GOAL_MINUTES;
  const completedMinutes = 75;
  const progressPct = Math.min(100, Math.round((completedMinutes / goalMinutes) * 100));
  const remainingMinutes = Math.max(0, goalMinutes - completedMinutes);
  const goalLabel = DAILY_GOAL_LABEL;
  // const defaultAmbience =
  //   account.playlist?.option && account.playlist.option !== "No Playlist"
  //     ? account.playlist.option
  //     : undefined;

  // ── Playlist & audio ──
  const sharedAudio = ambientAudio();
  // The queue holds the music that has been playing since the homepage from the very
  // first render, so there is never a moment where the dashboard thinks nothing is on.
  const [playlist, setPlaylist] = useState<Track[]>(() => [{ ...DEFAULT_TRACK, duration: 0, size: "" }]);
  const [queueName, setQueueName] = useState<string | null>(DEFAULT_TRACK.name);
  const [currentTrackIdx, setCurrentTrackIdx] = useState<number | null>(0);
  const [isPlaying, setIsPlaying] = useState(() => !sharedAudio.paused);
  const audioRef = useRef(sharedAudio);
  const loadedIdRef = useRef<string | null>(DEFAULT_TRACK.id);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build CSS variable overrides for the active theme
  const themeVars = themeCssVars(theme);

  const handleNav = (n: Nav) => {
    setNav(n);
    if (n === "focus" && phase === "idle") setPhase("setup");
  };



  const handleReviewSession = (
    config: FocusConfig
  ) => {
    setFocusConfig(config);
    setPhase("review");
  };

  // const handleStartSession = async () => {
  //   if (!focusConfig) return;

  //   try {
  //     const created = await createSession({
  //       durationMinutes: focusConfig.duration,
  //       objective: focusConfig.objective,
  //       task: focusConfig.task,
  //       audioId: focusConfig.audio?.id,
  //       audioName: focusConfig.audio?.name,
  //       audioType: focusConfig.audio?.type,
  //     });

  //     const started = await updateSessionStatus(
  //       created.id,
  //       "in_progress"
  //     );

  //     setPersistedSession(started);

  //     const seconds =
  //       focusConfig.duration * 60;

  //     setSecondsLeft(seconds);
  //     setTotalSeconds(seconds);
  //     setIsSessionPaused(false);

  //     setPhase("active");

  //     void startSessionAudio(
  //       focusConfig
  //     );
  //   } catch (error) {
  //     console.error(
  //       "Could not start session:",
  //       error
  //     );
  //   }
  // };

  const handleStartSession = () => {
  if (!focusConfig) return;

  // Start the UI/session immediately.
  const seconds = focusConfig.duration * 60;

  setSecondsLeft(seconds);
  setTotalSeconds(seconds);
  setIsSessionPaused(false);
  setPhase("active");

  void startSessionAudio(focusConfig);

  // Persist the session separately so an AWS/API problem
  // does not prevent the user from starting the timer.
  void persistStartedSession(focusConfig);
};

const persistStartedSession = async (
  config: FocusConfig
) => {
  try {
    const created = await createSession({
      durationMinutes: config.duration,
      objective: config.objective,
      task: config.task,
      audioId: config.audio?.id,
      audioName: config.audio?.name,
      audioType: config.audio?.type,
    });

    const started = await updateSessionStatus(
      created.id,
      "in_progress"
    );

    setPersistedSession(started);
  } catch (error) {
    console.error(
      "Could not persist started session:",
      error
    );
  }
};

const handlePauseSession = () => {
  // Pause locally first
  setIsSessionPaused(true);

  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  setIsPlaying(false);
  audioRef.current.pause();

  // Then try to persist the pause state
  if (persistedSession) {
    void updateSessionStatus(
      persistedSession.id,
      "paused"
    )
      .then((updated: SetStateAction<FocusSession | null>) => {
        setPersistedSession(updated);
      })
      .catch((error: any) => {
        console.error(
          "Could not persist paused session:",
          error
        );
      });
  }
};

const handleResumeSession = () => {
  // Resume locally first
  setIsSessionPaused(false);

  if (
    focusConfig?.audio &&
    playlist.length > 0
  ) {
    setIsPlaying(true);
  }

  // Persist separately
  if (persistedSession) {
    void updateSessionStatus(
      persistedSession.id,
      "in_progress"
    )
      .then(updated => {
        setPersistedSession(updated);
      })
      .catch(error => {
        console.error(
          "Could not persist resumed session:",
          error
        );
      });
  }
};

  async function startSessionAudio(config: FocusConfig) {
    if (!config.audio) return;

    try {
      if (config.audio.type === "playlist") {
        const availablePlaylists = await listPlaylists();

        const selectedPlaylist = availablePlaylists.find(
          playlist => playlist.id === config.audio?.id
        );

        if (!selectedPlaylist) return;

        const tracks = playlistTracks(selectedPlaylist);

        if (tracks.length === 0) return;

        setPlaylist(tracks);
        setQueueName(selectedPlaylist.name);
        setCurrentTrackIdx(0);
        setIsPlaying(true);
      }

      if (config.audio.type === "track") {
        const files = await listAudioFiles();

        const selectedTrack = files.find(
          track => track.id === config.audio?.id
        );

        if (!selectedTrack?.playUrl) return;

        setPlaylist([
          {
            id: `cloud:${selectedTrack.id}`,
            name: selectedTrack.name,
            url: selectedTrack.playUrl,
            duration: 0,
            size: "",
          },
        ]);

        setQueueName(null);
        setCurrentTrackIdx(0);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Could not start session audio:", error);
    }
  }


const handleEnd = () => {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  setIsSessionPaused(false);
  setIsPlaying(false);
  audioRef.current.pause();

  // Move to complete screen immediately
  setPhase("complete");

  // Persist separately if a backend session exists
  if (persistedSession) {
    void updateSessionStatus(
      persistedSession.id,
      "completed"
    )
      .then(updated => {
        setPersistedSession(updated);
      })
      .catch(error => {
        console.error(
          "Could not persist completed session:",
          error
        );
      });
  }
};

const completeSession = useCallback(() => {
  setIsSessionPaused(false);
  setIsPlaying(false);
  audioRef.current.pause();

  // Complete the UI immediately
  setPhase("complete");

  // Persist in the background
  if (persistedSession) {
    void updateSessionStatus(
      persistedSession.id,
      "completed"
    )
      .then(updated => {
        setPersistedSession(updated);
      })
      .catch(error => {
        console.error(
          "Could not persist completed session:",
          error
        );
      });
  }
}, [persistedSession]);

  const handleDone = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setPhase("idle");
    setNav("home");

    setFocusConfig(null);
    setPersistedSession(null);

    setSecondsLeft(0);
    setTotalSeconds(0);

    setIsSessionPaused(false);
    setIsPlaying(false);

    audioRef.current.pause();
  };

  useEffect(() => {
    if (phase !== "active" || isSessionPaused) {
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft(current => {
        if (current <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          void completeSession();

          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, isSessionPaused, completeSession]);

  // ── Audio playback ──
  useEffect(() => {
    const audio = audioRef.current;
    // Nothing queued is no reason to silence music that is already playing.
    if (currentTrackIdx === null) { if (playlist.length) audio.pause(); return; }
    const track = playlist[currentTrackIdx];
    if (!track) return;

    // A lone ambience track repeats rather than leaving silence behind.
    audio.loop = playlist.length <= 1;

    if (loadedIdRef.current !== track.id) {
      loadedIdRef.current = track.id;
      audio.src = track.url;
      audio.load();
      if (isPlaying) audio.play().catch(() => setIsPlaying(false));
    } else {
      if (isPlaying) audio.play().catch(() => setIsPlaying(false));
      else audio.pause();
    }
  }, [currentTrackIdx, isPlaying, playlist]);

  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => {
      setCurrentTrackIdx(prev => {
        if (prev === null || prev >= playlist.length - 1) { setIsPlaying(false); return prev; }
        return prev + 1;
      });
    };
    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [playlist.length]);

  // ── Playlists ──
  /** Puts a saved playlist on and starts it from the top. */
  const startPlaylist = useCallback((chosen: Playlist) => {
    const tracks = playlistTracks(chosen);
    if (tracks.length === 0) return;

    loadedIdRef.current = null;
    setPlaylist(tracks);
    setQueueName(chosen.name);
    setCurrentTrackIdx(0);
    setIsPlaying(true);
  }, []);

  /**
   * The music that has been playing since the homepage carries straight into the
   * dashboard, and the saved default playlist queues up behind it. From here the
   * listener is in charge — play, pause and track changes are all theirs.
   */
  useEffect(() => {
    releaseAmbientMusic();

    if (!isBackendConfigured) return;
    let cancelled = false;

    getDefaultPlaylist()
      .then(defaultPlaylist => {
        if (cancelled || !defaultPlaylist) return;
        const queued = playlistTracks(defaultPlaylist);
        if (queued.length) setPlaylist(prev => [...prev, ...queued]);
      })
      .catch((err: unknown) => console.warn("The default playlist could not be loaded", err));

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Track management ──
  const handleAddTracks = useCallback((files: FileList) => {
    const incoming = Array.from(files).filter(f => f.type.startsWith("audio/"));
    if (!incoming.length) return;

    const newTracks: Track[] = incoming.map(f => ({
      id: makeId(),
      name: f.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(f),
      duration: 0,
      size: fmtBytes(f.size),
    }));

    // The queue is no longer just the playlist it started as.
    setQueueName(null);

    setPlaylist(prev => {
      const updated = [...prev, ...newTracks];
      // Auto-play first track if nothing loaded yet
      if (prev.length === 0) {
        setCurrentTrackIdx(0);
        setIsPlaying(true);
      }
      return updated;
    });

    // Load durations asynchronously
    newTracks.forEach(track => {
      const tmp = new Audio(track.url);
      tmp.addEventListener("loadedmetadata", () => {
        setPlaylist(prev => prev.map(t => t.id === track.id ? { ...t, duration: tmp.duration } : t));
      }, { once: true });
    });
  }, []);

  // Audio files added through the Audio Files page — playable alongside local tracks
  const handleLibraryChange = useCallback((files: AudioFile[]) => {
    setPlaylist(prev => {
      const known = new Set(prev.map(t => t.id));
      const additions = files
        .filter(f => f.playUrl && !known.has(`cloud:${f.id}`))
        .map(cloudTrack);
      if (!additions.length) return prev;

      setQueueName(null);
      return [...prev, ...additions];
    });
  }, []);

  const handlePlayAudioFile = useCallback((file: AudioFile) => {
    if (!file.playUrl) return;
    setQueueName(null);
    setPlaylist(prev => {
      const existingIdx = prev.findIndex(t => t.id === `cloud:${file.id}`);
      if (existingIdx >= 0) {
        setCurrentTrackIdx(existingIdx);
        setIsPlaying(true);
        return prev;
      }
      setCurrentTrackIdx(prev.length);
      setIsPlaying(true);
      return [...prev, cloudTrack(file)];
    });
  }, []);

  const handleRemoveTrack = useCallback((id: string) => {
    setPlaylist(prev => {
      const idx = prev.findIndex(t => t.id === id);
      const next = prev.filter(t => t.id !== id);
      URL.revokeObjectURL(prev[idx]?.url ?? "");
      // Adjust currentTrackIdx
      setCurrentTrackIdx(cur => {
        if (cur === null) return null;
        if (cur === idx) {
          if (next.length === 0) { setIsPlaying(false); loadedIdRef.current = null; audioRef.current.pause(); return null; }
          return Math.min(cur, next.length - 1);
        }
        return cur > idx ? cur - 1 : cur;
      });
      return next;
    });
  }, []);

  const handleSelectTrack = useCallback((idx: number) => {
    setCurrentTrackIdx(idx);
    setIsPlaying(true);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (playlist.length === 0) return;
    if (currentTrackIdx === null) { setCurrentTrackIdx(0); setIsPlaying(true); return; }
    setIsPlaying(p => !p);
  }, [playlist.length, currentTrackIdx]);

  const handleNext = useCallback(() => {
    if (playlist.length === 0) return;
    setCurrentTrackIdx(prev => (prev === null ? 0 : Math.min(prev + 1, playlist.length - 1)));
    setIsPlaying(true);
  }, [playlist.length]);

  const handlePrev = useCallback(() => {
    if (playlist.length === 0) return;
    const audio = audioRef.current;
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    setCurrentTrackIdx(prev => (prev === null ? 0 : Math.max(prev - 1, 0)));
    setIsPlaying(true);
  }, [playlist.length]);

  const toggleTask = (id: number) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        ...themeVars,
        background: theme.background,
        color: theme.foreground,
        fontFamily: theme.fontFamily,
        transition: theme.transition("background-color", "color"),
      }}
    >
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={nav} onNav={handleNav} theme={theme} name={displayName} goalLabel={fmtGoalShort(goalMinutes)} progressPct={progressPct} onSignOut={onSignOut} />
        <main className="flex-1 overflow-y-auto scrollbar-hide" style={{ background: theme.background }}>
          {nav === "home" && (
            <HomeView
              onStartFocus={() => { setNav("focus"); setPhase("setup"); }}
              tasks={tasks}
              onToggleTask={toggleTask}
              theme={theme}
              queueName={queueName}
              playlist={playlist}
              currentTrackIdx={currentTrackIdx}
              isPlaying={isPlaying}
              name={displayName}
              goalLabel={goalLabel}
              progressPct={progressPct}
              remainingLabel={fmtGoalShort(remainingMinutes)}
            />
          )}

          {nav === "focus" && phase === "setup" && (
            <FocusSetupView
              onContinue={handleReviewSession}
              theme={theme}
            />
          )}

          {nav === "focus" && phase === "review" && focusConfig && (
            <SessionReviewView
              config={focusConfig}
              onBack={() => setPhase("setup")}
              onStart={handleStartSession}
              theme={theme}
            />
          )}

          {nav === "focus" && phase === "active" && focusConfig && (
            <ActiveSessionView
              config={focusConfig}
              secondsLeft={secondsLeft}
              totalSeconds={totalSeconds}
              isPaused={isSessionPaused}
              onPause={handlePauseSession}
              onResume={handleResumeSession}
              onEnd={handleEnd}
              theme={theme}
            />
          )}
          {nav === "focus" && phase === "complete" && focusConfig && (
            <SessionCompleteView config={focusConfig} onDone={handleDone} theme={theme} />
          )}
          {nav === "music" && (
            <MusicView
              theme={theme}
              playlist={playlist}
              currentTrackIdx={currentTrackIdx}
              isPlaying={isPlaying}
              onSelectTrack={handleSelectTrack}
              onAddTracks={handleAddTracks}
              onRemoveTrack={handleRemoveTrack}
            />
          )}
          {nav === "audio" && (
            <AudioFilesView
              theme={theme}
              onPlay={handlePlayAudioFile}
              onLibraryChange={handleLibraryChange}
            />
          )}
          {nav === "playlists" && <PlaylistsView theme={theme} onPlay={startPlaylist} />}
          {nav === "sounds" && <SoundsView theme={theme} />}
          {nav === "analytics" && <AnalyticsView theme={theme} />}
          {nav === "themes" && <ThemeSelectionView activeThemeId={themeId} onSelect={handleThemeSelect} theme={theme} />}
        </main>
      </div>
      <BottomPlayer
        theme={theme}
        playlist={playlist}
        queueName={queueName}
        currentTrackIdx={currentTrackIdx}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        audioRef={audioRef}
      />
    </div>
  );
}
