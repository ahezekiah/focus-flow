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

/**
 * One audio file as it sits in a playlist, ready to play.
 */
export interface PlaylistTrack {
  id: string;
  name: string;
  playUrl: string;
}

export interface Playlist {
  id: string;
  name: string;

  /**
   * True for the playlist a customer hears when they enter the experience.
   */
  isDefault: boolean;

  createdAt: string;
  tracks: PlaylistTrack[];
}

/**
 * Thrown for any non-2xx response so callers can show the server's message.
 */
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
 * Gets the Cognito access token used to authorize API requests.
 *
 * IMPORTANT:
 * Use accessToken here, not idToken.
 *
 * The Authorization header is:
 * Authorization: Bearer <access-token>
 */
async function authHeaders(): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession();

    const token = session.tokens?.accessToken?.toString();

    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.warn("Could not retrieve Amplify auth session:", error);
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

  const headers = await authHeaders();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then(body => {
        if (
          body &&
          typeof body === "object" &&
          "message" in body &&
          typeof (body as { message?: unknown }).message === "string"
        ) {
          return (body as { message: string }).message;
        }

        return undefined;
      })
      .catch(() => undefined);

    throw new ApiError(
      response.status,
      message ?? `Request failed (${response.status})`,
    );
  }

  /*
   * Some successful endpoints may return an empty body.
   */
  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

/**
 * GET /api/audio-files
 *
 * Every audio file that has finished being added.
 */
export async function listAudioFiles(): Promise<AudioFile[]> {
  const { audioFiles } = await request<{
    audioFiles: AudioFile[];
  }>("/audio-files");

  return audioFiles;
}

/**
 * Adds one audio file:
 * reserves the record, uploads the file to storage,
 * then marks it ready.
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

  /*
   * The upload URL is a presigned S3 URL.
   * Do NOT send the Cognito Authorization header to it.
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
      "The audio file could not be uploaded",
    );
  }

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
 * Every playlist a designer has saved,
 * with its playable tracks.
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
 * The playlist a customer hears on arrival.
 * Resolves with null while no playlist exists.
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
 * Saves a playlist under the given name,
 * holding only the chosen audio files.
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
 * Makes this playlist the one new customers hear.
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