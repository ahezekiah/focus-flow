import { useCallback, useEffect, useState } from "react";

import { getCurrentAccount } from "./accounts";

/**
 * Checks the FocusFlow application session.
 *
 * FocusFlow currently stores its signed-in account in
 * localStorage through accounts.ts. This must be the same
 * authentication state used by onboarding and the dashboard.
 */
function currentlySignedIn(): boolean {
  try {
    return !!getCurrentAccount();
  } catch {
    return false;
  }
}

/**
 * Tracks whether someone is signed in, so write actions
 * can be offered or hidden.
 */
export function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const result = currentlySignedIn();

    if (!cancelled) {
      setSignedIn(result);
      setChecking(false);
    }

    return () => {
      cancelled = true;
    };
  }, [tick]);

  /**
   * Re-checks after a sign-in or sign-out.
   */
  const refresh = useCallback(() => {
    setChecking(true);
    setTick(t => t + 1);
  }, []);

  return {
    signedIn,
    checking,
    refresh,
  };
}
