import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Bell, Volume2, VolumeX, Play, Pause, RotateCcw,
  Plus, Trash2, Check, Coffee, BookOpen, Monitor, Flame,
} from 'lucide-react';
import { useTheme } from '../App';
import { useThemeAudio } from '../hooks/useThemeAudio';

// ─── Focus Timer ──────────────────────────────────────────────────────────────

const MODES = [
  { label: 'Focus', minutes: 25 },
  { label: 'Short Break', minutes: 5 },
  { label: 'Long Break', minutes: 15 },
];

function FocusTimer({ onSessionComplete }: { onSessionComplete: () => void }) {
  const { theme } = useTheme();
  const [modeIdx, setModeIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = MODES[modeIdx].minutes * 60;
  const progress = 1 - secondsLeft / totalSeconds;
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * (1 - progress);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            if (modeIdx === 0) onSessionComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const reset = useCallback(() => {
    setRunning(false);
    setSecondsLeft(MODES[modeIdx].minutes * 60);
  }, [modeIdx]);

  const switchMode = useCallback((idx: number) => {
    setRunning(false);
    setModeIdx(idx);
    setSecondsLeft(MODES[idx].minutes * 60);
  }, []);

  const dur = `${theme.animDuration}ms`;

  return (
    <div
      style={{
        backgroundColor: theme.colors['--card'],
        borderColor: theme.colors['--border'],
        transition: `background-color ${dur} ${theme.animEasing}, border-color ${dur} ${theme.animEasing}`,
      }}
      className="rounded-2xl border p-5 flex flex-col"
    >
      {/* Mode tabs */}
      <div
        style={{ backgroundColor: theme.colors['--muted'], borderRadius: 10 }}
        className="flex p-1 gap-1 mb-5"
      >
        {MODES.map((mode, i) => (
          <button
            key={mode.label}
            onClick={() => switchMode(i)}
            style={{
              flex: 1,
              padding: '5px 0',
              borderRadius: 7,
              fontSize: '0.7rem',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              transition: `all ${dur} ${theme.animEasing}`,
              backgroundColor: modeIdx === i ? theme.colors['--primary'] : 'transparent',
              color: modeIdx === i ? theme.colors['--primary-foreground'] : theme.colors['--muted-foreground'],
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Circular timer */}
      <div className="flex justify-center items-center mb-5">
        <div className="relative" style={{ width: 148, height: 148 }}>
          <svg width="148" height="148" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="74" cy="74" r={radius}
              fill="none"
              stroke={theme.colors['--muted']}
              strokeWidth="6"
              style={{ transition: `stroke ${dur} ${theme.animEasing}` }}
            />
            <circle
              cx="74" cy="74" r={radius}
              fill="none"
              stroke={theme.colors['--primary']}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDash}
              style={{
                transition: running
                  ? 'stroke-dashoffset 1s linear'
                  : `stroke-dashoffset 0.4s ${theme.animEasing}, stroke ${dur} ${theme.animEasing}`,
              }}
            />
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ color: theme.colors['--card-foreground'] }}
          >
            <span style={{ fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {minutes}:{seconds}
            </span>
            <span style={{ fontSize: '0.65rem', color: theme.colors['--muted-foreground'], marginTop: 3 }}>
              {MODES[modeIdx].label}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={reset}
          style={{
            backgroundColor: theme.colors['--secondary'],
            color: theme.colors['--secondary-foreground'],
            border: `1px solid ${theme.colors['--border']}`,
            borderRadius: 10,
            padding: '9px 12px',
            cursor: 'pointer',
            transition: `all ${dur} ${theme.animEasing}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RotateCcw size={15} />
        </button>
        <button
          onClick={() => setRunning(r => !r)}
          style={{
            flex: 1,
            backgroundColor: theme.colors['--primary'],
            color: theme.colors['--primary-foreground'],
            border: 'none',
            borderRadius: 10,
            padding: '9px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: `all ${dur} ${theme.animEasing}`,
          }}
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
          {running ? 'Pause' : 'Start Focus'}
        </button>
      </div>
    </div>
  );
}

// ─── Task List ────────────────────────────────────────────────────────────────

interface Task { id: string; text: string; done: boolean }

function TaskList({ onTaskComplete }: { onTaskComplete: () => void }) {
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Review morning notes', done: false },
    { id: '2', text: 'Deep work session', done: false },
    { id: '3', text: 'Write project brief', done: false },
    { id: '4', text: 'Respond to messages', done: true },
  ]);
  const [input, setInput] = useState('');
  const dur = `${theme.animDuration}ms`;

  const addTask = () => {
    if (!input.trim()) return;
    setTasks(t => [...t, { id: Date.now().toString(), text: input.trim(), done: false }]);
    setInput('');
  };

  const toggleTask = (id: string) => {
    setTasks(t => t.map(task => {
      if (task.id === id) {
        if (!task.done) onTaskComplete();
        return { ...task, done: !task.done };
      }
      return task;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(t => t.filter(task => task.id !== id));
  };

  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div
      style={{
        backgroundColor: theme.colors['--card'],
        borderColor: theme.colors['--border'],
        transition: `background-color ${dur} ${theme.animEasing}, border-color ${dur} ${theme.animEasing}`,
      }}
      className="rounded-2xl border p-5 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: theme.colors['--card-foreground'], fontSize: '0.95rem', fontWeight: 600 }}>
          Tasks
        </h3>
        <span
          style={{
            backgroundColor: theme.colors['--secondary'],
            color: theme.colors['--secondary-foreground'],
            fontSize: '0.65rem',
            padding: '2px 8px',
            borderRadius: 20,
            fontWeight: 600,
          }}
        >
          {doneCount}/{tasks.length}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{ backgroundColor: theme.colors['--muted'], borderRadius: 4, height: 4, marginBottom: 14 }}
      >
        <div
          style={{
            backgroundColor: theme.colors['--primary'],
            borderRadius: 4,
            height: '100%',
            width: `${tasks.length ? (doneCount / tasks.length) * 100 : 0}%`,
            transition: `width 0.5s ${theme.animEasing}, background-color ${dur} ${theme.animEasing}`,
          }}
        />
      </div>

      {/* Task items */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 mb-4" style={{ maxHeight: 220 }}>
        <AnimatePresence initial={false}>
          {tasks.map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{ duration: theme.animDuration / 1000, ease: 'easeOut' }}
            >
              <div
                className="flex items-center gap-2.5 group"
                style={{ padding: '5px 0' }}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 5,
                    border: `2px solid ${task.done ? theme.colors['--primary'] : theme.colors['--border']}`,
                    backgroundColor: task.done ? theme.colors['--primary'] : 'transparent',
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: `all ${dur} ${theme.animEasing}`,
                  }}
                >
                  {task.done && <Check size={10} style={{ color: theme.colors['--primary-foreground'] }} strokeWidth={3} />}
                </button>
                <span
                  style={{
                    flex: 1,
                    fontSize: '0.8rem',
                    color: task.done ? theme.colors['--muted-foreground'] : theme.colors['--card-foreground'],
                    textDecoration: task.done ? 'line-through' : 'none',
                    transition: `all ${dur} ${theme.animEasing}`,
                  }}
                >
                  {task.text}
                </span>
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{
                    opacity: 0,
                    color: theme.colors['--muted-foreground'],
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                    alignItems: 'center',
                    transition: `opacity ${dur} ${theme.animEasing}`,
                  }}
                  className="group-hover:!opacity-60 hover:!opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add task input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add a task..."
          style={{
            flex: 1,
            backgroundColor: theme.colors['--input-background'],
            color: theme.colors['--card-foreground'],
            border: `1px solid ${theme.colors['--border']}`,
            borderRadius: 9,
            padding: '7px 11px',
            fontSize: '0.78rem',
            outline: 'none',
            fontFamily: theme.fontFamily,
            transition: `all ${dur} ${theme.animEasing}`,
          }}
        />
        <button
          onClick={addTask}
          style={{
            backgroundColor: theme.colors['--primary'],
            color: theme.colors['--primary-foreground'],
            border: 'none',
            borderRadius: 9,
            padding: '7px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            transition: `all ${dur} ${theme.animEasing}`,
          }}
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Quick Notes ──────────────────────────────────────────────────────────────

function QuickNotes() {
  const { theme } = useTheme();
  const [note, setNote] = useState(
    'Use this space for quick thoughts, ideas, or anything on your mind during your session.'
  );
  const [saved, setSaved] = useState(false);
  const dur = `${theme.animDuration}ms`;

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const charCount = note.length;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div
      style={{
        backgroundColor: theme.colors['--card'],
        borderColor: theme.colors['--border'],
        transition: `background-color ${dur} ${theme.animEasing}, border-color ${dur} ${theme.animEasing}`,
      }}
      className="rounded-2xl border p-5 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ color: theme.colors['--card-foreground'], fontSize: '0.95rem', fontWeight: 600 }}>
          Notes
        </h3>
        <span style={{ color: theme.colors['--muted-foreground'], fontSize: '0.65rem' }}>
          {wordCount}w · {charCount}c
        </span>
      </div>

      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Capture your thoughts..."
        style={{
          flex: 1,
          minHeight: 200,
          backgroundColor: theme.colors['--input-background'],
          color: theme.colors['--card-foreground'],
          border: `1px solid ${theme.colors['--border']}`,
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: '0.82rem',
          lineHeight: 1.65,
          resize: 'none',
          outline: 'none',
          fontFamily: theme.fontFamily,
          marginBottom: 12,
          transition: `all ${dur} ${theme.animEasing}`,
        }}
      />

      <button
        onClick={handleSave}
        style={{
          backgroundColor: saved ? theme.colors['--accent'] : theme.colors['--primary'],
          color: saved ? theme.colors['--accent-foreground'] : theme.colors['--primary-foreground'],
          border: 'none',
          borderRadius: 9,
          padding: '8px',
          cursor: 'pointer',
          fontSize: '0.78rem',
          fontWeight: 600,
          fontFamily: theme.fontFamily,
          transition: `all ${dur} ${theme.animEasing}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        {saved ? <><Check size={13} /> Saved!</> : 'Save Note'}
      </button>
    </div>
  );
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, sub, icon }: StatCardProps) {
  const { theme } = useTheme();
  const dur = `${theme.animDuration}ms`;

  return (
    <div
      style={{
        backgroundColor: theme.colors['--card'],
        borderColor: theme.colors['--border'],
        transition: `background-color ${dur} ${theme.animEasing}, border-color ${dur} ${theme.animEasing}`,
      }}
      className="rounded-2xl border p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <p style={{ color: theme.colors['--muted-foreground'], fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
          {label}
        </p>
        <span style={{ color: theme.colors['--accent'], opacity: 0.8 }}>{icon}</span>
      </div>
      <p style={{ color: theme.colors['--card-foreground'], fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ color: theme.colors['--muted-foreground'], fontSize: '0.68rem', marginTop: 4 }}>
        {sub}
      </p>
    </div>
  );
}

// ─── Theme Icon ───────────────────────────────────────────────────────────────

function ThemeIcon({ themeId }: { themeId: string }) {
  if (themeId === 'focus-flow') return <Monitor size={18} />;
  if (themeId === 'cozy-cabin') return <Flame size={18} />;
  if (themeId === 'modern-workspace') return <Monitor size={18} />;
  if (themeId === 'library') return <BookOpen size={18} />;
  if (themeId === 'night-city') return <Monitor size={18} />;
  if (themeId === 'forest') return <Coffee size={18} />;
  if (themeId === 'cafe') return <Coffee size={18} />;
  if (themeId === 'space-station') return <Monitor size={18} />;
  return <Monitor size={18} />;
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export function Workspace() {
  const { theme, audioEnabled, toggleAudio } = useTheme();
  const [sessions, setSessions] = useState(3);
  const [tasksDone, setTasksDone] = useState(7);
  const [focusMinutes, setFocusMinutes] = useState(68);
  const [search, setSearch] = useState('');

  useThemeAudio(theme.audio.type, audioEnabled);

  const dur = `${theme.animDuration}ms`;

  const pageVariants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1, transition: { duration: theme.animDuration / 1000, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: (theme.animDuration / 2) / 1000 } },
  };

  return (
    <div
      style={{
        backgroundImage: theme.pattern,
        backgroundSize: '20px 20px',
        transition: `background-color ${dur} ${theme.animEasing}`,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <header
        style={{
          backgroundColor: theme.colors['--card'],
          borderColor: theme.colors['--border'],
          transition: `background-color ${dur} ${theme.animEasing}, border-color ${dur} ${theme.animEasing}`,
          flexShrink: 0,
        }}
        className="border-b px-6 py-3 flex items-center gap-4"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            style={{
              backgroundColor: theme.colors['--primary'],
              color: theme.colors['--primary-foreground'],
              borderRadius: 9,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `background-color ${dur} ${theme.animEasing}`,
            }}
          >
            <ThemeIcon themeId={theme.id} />
          </div>
          <div>
            <span style={{ color: theme.colors['--foreground'], fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              FlowSpace
            </span>
            <span
              style={{
                backgroundColor: theme.colors['--secondary'],
                color: theme.colors['--muted-foreground'],
                fontSize: '0.6rem',
                padding: '1px 6px',
                borderRadius: 20,
                marginLeft: 6,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                transition: `all ${dur} ${theme.animEasing}`,
              }}
            >
              {theme.name}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs mx-auto relative">
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors['--muted-foreground'],
            }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks, notes..."
            style={{
              width: '100%',
              backgroundColor: theme.colors['--input-background'],
              color: theme.colors['--foreground'],
              border: `1px solid ${theme.colors['--border']}`,
              borderRadius: 9,
              padding: '6px 10px 6px 28px',
              fontSize: '0.77rem',
              outline: 'none',
              fontFamily: theme.fontFamily,
              transition: `all ${dur} ${theme.animEasing}`,
            }}
          />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Audio toggle */}
          <button
            onClick={toggleAudio}
            style={{
              backgroundColor: audioEnabled ? theme.colors['--primary'] : theme.colors['--secondary'],
              color: audioEnabled ? theme.colors['--primary-foreground'] : theme.colors['--muted-foreground'],
              border: `1px solid ${audioEnabled ? theme.colors['--primary'] : theme.colors['--border']}`,
              borderRadius: 9,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 600,
              fontFamily: theme.fontFamily,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: `all ${dur} ${theme.animEasing}`,
            }}
          >
            {audioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            {audioEnabled ? theme.audio.label : 'Audio Off'}
          </button>

          {/* Notifications */}
          <button
            style={{
              backgroundColor: theme.colors['--secondary'],
              color: theme.colors['--secondary-foreground'],
              border: `1px solid ${theme.colors['--border']}`,
              borderRadius: 9,
              width: 34,
              height: 34,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: `all ${dur} ${theme.animEasing}`,
            }}
          >
            <Bell size={14} />
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: theme.colors['--primary'],
                transition: `background-color ${dur} ${theme.animEasing}`,
              }}
            />
          </button>

          {/* Avatar */}
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              backgroundColor: theme.colors['--accent'],
              color: theme.colors['--accent-foreground'],
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `background-color ${dur} ${theme.animEasing}`,
            }}
          >
            JD
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={theme.id}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="p-6 flex flex-col gap-5"
          >
            {/* Page heading */}
            <div>
              <h1
                style={{
                  color: theme.colors['--foreground'],
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.2,
                }}
              >
                Good afternoon, Jamie.
              </h1>
              <p style={{ color: theme.colors['--muted-foreground'], fontSize: '0.8rem', marginTop: 3 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                {' · '}
                {theme.description}
              </p>
            </div>

            {/* 3-column grid */}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <FocusTimer onSessionComplete={() => {
                setSessions(s => s + 1);
                setFocusMinutes(m => m + 25);
              }} />
              <TaskList onTaskComplete={() => setTasksDone(d => d + 1)} />
              <QuickNotes />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                label="Sessions"
                value={sessions}
                sub="today's focus blocks"
                icon={<Coffee size={16} />}
              />
              <StatCard
                label="Tasks Done"
                value={tasksDone}
                sub="completed this week"
                icon={<Check size={16} />}
              />
              <StatCard
                label="Focus Time"
                value={`${focusMinutes}m`}
                sub="total deep work today"
                icon={<Monitor size={16} />}
              />
              <StatCard
                label="Day Streak"
                value="12"
                sub="consecutive active days"
                icon={<Flame size={16} />}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
