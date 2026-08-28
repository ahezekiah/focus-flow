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

export interface PlaylistTrack {
  id: string;
  name: string;
  playUrl: string;
}

export interface Playlist {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  tracks: PlaylistTrack[];
}

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

/**
 * Get the Cognito ID token.
 *
 * IMPORTANT:
 * The API Gateway Cognito User Pool authorizer is being used by
 * the backend, so send the ID token in the Authorization header.
 *
 * The header must be:
 *
 * Authorization: Bearer <id-token>
 */
async function authHeaders(): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession();

    const idToken = session.tokens?.idToken?.toString();

    if (!idToken) {
      console.warn("No Cognito ID token available.");
      return {};
    }

    return {
      Authorization: `Bearer ${idToken}`,
    };
  } catch (error) {
    console.error("Could not retrieve Cognito auth session:", error);
    return {};
  }
}

/**
 * Shared API request helper.
 */
async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!isBackendConfigured || !apiBaseUrl) {
    throw new ApiError(0, BACKEND_UNAVAILABLE);
  }

  const auth = await authHeaders();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...auth,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message: string | undefined;

    try {
      const body = await response.json();

      if (
        body &&
        typeof body === "object" &&
        "message" in body &&
        typeof (body as { message?: unknown }).message === "string"
      ) {
        message = (body as { message: string }).message;
      }
    } catch {
      // Response wasn't JSON.
    }

    if (response.status === 401) {
      throw new ApiError(
        401,
        "Unauthorized. Please sign in again.",
      );
    }

    throw new ApiError(
      response.status,
      message ?? `Request failed (${response.status})`,
    );
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(
      response.status,
      "The server returned an invalid response.",
    );
  }
}

/**
 * GET /api/audio-files
 *
 * Public endpoint.
 */
export async function listAudioFiles(): Promise<AudioFile[]> {
  const { audioFiles } = await request<{
    audioFiles: AudioFile[];
  }>("/audio-files");

  return audioFiles;
}

/**
 * POST /api/audio-files
 *
 * Requires authentication.
 */
export async function addAudioFile(
  name: string,
  file: File,
): Promise<AudioFile> {
  const contentType = file.type || "audio/mpeg";

  const { audioFile, uploadUrl } = await request<{
    audioFile: AudioFile;
    uploadUrl: string;
  }>("/audio-files", {
    method: "POST",
    body: JSON.stringify({
      name,
      fileName: file.name,
      contentType,
      sizeBytes: file.size,
    }),
  });

  /**
   * uploadUrl is a presigned S3 URL.
   *
   * IMPORTANT:
   * Do not send the Cognito Authorization header to S3.
   */
  const upload = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!upload.ok) {
    throw new ApiError(
      upload.status,
      "The audio file could not be uploaded.",
    );
  }

  /**
   * Mark the file ready after S3 upload succeeds.
   */
  return request<AudioFile>(
    `/audio-files/${encodeURIComponent(audioFile.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: "ready",
      }),
    },
  );
}

/**
 * GET /api/playlists
 *
 * Public endpoint.
 */
export async function listPlaylists(): Promise<Playlist[]> {
  const { playlists } = await request<{
    playlists: Playlist[];
  }>("/playlists");

  return playlists;
}

/**
 * GET /api/playlists/default
 *
 * Public endpoint.
 */
export async function getDefaultPlaylist(): Promise<Playlist | null> {
  try {
    const { playlist } = await request<{
      playlist: Playlist;
    }>("/playlists/default");

    return playlist;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

/**
 * POST /api/playlists
 *
 * Requires authentication.
 */
export async function createPlaylist(
  name: string,
  audioFileIds: string[],
): Promise<Playlist> {
  const { playlist } = await request<{
    playlist: Playlist;
  }>("/playlists", {
    method: "POST",
    body: JSON.stringify({
      name,
      audioFileIds,
    }),
  });

  return playlist;
}

/**
 * PATCH /api/playlists/{id}
 *
 * Requires authentication.
 */
export async function makePlaylistDefault(
  playlistId: string,
): Promise<Playlist> {
  const { playlist } = await request<{
    playlist: Playlist;
  }>(
    `/playlists/${encodeURIComponent(playlistId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        isDefault: true,
      }),
    },
  );

  return playlist;
}