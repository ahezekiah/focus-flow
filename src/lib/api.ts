import { fetchAuthSession } from "aws-amplify/auth";
import { apiBaseUrl, isBackendConfigured } from "./amplify";

export interface AudioFile {
  id: string;
  name: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  status: "uploading" | "ready";
  addedAt: string;
  playUrl?: string;
}

/** One audio file as it sits in a playlist, ready to play. */
export interface PlaylistTrack {
  id: string;
  name: string;
  playUrl: string;
}

export interface Playlist {
  id: string;
  name: string;
  /** True for the playlist a customer hears when they enter the experience. */
  isDefault: boolean;
  createdAt: string;
  tracks: PlaylistTrack[];
}

export type SessionStatus =
  | "configured"
  | "in_progress"
  | "paused"
  | "completed";

export interface FocusSession {
  id: string;
  userId: string;

  durationMinutes: number;
  objective: string;
  task: string;

  audioId?: string;
  audioName?: string;
  audioType?: "playlist" | "track";

  status: SessionStatus;

  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}


/** Thrown for any non-2xx response so callers can show the server's message. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const BACKEND_UNAVAILABLE =
  "No Amplify backend is connected yet. Run `npx ampx sandbox` to deploy one.";

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const token = (await fetchAuthSession()).tokens?.idToken?.toString();
    return token ? { Authorization: token } : {};
  } catch {
    return {};
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isBackendConfigured || !apiBaseUrl) throw new ApiError(0, BACKEND_UNAVAILABLE);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(await authHeaders()),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then(body => (body as { message?: string }).message)
      .catch(() => undefined);
    throw new ApiError(response.status, message ?? `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

/** GET /api/audio-files — every audio file that has finished being added. */
export async function listAudioFiles(): Promise<AudioFile[]> {
  const { audioFiles } = await request<{ audioFiles: AudioFile[] }>("/audio-files");
  return audioFiles;
}

/**
 * Adds one audio file: reserves the record, uploads the file to storage, then
 * marks it ready. Resolves with the playable audio file.
 */
export async function addAudioFile(name: string, file: File): Promise<AudioFile> {
  const contentType = file.type || "audio/mpeg";

  const { audioFile, uploadUrl } = await request<{ audioFile: AudioFile; uploadUrl: string }>(
    "/audio-files",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        fileName: file.name,
        contentType,
        sizeBytes: file.size,
      }),
    },
  );

  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!upload.ok) throw new ApiError(upload.status, "The audio file could not be uploaded");

  return request<AudioFile>(`/audio-files/${audioFile.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "ready" }),
  });
}

/** GET /playlists — every playlist a designer has saved, with its playable tracks. */
export async function listPlaylists(): Promise<Playlist[]> {
  const { playlists } = await request<{ playlists: Playlist[] }>("/playlists");
  return playlists;
}

/**
 * GET /playlists/default — the playlist a customer hears on arrival.
 * Resolves with `null` while no playlist has been created yet.
 */
export async function getDefaultPlaylist(): Promise<Playlist | null> {
  try {
    const { playlist } = await request<{ playlist: Playlist }>("/playlists/default");
    return playlist;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** POST /playlists — saves a playlist under the given name, holding only the chosen audio. */
export async function createPlaylist(name: string, audioFileIds: string[]): Promise<Playlist> {
  const { playlist } = await request<{ playlist: Playlist }>("/playlists", {
    method: "POST",
    body: JSON.stringify({ name, audioFileIds }),
  });
  return playlist;
}

/** PATCH /playlists/{id} — makes this the playlist new customers hear. */
export async function makePlaylistDefault(playlistId: string): Promise<Playlist> {
  const { playlist } = await request<{ playlist: Playlist }>(`/playlists/${playlistId}`, {
    method: "PATCH",
    body: JSON.stringify({ isDefault: true }),
  });
  return playlist;
}

export async function createSession(input: {
  durationMinutes: number;
  objective: string;
  task: string;

  audioId?: string;
  audioName?: string;
  audioType?: "playlist" | "track";
}): Promise<FocusSession> {
  const { session } = await request<{
    session: FocusSession;
  }>("/sessions", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return session;
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus
): Promise<FocusSession> {
  const { session } = await request<{
    session: FocusSession;
  }>(`/sessions/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
    }),
  });

  return session;
}

export async function listSessions(): Promise<
  FocusSession[]
> {
  const { sessions } = await request<{
    sessions: FocusSession[];
  }>("/sessions");

  return sessions;
}