import fs from "fs";
import path from "path";

/**
 * `amplify_outputs.json` is written at the repo root by `npx ampx sandbox` and is not
 * committed, so everything here degrades to "not ready" rather than throwing on import.
 */
const OUTPUTS_FILE = path.resolve(__dirname, "..", "..", "amplify_outputs.json");

interface Outputs {
  auth?: { user_pool_id?: string; aws_region?: string };
  storage?: { bucket_name?: string };
  custom?: { apiUrl?: string };
}

const outputs: Outputs = fs.existsSync(OUTPUTS_FILE)
  ? (JSON.parse(fs.readFileSync(OUTPUTS_FILE, "utf8")) as Outputs)
  : {};

/** Where the Vite dev server is serving the app. */
export const APP_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

/** Base URL of the REST API, without a trailing slash. */
export const API_BASE_URL = String(outputs.custom?.apiUrl ?? "").replace(/\/$/, "");

export const USER_POOL_ID = outputs.auth?.user_pool_id ?? "";
export const AWS_REGION = outputs.auth?.aws_region ?? "";
export const AUDIO_BUCKET = outputs.storage?.bucket_name ?? "";

/**
 * Set `E2E_AUDIO_FILE_TABLE` to the sandbox's audio file table name to have teardown
 * delete the rows and stored files each spec created. Left unset, added audio stays in
 * the sandbox and specs rely on temporal isolation instead — see e2e/README.md.
 */
export const AUDIO_FILE_TABLE = process.env.E2E_AUDIO_FILE_TABLE ?? "";

/**
 * An already-confirmed account to sign in with. Set both to run without AWS credentials;
 * left unset, each test creates and then disables its own account through Cognito.
 */
export const PROVIDED_EMAIL = process.env.E2E_EMAIL ?? "";
export const PROVIDED_PASSWORD = process.env.E2E_PASSWORD ?? "";

/** True when a sandbox has been deployed and its outputs carry everything the specs need. */
export const backendReady = Boolean(API_BASE_URL && USER_POOL_ID && AWS_REGION);

export const backendNotReadyReason = fs.existsSync(OUTPUTS_FILE)
  ? "amplify_outputs.json is missing the API url or user pool — redeploy with `npx ampx sandbox`"
  : "No sandbox deployed — run `npx ampx sandbox` at the repo root first";
