import { useState, type ReactNode } from "react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  getOnboardingState,
  saveOnboardingState,
  isEmailTaken,
  registerEmail,
  type OnboardingState,
  type OnboardingStep,
  type OnboardingAccount,
  type OnboardingSession,
  type OnboardingProject,
  type OnboardingTask,
  type OnboardingMusic,
  type OnboardingStreak,
} from "./lib/onboarding";

// ── Shared step data ─────────────────────────────────────────────
const STEP_ORDER: OnboardingStep[] = ["account", "sessions", "projects", "tasks", "music", "streaks", "done"];

const SESSION_DURATIONS = [25, 45, 60, 90];
const SESSION_TYPES = ["Homework", "Coding", "Essay", "Design", "Reading", "Research"];
const PROJECT_TEMPLATES = ["Coding Sprint", "Study Plan", "Reading List", "Personal Projects"];
const MUSIC_OPTIONS = ["Lo-fi Beats", "Classical", "Nature Sounds", "Ambient Electronic", "No Music"];
const STREAK_GOALS = ["15 minutes a day", "30 minutes a day", "1 hour a day", "2 hours a day"];

// ── Progress indicator ───────────────────────────────────────────
function ProgressDots({ step }: { step: OnboardingStep }) {
  const idx = STEP_ORDER.indexOf(step);
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEP_ORDER.map((s, i) => (
        <div
          key={s}
          className="h-1.5 flex-1 rounded-full transition-colors"
          style={{ background: i <= idx ? "var(--primary)" : "var(--border)" }}
        />
      ))}
    </div>
  );
}

