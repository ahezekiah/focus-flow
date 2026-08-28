import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  createAccount,
  isEmailRegistered,
  updateAccount,
  type AccountRecord,
  type OnboardingStep,
  type OnboardingSession,
  type OnboardingTask,
  type OnboardingPlaylist,
  type OnboardingTheme,
} from "./lib/accounts";
import { registerIdentity } from "./lib/identity";
import { THEMES, THEME_ORDER } from "./dash/themes";

/**
 * What the account store will accept. Kept in step with the cloud password policy so
 * registration never passes here only to be turned down when the account is created.
 */
function isStrongEnough(password: string): boolean {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// ── Shared step data ─────────────────────────────────────────────
const STEP_ORDER: OnboardingStep[] = ["sessions", "tasks", "playlist", "theme", "done"];

const OWN_CHOICE = "Custom";

const SESSION_DURATIONS = [25, 45, 60, 90];
const SESSION_TYPES = ["Homework", "Coding", "Essay", "Design", "Reading", "Research"];
const PLAYLIST_OPTIONS = ["Rain", "Café", "Fireplace", "Ocean", "Forest", "Thunder", "No Playlist"];

// ── Progress indicator ───────────────────────────────────────────
function ProgressDots({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEP_ORDER.map((s, i) => (
        <div
          key={s}
          className="h-1.5 flex-1 rounded-full transition-colors"
          style={{
            background: i <= activeIndex ? "var(--primary)" : "var(--border)",
          }}
        />
      ))}
    </div>
  );
}

