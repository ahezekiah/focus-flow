import { useState } from "react";
import { confirmSignUp, signIn, signUp } from "aws-amplify/auth";
import type { DashTheme } from "./themes";

type Mode = "signIn" | "signUp" | "confirm";

/**
 * Compact account panel. Adding audio files is a signed-in action, and the
 * dashboard has no sign-in of its own yet, so it lives here.
 */
export function AudioAccountPanel({
  theme,
  onSignedIn,
}: {
  theme: DashTheme;
  onSignedIn: () => void;
}) {
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle = {
    background: theme.overlay(0.05),
    border: `1px solid ${theme.border}`,
    color: theme.foreground,
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (mode === "signIn") {
        await signIn({ username: email, password });
        onSignedIn();
      } else if (mode === "signUp") {
        await signUp({ username: email, password, options: { userAttributes: { email } } });
        setMode("confirm");
      } else {
        await confirmSignUp({ username: email, confirmationCode: code });
        await signIn({ username: email, password });
        onSignedIn();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work — try again");
    } finally {
      setBusy(false);
    }
  };

  const label = mode === "signIn" ? "Sign in" : mode === "signUp" ? "Create account" : "Confirm";

  return (
    <div
      className="rounded-2xl p-5 mb-5 max-w-md"
      style={{ background: theme.card, border: `1px solid ${theme.border}` }}
    >
      <p className="text-sm font-semibold mb-1" style={{ color: theme.foreground }}>
        Sign in to add audio files
      </p>
      <p className="text-xs mb-4" style={{ color: theme.mutedFg }}>
        Browsing is open to everyone — adding audio needs an account.
      </p>

      <div className="space-y-2.5">
        {mode === "confirm" ? (
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Confirmation code from your email"
            className="w-full rounded-xl px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
        ) : (
          <>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="Email"
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              type="password"
              autoComplete={mode === "signUp" ? "new-password" : "current-password"}
              placeholder="Password"
              className="w-full rounded-xl px-3 py-2 text-sm outline-none"
              style={inputStyle}
            />
          </>
        )}
      </div>

      {error && (
        <p className="text-xs mt-3" style={{ color: "#ef4444" }} role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-40"
          style={{ background: theme.primary, color: theme.primaryFg }}
        >
          {busy ? "Working…" : label}
        </button>

        {mode !== "confirm" && (
          <button
            onClick={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              setError(null);
            }}
            className="text-xs underline"
            style={{ color: theme.mutedFg }}
          >
            {mode === "signIn" ? "Create an account" : "I already have an account"}
          </button>
        )}
      </div>
    </div>
  );
}