// ── Reusable pill choice group ───────────────────────────────────
function ChoicePills({
  options, value, onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
            style={{
              borderColor: active ? "var(--primary)" : "var(--border)",
              background: active ? "var(--primary)" : "transparent",
              color: active ? "var(--primary-foreground)" : "var(--foreground)",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

// ── Reusable step shell (explanation + prompt + footer) ──────────
function StepShell({
  title, explanation, prompt, children, onBack, onContinue, continueLabel = "Continue",
}: {
  title: string;
  explanation: string;
  prompt?: string | null;
  children: ReactNode;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
}) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-xl">{title}</CardTitle>
        <CardDescription>{explanation}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {prompt && <p className="text-sm text-destructive">{prompt}</p>}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
        <Button type="button" onClick={onContinue}>{continueLabel}</Button>
      </CardFooter>
    </Card>
  );
}

// ── Step: Account ─────────────────────────────────────────────────
function AccountStep({ initial, onContinue }: {
  initial?: OnboardingAccount;
  onContinue: (account: OnboardingAccount) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const nextErrors: typeof errors = {};

    if (!trimmedName) nextErrors.name = "Please enter your name.";

    if (!trimmedEmail) {
      nextErrors.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    } else if (isEmailTaken(trimmedEmail)) {
      nextErrors.email = "An account with this email already exists.";
    }

    if (!password) {
      nextErrors.password = "Please create a password.";
    } else if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      nextErrors.password = "Use at least 8 characters, with a letter and a number.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    registerEmail(trimmedEmail);
    onContinue({ name: trimmedName, email: trimmedEmail });
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-xl">Create your account</CardTitle>
        <CardDescription>Just a few details and you're in — FocusFlow will guide you through the rest.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ob-name">Name</Label>
            <Input id="ob-name" value={name} onChange={e => setName(e.target.value)} placeholder="Jordan Smith" aria-invalid={!!errors.name} />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-email">Email</Label>
            <Input id="ob-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={!!errors.email} />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ob-password">Password</Label>
            <Input id="ob-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" aria-invalid={!!errors.password} />
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full">Create account</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// ── Step: Sessions ────────────────────────────────────────────────
function SessionsStep({ initial, onBack, onContinue }: {
  initial?: OnboardingSession;
  onBack: () => void;
  onContinue: (session: OnboardingSession) => void;
}) {
  const [duration, setDuration] = useState<number | null>(initial?.duration ?? null);
  const [type, setType] = useState<string | null>(initial?.type ?? null);
  const [prompt, setPrompt] = useState<string | null>(null);

  function handleContinue() {
    if (duration === null || !type) {
      setPrompt("Choose a session length and a focus type to continue.");
      return;
    }
    onContinue({ duration, type });
  }

  return (
    <StepShell
      title="Sessions"
      explanation="A session is a focused block of time you set aside for one task, with music and ambience tuned to help you concentrate."
      prompt={prompt}
      onBack={onBack}
      onContinue={handleContinue}
    >
      <div className="space-y-1.5">
        <Label>Session length</Label>
        <ChoicePills
          options={SESSION_DURATIONS.map(d => `${d}m`)}
          value={duration !== null ? `${duration}m` : null}
          onChange={v => setDuration(Number(v.replace("m", "")))}
        />
      </div>
      <div className="space-y-1.5">
        <Label>What will you focus on?</Label>
        <ChoicePills options={SESSION_TYPES} value={type} onChange={setType} />
      </div>
    </StepShell>
  );
}

// ── Step: Projects ────────────────────────────────────────────────
function ProjectsStep({ initial, onBack, onContinue }: {
  initial?: OnboardingProject;
  onBack: () => void;
  onContinue: (project: OnboardingProject) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [prompt, setPrompt] = useState<string | null>(null);

  function handleContinue() {
    const trimmed = name.trim();
    if (!trimmed) {
      setPrompt("Name your project or choose a template to continue.");
      return;
    }
    onContinue({ name: trimmed });
  }

  return (
    <StepShell
      title="Projects"
      explanation="A project groups related tasks together — like 'Thesis' or 'Side Hustle' — so your work stays organized."
      prompt={prompt}
      onBack={onBack}
      onContinue={handleContinue}
    >
      <div className="space-y-1.5">
        <Label htmlFor="ob-project">Project name</Label>
        <Input id="ob-project" value={name} onChange={e => setName(e.target.value)} placeholder="My First Project" />
      </div>
      <div className="space-y-1.5">
        <Label>Or pick a suggested template</Label>
        <ChoicePills options={PROJECT_TEMPLATES} value={PROJECT_TEMPLATES.includes(name) ? name : null} onChange={setName} />
      </div>
    </StepShell>
  );
}

// ── Step: Tasks ───────────────────────────────────────────────────
function TasksStep({ project, initial, onBack, onContinue }: {
  project?: OnboardingProject;
  initial?: OnboardingTask;
  onBack: () => void;
  onContinue: (task: OnboardingTask) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [prompt, setPrompt] = useState<string | null>(null);

  function handleContinue() {
    const trimmed = title.trim();
    if (!trimmed) {
      setPrompt("Add a task to continue.");
      return;
    }
    onContinue({ title: trimmed });
  }

  return (
    <StepShell
      title="Tasks"
      explanation="A task is a single, actionable item you complete during a session — like 'Read Chapter 4' or 'Fix the login bug.'"
      prompt={prompt}
      onBack={onBack}
      onContinue={handleContinue}
    >
      <div className="space-y-1.5">
        <Label htmlFor="ob-task">
          {project?.name ? `First task for ${project.name}` : "Your first task"}
        </Label>
        <Input id="ob-task" value={title} onChange={e => setTitle(e.target.value)} placeholder="Read Chapter 4" />
      </div>
    </StepShell>
  );
}

// ── Step: Music ───────────────────────────────────────────────────
function MusicStep({ initial, onBack, onContinue }: {
  initial?: OnboardingMusic;
  onBack: () => void;
  onContinue: (music: OnboardingMusic) => void;
}) {
  const [option, setOption] = useState<string | null>(initial?.option ?? null);
  const [prompt, setPrompt] = useState<string | null>(null);

  function handleContinue() {
    if (!option) {
      setPrompt("Pick a music option to continue.");
      return;
    }
    onContinue({ option });
  }

  return (
    <StepShell
      title="Music"
      explanation="Music sets the mood for a session. Choose a genre or playlist, or go with no music at all."
      prompt={prompt}
      onBack={onBack}
      onContinue={handleContinue}
    >
      <ChoicePills options={MUSIC_OPTIONS} value={option} onChange={setOption} />
    </StepShell>
  );
}

// ── Step: Streaks ─────────────────────────────────────────────────
function StreaksStep({ initial, onBack, onContinue }: {
  initial?: OnboardingStreak;
  onBack: () => void;
  onContinue: (streak: OnboardingStreak) => void;
}) {
  const [goal, setGoal] = useState<string | null>(initial?.goal ?? null);
  const [prompt, setPrompt] = useState<string | null>(null);

  function handleContinue() {
    if (!goal) {
      setPrompt("Set a daily goal to continue.");
      return;
    }
    onContinue({ goal });
  }

  return (
    <StepShell
      title="Streaks"
      explanation="A streak counts the consecutive days you complete a focus session, keeping you motivated to keep showing up."
      prompt={prompt}
      onBack={onBack}
      onContinue={handleContinue}
      continueLabel="Finish"
    >
      <ChoicePills options={STREAK_GOALS} value={goal} onChange={setGoal} />
    </StepShell>
  );
}

// ── Step: Done ────────────────────────────────────────────────────
function DoneStep({ state, onFinish }: { state: OnboardingState; onFinish: () => void }) {
  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle className="font-display text-xl">
          You're all set{state.account?.name ? `, ${state.account.name}` : ""}!
        </CardTitle>
        <CardDescription>Here's what you've set up for your first session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-left text-sm">
        {state.session && <p><span className="text-muted-foreground">Session:</span> {state.session.duration}m of {state.session.type}</p>}
        {state.project && <p><span className="text-muted-foreground">Project:</span> {state.project.name}</p>}
        {state.task && <p><span className="text-muted-foreground">Task:</span> {state.task.title}</p>}
        {state.music && <p><span className="text-muted-foreground">Music:</span> {state.music.option}</p>}
        {state.streak && <p><span className="text-muted-foreground">Daily goal:</span> {state.streak.goal}</p>}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onFinish}>Get Started</Button>
      </CardFooter>
    </Card>
  );
}

// ── Onboarding flow ───────────────────────────────────────────────
export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [state, setState] = useState<OnboardingState>(() => getOnboardingState());

  function advance(partial: Partial<OnboardingState>, nextStep: OnboardingStep) {
    setState(prev => {
      const updated = { ...prev, ...partial, step: nextStep };
      saveOnboardingState(updated);
      return updated;
    });
  }

  function goTo(step: OnboardingStep) {
    setState(prev => {
      const updated = { ...prev, step };
      saveOnboardingState(updated);
      return updated;
    });
  }

  function handleFinish() {
    const updated = { ...state, completed: true, step: "done" as const };
    saveOnboardingState(updated);
    setState(updated);
    onComplete();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <ProgressDots step={state.step} />
      </div>

      {state.step === "account" && (
        <AccountStep initial={state.account} onContinue={account => advance({ account }, "sessions")} />
      )}
      {state.step === "sessions" && (
        <SessionsStep initial={state.session} onBack={() => goTo("account")} onContinue={session => advance({ session }, "projects")} />
      )}
      {state.step === "projects" && (
        <ProjectsStep initial={state.project} onBack={() => goTo("sessions")} onContinue={project => advance({ project }, "tasks")} />
      )}
      {state.step === "tasks" && (
        <TasksStep project={state.project} initial={state.task} onBack={() => goTo("projects")} onContinue={task => advance({ task }, "music")} />
      )}
      {state.step === "music" && (
        <MusicStep initial={state.music} onBack={() => goTo("tasks")} onContinue={music => advance({ music }, "streaks")} />
      )}
      {state.step === "streaks" && (
        <StreaksStep initial={state.streak} onBack={() => goTo("music")} onContinue={streak => advance({ streak }, "done")} />
      )}
      {state.step === "done" && <DoneStep state={state} onFinish={handleFinish} />}
    </div>
  );
}
