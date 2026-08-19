import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { getAccountByEmail, verifyPassword, setSession, type AccountRecord } from "./lib/accounts";

export default function SignIn({ onSignedIn }: { onSignedIn: (account: AccountRecord) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Enter your email and password to sign in.");
      return;
    }

    setSubmitting(true);
    const account = getAccountByEmail(trimmedEmail);
    const valid = account ? await verifyPassword(trimmedEmail, password) : false;
    setSubmitting(false);

    if (!account || !valid) {
      setError("Incorrect email or password.");
      return;
    }

    setError(null);
    setSession(account.email);
    onSignedIn(account);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-display text-xl">Sign in</CardTitle>
          <CardDescription>Welcome back — pick up right where you left off.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="si-email">Email</Label>
              <Input id="si-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-invalid={!!error} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="si-password">Password</Label>
              <Input id="si-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" aria-invalid={!!error} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
            <Link to="/onboarding" className="text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
              New here? Create an account
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
