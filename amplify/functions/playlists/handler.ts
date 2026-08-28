import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/* ============================================================
 * CONFIG
 * ========================================================== */

const PLAYLIST_TABLE =
  process.env.PLAYLIST_TABLE!;

const AUDIO_FILE_TABLE =
  process.env.AUDIO_FILE_TABLE!;

const BUCKET =
  process.env.AUDIO_BUCKET!;

const docs =
  DynamoDBDocumentClient.from(
    new DynamoDBClient({}),
  );

const s3 = new S3Client({});

const PLAY_URL_TTL_SECONDS = 60 * 60;
const MAX_TRACKS = 100;

/* ============================================================
 * TYPES
 * ========================================================== */

interface PlaylistRecord {
  id: string;
  name: string;
  audioFileIds: string[];
  isDefault: boolean;
  createdAt: string;
}

interface AudioFileRecord {
  id: string;
  name: string;
  storageKey: string;
  status: "uploading" | "ready";
}

interface PlaylistTrack {
  id: string;
  name: string;
  playUrl: string;
}

interface PlaylistView
  extends Omit<
    PlaylistRecord,
    "audioFileIds"
  > {
  tracks: PlaylistTrack[];
}

type AudioLookup = Map<
  string,
  AudioFileRecord | null
>;

/* ============================================================
 * CORS
 * ========================================================== */

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type,Authorization",
  "Access-Control-Allow-Methods":
    "GET,POST,PATCH,OPTIONS",
};

/* ============================================================
 * RESPONSES
 * ========================================================== */

function respond(
  statusCode: number,
  body: unknown,
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

function fail(
  statusCode: number,
  message: string,
): APIGatewayProxyResult {
  return respond(statusCode, {
    message,
  });
}

function optionsResponse(): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: "",
  };
}

/* ============================================================
 * HELPERS
 * ========================================================== */

function parseBody(
  event: APIGatewayProxyEvent,
): Record<string, unknown> {
  if (!event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body) as Record<
      string,
      unknown
    >;
  } catch {
    throw new Error(
      "Request body is not valid JSON",
    );
  }
}

async function audioFile(
  id: string,
  lookup: AudioLookup,
): Promise<AudioFileRecord | null> {
  if (lookup.has(id)) {
    return lookup.get(id) ?? null;
  }

  const result = await docs.send(
    new GetCommand({
      TableName: AUDIO_FILE_TABLE,
      Key: { id },
    }),
  );

  const record =
    (result.Item as
      | AudioFileRecord
      | undefined) ?? null;

  const playable =
    record?.status === "ready"
      ? record
      : null;

  lookup.set(id, playable);

  return playable;
}

async function tracksOf(
  record: PlaylistRecord,
  lookup: AudioLookup,
): Promise<PlaylistTrack[]> {
  const found = await Promise.all(
    record.audioFileIds.map(id =>
      audioFile(id, lookup),
    ),
  );

  return Promise.all(
    found
      .filter(
        (
          file,
        ): file is AudioFileRecord =>
          file !== null,
      )
      .map(async file => ({
        id: file.id,
        name: file.name,
        playUrl: await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: BUCKET,
            Key: file.storageKey,
          }),
          {
            expiresIn:
              PLAY_URL_TTL_SECONDS,
          },
        ),
      })),
  );
}

async function asView(
  record: PlaylistRecord,
  lookup: AudioLookup,
): Promise<PlaylistView> {
  return {
    id: record.id,
    name: record.name,
    isDefault: record.isDefault,
    createdAt: record.createdAt,
    tracks: await tracksOf(
      record,
      lookup,
    ),
  };
}

async function allPlaylists(): Promise<
  PlaylistRecord[]
> {
  const result = await docs.send(
    new ScanCommand({
      TableName: PLAYLIST_TABLE,
    }),
  );

  return (
    (result.Items ?? []) as PlaylistRecord[]
  ).sort((a, b) =>
    a.createdAt.localeCompare(
      b.createdAt,
    ),
  );
}

/* ============================================================
 * GET /playlists
 * ========================================================== */

async function listPlaylists(): Promise<APIGatewayProxyResult> {
  const lookup: AudioLookup = new Map();

  const records =
    await allPlaylists();

  const playlists: PlaylistView[] = [];

  for (const record of records) {
    playlists.push(
      await asView(record, lookup),
    );
  }

  return respond(200, {
    playlists,
  });
}

/* ============================================================
 * GET /playlists/default
 * ========================================================== */

async function getDefaultPlaylist(): Promise<APIGatewayProxyResult> {
  const records =
    await allPlaylists();

  /*
   * Explicit default first.
   * If none exists, use the first playlist.
   */
  const record =
    records.find(
      playlist =>
        playlist.isDefault === true,
    ) ?? records[0];

  if (!record) {
    return fail(
      404,
      "No playlist has been created yet",
    );
  }

  return respond(200, {
    playlist: await asView(
      record,
      new Map(),
    ),
  });
}

/* ============================================================
 * GET /playlists/{playlistId}
 * ========================================================== */

async function getPlaylist(
  id: string,
): Promise<APIGatewayProxyResult> {
  const result = await docs.send(
    new GetCommand({
      TableName: PLAYLIST_TABLE,
      Key: { id },
    }),
  );

  if (!result.Item) {
    return fail(
      404,
      "Playlist not found",
    );
  }

  return respond(200, {
    playlist: await asView(
      result.Item as PlaylistRecord,
      new Map(),
    ),
  });
}

/* ============================================================
 * POST /playlists
 * ========================================================== */

