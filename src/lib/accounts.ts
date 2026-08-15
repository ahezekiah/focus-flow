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
  | "sessions"
  | "projects"
  | "tasks"
  | "music"
  | "streaks"
  | "done";

export interface AccountRecord {
  name: string;
  email: string;
  passwordHash: string;
  onboardingCompleted: boolean;
  onboardingStep: OnboardingStep;
  session?: OnboardingSession;
  project?: OnboardingProject;
  task?: OnboardingTask;
  music?: OnboardingMusic;
  streak?: OnboardingStreak;
}

const ACCOUNTS_KEY = "focusflow.accounts";
const SESSION_KEY = "focusflow.session";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getAccounts(): Record<string, AccountRecord> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAccounts(accounts: Record<string, AccountRecord>): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getAccountByEmail(email: string): AccountRecord | undefined {
  return getAccounts()[normalizeEmail(email)];
}

export function isEmailRegistered(email: string): boolean {
  return !!getAccountByEmail(email);
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function createAccount(name: string, email: string, password: string): Promise<AccountRecord> {
  const normalized = normalizeEmail(email);
  const account: AccountRecord = {
    name: name.trim(),
    email: normalized,
    passwordHash: await hashPassword(password),
    onboardingCompleted: false,
    onboardingStep: "sessions",
  };
  const accounts = getAccounts();
  accounts[normalized] = account;
  saveAccounts(accounts);
  setSession(normalized);
  return account;
}

export async function verifyPassword(email: string, password: string): Promise<boolean> {
  const account = getAccountByEmail(email);
  if (!account) return false;
  return (await hashPassword(password)) === account.passwordHash;
}

export function updateAccount(
  email: string,
  partial: Partial<Omit<AccountRecord, "email" | "passwordHash">>,
): AccountRecord {
  const normalized = normalizeEmail(email);
  const accounts = getAccounts();
  const existing = accounts[normalized];
  if (!existing) throw new Error("Account not found");
  const updated: AccountRecord = { ...existing, ...partial };
  accounts[normalized] = updated;
  saveAccounts(accounts);
  return updated;
}

export function getSession(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

export function setSession(email: string | null): void {
  if (email) localStorage.setItem(SESSION_KEY, email);
  else localStorage.removeItem(SESSION_KEY);
}

export function getCurrentAccount(): AccountRecord | undefined {
  const email = getSession();
  return email ? getAccountByEmail(email) : undefined;
}

export function signOut(): void {
  setSession(null);
}
