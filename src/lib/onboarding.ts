export interface OnboardingAccount {
  name: string;
  email: string;
}

export interface OnboardingSession {
  duration: number;
  type: string;
}

export interface OnboardingProject {
  name: string;
}

export interface OnboardingTask {
  title: string;
}

export interface OnboardingMusic {
  option: string;
}

export interface OnboardingStreak {
  goal: string;
}

export type OnboardingStep =
  | "account"
  | "sessions"
  | "projects"
  | "tasks"
  | "music"
  | "streaks"
  | "done";

export interface OnboardingState {
  completed: boolean;
  step: OnboardingStep;
  account?: OnboardingAccount;
  session?: OnboardingSession;
  project?: OnboardingProject;
  task?: OnboardingTask;
  music?: OnboardingMusic;
  streak?: OnboardingStreak;
}

const STATE_KEY = "focusflow.onboarding";
const EMAILS_KEY = "focusflow.registeredEmails";

const DEFAULT_STATE: OnboardingState = {
  completed: false,
  step: "account",
};

export function getOnboardingState(): OnboardingState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveOnboardingState(state: OnboardingState): void {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function isOnboardingComplete(): boolean {
  return getOnboardingState().completed;
}

function getRegisteredEmails(): string[] {
  try {
    const raw = localStorage.getItem(EMAILS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registerEmail(email: string): void {
  const emails = getRegisteredEmails();
  const normalized = email.trim().toLowerCase();
  if (!emails.includes(normalized)) {
    localStorage.setItem(EMAILS_KEY, JSON.stringify([...emails, normalized]));
  }
}

export function isEmailTaken(email: string): boolean {
  return getRegisteredEmails().includes(email.trim().toLowerCase());
}
