import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { isBackendConfigured } from "./amplify";

async function currentlySignedIn(): Promise<boolean> {
  if (!isBackendConfigured) return false;
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

/** Tracks whether someone is signed in, so write actions can be offered or hidden. */
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(isBackendConfigured);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void currentlySignedIn().then(result => {
      if (cancelled) return;
      setSignedIn(result);
      setChecking(false);
    });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  /** Re-checks after a sign-in or sign-out. */
  const refresh = useCallback(() => setTick(t => t + 1), []);

  return { signedIn, checking, refresh };
}
