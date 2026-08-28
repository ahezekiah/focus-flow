import { signIn, signOut, signUp } from "aws-amplify/auth";
import { isBackendConfigured } from "./amplify";

/**
 * The cloud identity behind an account. Registering and signing in through Focus Flow
 * both settle it, so adding audio files and building playlists work without anyone
 * being asked to sign in a second time (DR-04).
 *
 * Every call is a no-op until a backend has been deployed, so the app still runs
 * against no sandbox at all.
 */

/** Cognito refuses a second identity for an address that already has one. */
function alreadyRegistered(error: unknown): boolean {
  return error instanceof Error && error.name === "UsernameExistsException";
}

/**
 * The account exists but has not been confirmed — which only happens where the pool has
 * no auto-confirm trigger yet. Registration still stands; the account panel on the audio
 * pages remains the way in until the backend catches up.
 */
function awaitingConfirmation(error: unknown): boolean {
  return error instanceof Error && error.name === "UserNotConfirmedException";
}

/** Signing in on top of an existing session is what Cognito objects to here. */
function alreadySignedIn(error: unknown): boolean {
  return error instanceof Error && error.name === "UserAlreadyAuthenticatedException";
}


/** Leaves whoever was signed in, so the next sign-in starts from a clean session. */
export async function releaseIdentity(): Promise<void> {
  if (!isBackendConfigured) return;

  try {
    await signOut();
  } catch {
    /* nobody was signed in — nothing to release */
  }
}

async function signInFresh(email: string, password: string): Promise<void> {
  try {
    await signIn({ username: email, password });
  } catch (error) {
    if (!alreadySignedIn(error)) throw error;
    // A stale session from another account was in the way.
    await releaseIdentity();
    await signIn({ username: email, password });
  }
}

/**
 * Gives a newly registered account its cloud identity and signs them in.
 * An address that already has one is signed into instead of being registered twice.
 */
export async function registerIdentity(email: string, password: string): Promise<void> {
  if (!isBackendConfigured) return;

  await releaseIdentity();

  try {
    await signUp({ username: email, password, options: { userAttributes: { email } } });
  } catch (error) {
    if (!alreadyRegistered(error)) throw error;
  }

  try {
    await signInFresh(email, password);
  } catch (error) {
    if (!awaitingConfirmation(error)) throw error;
  }
}

/**
 * Signs an existing account in. Accounts made before registration reached the cloud have
 * no identity yet, so the first sign-in creates one from the password they just gave.
 */
export async function restoreIdentity(email: string, password: string): Promise<void> {
  if (!isBackendConfigured) return;


  try {
    await signInFresh(email, password);
  } catch {
    // No identity for this address yet — register it now and carry on.
    await registerIdentity(email, password);
  }
}