async function createPlaylist(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const body = parseBody(event);

  const name =
    typeof body.name === "string"
      ? body.name.trim()
      : "";

  const chosen =
    Array.isArray(body.audioFileIds)
      ? body.audioFileIds
      : [];

  const audioFileIds = [
    ...new Set(
      chosen.filter(
        (
          id,
        ): id is string =>
          typeof id === "string" &&
          !!id,
      ),
    ),
  ];

  if (!name) {
    return fail(
      400,
      "A name is required",
    );
  }

  if (audioFileIds.length === 0) {
    return fail(
      400,
      "Choose at least one audio file for the playlist",
    );
  }

  if (
    audioFileIds.length > MAX_TRACKS
  ) {
    return fail(
      400,
      `A playlist can hold up to ${MAX_TRACKS} audio files`,
    );
  }

  const lookup: AudioLookup =
    new Map();

  for (const id of audioFileIds) {
    const file =
      await audioFile(id, lookup);

    if (!file) {
      return fail(
        400,
        "One of the chosen audio files is no longer available to play",
      );
    }
  }

  const existing =
    await allPlaylists();

  const record: PlaylistRecord = {
    id: crypto.randomUUID(),
    name,
    audioFileIds,

    /*
     * First playlist automatically becomes
     * the default playlist.
     */
    isDefault: !existing.some(
      playlist =>
        playlist.isDefault === true,
    ),

    createdAt:
      new Date().toISOString(),
  };

  await docs.send(
    new PutCommand({
      TableName: PLAYLIST_TABLE,
      Item: record,
    }),
  );

  return respond(201, {
    playlist: await asView(
      record,
      lookup,
    ),
  });
}

/* ============================================================
 * PATCH /playlists/{playlistId}
 * ========================================================== */

async function makeDefault(
  id: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const body = parseBody(event);

  if (body.isDefault !== true) {
    return fail(
      400,
      "isDefault must be true",
    );
  }

  const existing =
    await docs.send(
      new GetCommand({
        TableName: PLAYLIST_TABLE,
        Key: { id },
      }),
    );

  if (!existing.Item) {
    return fail(
      404,
      "Playlist not found",
    );
  }

  const others = (
    await allPlaylists()
  ).filter(
    playlist =>
      playlist.isDefault === true &&
      playlist.id !== id,
  );

  await Promise.all(
    others.map(playlist =>
      setDefaultFlag(
        playlist.id,
        false,
      ),
    ),
  );

  const updated =
    await setDefaultFlag(id, true);

  return respond(200, {
    playlist: await asView(
      updated,
      new Map(),
    ),
  });
}

/* ============================================================
 * UPDATE DEFAULT FLAG
 * ========================================================== */

async function setDefaultFlag(
  id: string,
  isDefault: boolean,
): Promise<PlaylistRecord> {
  const updated = await docs.send(
    new UpdateCommand({
      TableName: PLAYLIST_TABLE,
      Key: { id },
      UpdateExpression:
        "SET isDefault = :isDefault",
      ExpressionAttributeValues: {
        ":isDefault": isDefault,
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return updated.Attributes as PlaylistRecord;
}

/* ============================================================
 * ROUTER
 * ========================================================== */

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  console.log(
    "playlists event:",
    JSON.stringify(event),
  );

  /*
   * IMPORTANT:
   * Always answer OPTIONS with CORS headers.
   */
  if (
    event.httpMethod?.toUpperCase() ===
    "OPTIONS"
  ) {
    return optionsResponse();
  }

  const method =
    event.httpMethod?.toUpperCase() ?? "";

  const resource =
    event.resource ?? "";

  const path =
    event.path ?? "";

  const id =
    event.pathParameters?.playlistId;

  try {
    /* --------------------------------------------------------
     * /playlists
     * ------------------------------------------------------ */

    if (
      method === "GET" &&
      resource === "/playlists"
    ) {
      return await listPlaylists();
    }

    if (
      method === "POST" &&
      resource === "/playlists"
    ) {
      return await createPlaylist(event);
    }

    /* --------------------------------------------------------
     * /playlists/default
     * ------------------------------------------------------ */

    if (
      method === "GET" &&
      resource ===
        "/playlists/default"
    ) {
      return await getDefaultPlaylist();
    }

    /* --------------------------------------------------------
     * /playlists/{playlistId}
     * ------------------------------------------------------ */

    if (
      method === "GET" &&
      resource ===
        "/playlists/{playlistId}"
    ) {
      return id
        ? await getPlaylist(id)
        : fail(
            400,
            "A playlist id is required",
          );
    }

    if (
      method === "PATCH" &&
      resource ===
        "/playlists/{playlistId}"
    ) {
      return id
        ? await makeDefault(
            id,
            event,
          )
        : fail(
            400,
            "A playlist id is required",
          );
    }

    /* --------------------------------------------------------
     * FALLBACK ROUTING
     * ------------------------------------------------------ */

    if (
      method === "GET" &&
      path === "/playlists"
    ) {
      return await listPlaylists();
    }

    if (
      method === "POST" &&
      path === "/playlists"
    ) {
      return await createPlaylist(event);
    }

    if (
      method === "GET" &&
      path === "/playlists/default"
    ) {
      return await getDefaultPlaylist();
    }

    if (
      method === "GET" &&
      id
    ) {
      return await getPlaylist(id);
    }

    if (
      method === "PATCH" &&
      id
    ) {
      return await makeDefault(
        id,
        event,
      );
    }

    return fail(
      404,
      `Unknown route: ${method} ${
        resource || path
      }`,
    );
  } catch (error) {
    console.error(
      "playlists request failed:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error";

    return fail(500, message);
  }
};