// ── Reusable pill choice group ───────────────────────────────────
function ChoicePills({
  groupLabel,
  options,
  value,
  onChange,
}: {
  groupLabel: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={groupLabel} className="flex flex-wrap gap-2">
      {options.map(option => {
        const active = value === option;

        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option)}
            className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
            style={{
              borderColor: active ? "var(--primary)" : "var(--border)",
              background: active ? "var(--primary)" : "transparent",
              color: active
                ? "var(--primary-foreground)"
                : "var(--foreground)",
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

// ── Reusable step shell ──────────────────────────────────────────
function StepShell({
  title,
  explanation,
  prompt,
  children,
  onBack,
  onContinue,
  continueLabel = "Continue",
}: {
  title: string;
  explanation: string;
  prompt?: string | null;
  children: ReactNode;
  onBack?: () => void;
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

        {prompt && (
          <p className="text-sm text-destructive" role="alert">
            {prompt}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
        ) : (
          <span />
        )}

        <Button type="button" onClick={onContinue}>
          {continueLabel}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Step: Account ─────────────────────────────────────────────────
function AccountStep({
  onContinue,
}: {
  onContinue: (account: AccountRecord) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    const nextErrors: typeof errors = {};

    if (!trimmedName) {
      nextErrors.name = "Please enter your name.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Please enter your email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    } else if (isEmailRegistered(trimmedEmail)) {
      nextErrors.email = "An account with this email already exists.";
    }

    if (!password) {
      nextErrors.password = "Please create a password.";
    } else if (!isStrongEnough(password)) {
      nextErrors.password =
        "Use at least 8 characters, with an upper and lower case letter, a number and a symbol.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      // The account is only useful once it can reach audio files and playlists too.
      await registerIdentity(trimmedEmail, password);
    } catch (error) {
      setSubmitting(false);
      setErrors({
        email: error instanceof Error ? error.message : "Your account could not be created.",
      });
      return;
    }

    const account = await createAccount(trimmedName, trimmedEmail, password);
    setSubmitting(false);
    onContinue(account);
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-xl">
          Create your account
        </CardTitle>

        <CardDescription>
          Just a few details and you're in — FocusFlow will guide you
          through the rest.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ob-name">Name</Label>

            <Input
              id="ob-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Jordan Smith"
              aria-invalid={!!errors.name}
            />

            {errors.name && (
              <p className="text-sm text-destructive" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ob-email">Email</Label>

            <Input
              id="ob-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
            />

            {errors.email && (
              <p className="text-sm text-destructive" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ob-password">Password</Label>
            <Input id="ob-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters, mixed case, a number and a symbol" aria-invalid={!!errors.password} />
            {errors.password && <p className="text-sm text-destructive" role="alert">{errors.password}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Creating account…" : "Create account"}
          </Button>

          <Link
            to="/signin"
            className="text-sm text-center"
            style={{ color: "var(--muted-foreground)" }}
          >
            Already have an account? Sign in
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

// ── Step: Sessions ────────────────────────────────────────────────
function pillFor(
  value: string | null,
  suggestions: string[],
): string | null {
  if (value === null) return null;
  return suggestions.includes(value) ? value : OWN_CHOICE;
}

function SessionsStep({
  initial,
  onContinue,
}: {
  initial?: OnboardingSession;
  onContinue: (session: OnboardingSession) => void;
}) {
  const savedLength = initial ? `${initial.duration}m` : null;
  const suggestedLengths = SESSION_DURATIONS.map(d => `${d}m`);

  const [lengthChoice, setLengthChoice] = useState<string | null>(
    pillFor(savedLength, suggestedLengths),
  );

  const [ownLength, setOwnLength] = useState(
    savedLength && !suggestedLengths.includes(savedLength)
      ? String(initial?.duration ?? "")
      : "",
  );

  const [typeChoice, setTypeChoice] = useState<string | null>(
    pillFor(initial?.type ?? null, SESSION_TYPES),
  );

  const [ownType, setOwnType] = useState(
    initial?.type && !SESSION_TYPES.includes(initial.type)
      ? initial.type
      : "",
  );

  const [prompt, setPrompt] = useState<string | null>(null);

  function chosenLength(): number | null {
    if (lengthChoice === OWN_CHOICE) {
      const minutes = Number(ownLength.trim());

      return Number.isFinite(minutes) && minutes > 0
        ? Math.round(minutes)
        : null;
    }

    return lengthChoice
      ? Number(lengthChoice.replace("m", ""))
      : null;
  }

  function chosenType(): string | null {
    if (typeChoice === OWN_CHOICE) {
      return ownType.trim() || null;
    }

    return typeChoice;
  }

  function handleContinue() {
    const duration = chosenLength();
    const type = chosenType();

    if (duration === null || !type) {
      setPrompt(
        "Choose a session length and a focus type, or enter your own, to continue.",
      );
      return;
    }

    onContinue({ duration, type });
  }

  return (
    <StepShell
      title="Sessions"
      explanation="A session is a focused block of time you set aside for one task, with music and ambience tuned to help you concentrate."
      prompt={prompt}
      onContinue={handleContinue}
    >
      <div className="space-y-1.5">
        <Label>Session length</Label>

        <ChoicePills
          groupLabel="Session length choices"
          options={[...suggestedLengths, OWN_CHOICE]}
          value={lengthChoice}
          onChange={setLengthChoice}
        />

        {lengthChoice === OWN_CHOICE && (
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="ob-own-length">
              Session length in minutes
            </Label>

            <Input
              id="ob-own-length"
              inputMode="numeric"
              value={ownLength}
              onChange={e => setOwnLength(e.target.value)}
              placeholder="37"
            />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>What will you focus on?</Label>

        <ChoicePills
          groupLabel="Focus type choices"
          options={[...SESSION_TYPES, OWN_CHOICE]}
          value={typeChoice}
          onChange={setTypeChoice}
        />

        {typeChoice === OWN_CHOICE && (
          <div className="space-y-1.5 pt-2">
            <Label htmlFor="ob-own-type">
              Your focus type
            </Label>

            <Input
              id="ob-own-type"
              value={ownType}
              onChange={e => setOwnType(e.target.value)}
              placeholder="Thesis edits"
            />
          </div>
        )}
      </div>
    </StepShell>
  );
}

// ── Step: Tasks ───────────────────────────────────────────────────
function TasksStep({
  initial,
  onBack,
  onContinue,
}: {
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
        <Label htmlFor="ob-task">Your first task</Label>

        <Input
          id="ob-task"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Read Chapter 4"
        />
      </div>
    </StepShell>
  );
}

// ── Step: Playlist ────────────────────────────────────────────────
function PlaylistStep({
  initial,
  onBack,
  onContinue,
}: {
  initial?: OnboardingPlaylist;
  onBack: () => void;
  onContinue: (playlist: OnboardingPlaylist) => void;
}) {
  const [option, setOption] = useState<string | null>(
    initial?.option ?? null,
  );

  const [prompt, setPrompt] = useState<string | null>(null);

  function handleContinue() {
    if (!option) {
      setPrompt(
        "Pick a playlist, or No Playlist, to continue.",
      );
      return;
    }

    onContinue({ option });
  }

  return (
    <StepShell
      title="Playlist"
      explanation="A playlist sets the mood for a session — pick the one your first session will play, or go without."
      prompt={prompt}
      onBack={onBack}
      onContinue={handleContinue}
    >
      <ChoicePills
        groupLabel="Playlist choices"
        options={PLAYLIST_OPTIONS}
        value={option}
        onChange={setOption}
      />
    </StepShell>
  );
}

// ── Step: Theme ───────────────────────────────────────────────────
function ThemeStep({
  initial,
  onBack,
  onContinue,
}: {
  initial?: OnboardingTheme;
  onBack: () => void;
  onContinue: (theme: OnboardingTheme) => void;
}) {
  const [themeId, setThemeId] = useState<string | null>(
    initial?.id ?? "focus-flow",
  );

  const [prompt, setPrompt] = useState<string | null>(null);

  function handleContinue() {
    if (!themeId) {
      setPrompt("Pick a theme to continue.");
      return;
    }

    onContinue({ id: themeId });
  }

  return (
    <StepShell
      title="Theme"
      explanation="Choose the look and feel of your workspace. It comes with you to your dashboard, and you can change it any time from Themes."
      prompt={prompt}
      onBack={onBack}
      onContinue={handleContinue}
      continueLabel="Finish"
    >
      <div
        role="group"
        aria-label="Theme choices"
        className="grid grid-cols-2 gap-3"
      >
        {THEME_ORDER.map(tid => {
          const t = THEMES[tid];
          const active = themeId === tid;

          return (
            <button
              key={tid}
              type="button"
              aria-label={t.name}
              aria-pressed={active}
              onClick={() => setThemeId(tid)}
              className="rounded-xl overflow-hidden text-left transition-all"
              style={{
                boxShadow: active
                  ? `0 0 0 2px ${t.primary}`
                  : "0 0 0 1px var(--border)",
              }}
            >
              <div
                className="h-14"
                style={{ background: t.greetingBg }}
              />

              <div
                className="p-2 flex items-center gap-1.5"
                style={{ background: t.card }}
              >
                <span className="text-sm">{t.emoji}</span>

                <span
                  className="text-xs font-medium truncate"
                  style={{ color: t.foreground }}
                >
                  {t.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

// ── Step: Done ────────────────────────────────────────────────────
function DoneStep({
  account,
  onFinish,
}: {
  account: AccountRecord;
  onFinish: () => void;
}) {
  const theme = account.theme
    ? THEMES[account.theme.id as keyof typeof THEMES]
    : undefined;

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <CardTitle className="font-display text-xl">
          You're all set, {account.name}!
        </CardTitle>

        <CardDescription>
          Here's what you've set up for your first session.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2 text-left text-sm">
        {account.session && (
          <p>
            <span className="text-muted-foreground">
              Session:
            </span>{" "}
            {account.session.duration}m of {account.session.type}
          </p>
        )}

        {account.task && (
          <p>
            <span className="text-muted-foreground">
              Task:
            </span>{" "}
            {account.task.title}
          </p>
        )}

        {account.playlist && (
          <p>
            <span className="text-muted-foreground">
              Playlist:
            </span>{" "}
            {account.playlist.option}
          </p>
        )}

        {theme && (
          <p>
            <span className="text-muted-foreground">
              Theme:
            </span>{" "}
            {theme.emoji} {theme.name}
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button className="w-full" onClick={onFinish}>
          Get Started
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Onboarding flow ───────────────────────────────────────────────
export default function Onboarding({
  account,
  onAccountChange,
}: {
  account?: AccountRecord;
  onAccountChange: (account: AccountRecord) => void;
}) {
  const step: OnboardingStep | "account" = account
    ? account.onboardingStep
    : "account";

  const activeIndex = account
    ? STEP_ORDER.indexOf(account.onboardingStep)
    : -1;

  function advance(
    partial: Partial<AccountRecord>,
    nextStep: OnboardingStep,
  ) {
    if (!account) return;

    onAccountChange(
      updateAccount(account.email, {
        ...partial,
        onboardingStep: nextStep,
      }),
    );
  }

  function goTo(prevStep: OnboardingStep) {
    if (!account) return;

    onAccountChange(
      updateAccount(account.email, {
        onboardingStep: prevStep,
      }),
    );
  }

  function handleFinish() {
    if (!account) return;

    onAccountChange(
      updateAccount(account.email, {
        onboardingCompleted: true,
        onboardingStep: "done",
      }),
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <ProgressDots activeIndex={activeIndex} />
      </div>

      {step === "account" && (
        <AccountStep onContinue={onAccountChange} />
      )}

      {account && step === "sessions" && (
        <SessionsStep
          initial={account.session}
          onContinue={session =>
            advance({ session }, "tasks")
          }
        />
      )}

      {account && step === "tasks" && (
        <TasksStep
          initial={account.task}
          onBack={() => goTo("sessions")}
          onContinue={task =>
            advance({ task }, "playlist")
          }
        />
      )}

      {account && step === "playlist" && (
        <PlaylistStep
          initial={account.playlist}
          onBack={() => goTo("tasks")}
          onContinue={playlist =>
            advance({ playlist }, "theme")
          }
        />
      )}

      {account && step === "theme" && (
        <ThemeStep
          initial={account.theme}
          onBack={() => goTo("playlist")}
          onContinue={theme =>
            advance({ theme }, "done")
          }
        />
      )}

      {account && step === "done" && (
        <DoneStep
          account={account}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}
