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
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const TABLE = process.env.AUDIO_FILE_TABLE!;
const BUCKET = process.env.AUDIO_BUCKET!;

const docs = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});

const UPLOAD_URL_TTL_SECONDS = 15 * 60;
const PLAY_URL_TTL_SECONDS = 60 * 60;

const ALLOWED_CONTENT_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/x-m4a",
  "audio/mp4",
];

const MAX_SIZE_BYTES = 50 * 1024 * 1024;

interface AudioFileRecord {
  id: string;
  name: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storageKey: string;
  status: "uploading" | "ready";
  addedAt: string;
}

const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
};

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
  return respond(statusCode, { message });
}

function corsPreflight(): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: CORS_HEADERS,
    body: "",
  };
}

async function withPlayUrl(record: AudioFileRecord) {
  const playUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: record.storageKey,
    }),
    {
      expiresIn: PLAY_URL_TTL_SECONDS,
    },
  );

  return {
    id: record.id,
    name: record.name,
    fileName: record.fileName,
    contentType: record.contentType,
    sizeBytes: record.sizeBytes,
    status: record.status,
    addedAt: record.addedAt,
    playUrl,
  };
}

function parseBody(
  event: APIGatewayProxyEvent,
): Record<string, unknown> {
  if (!event.body) {
    return {};
  }

  try {
    return JSON.parse(event.body) as Record<string, unknown>;
  } catch {
    throw new Error("Request body is not valid JSON");
  }
}

async function listAudioFiles(): Promise<APIGatewayProxyResult> {
  const result = await docs.send(
    new ScanCommand({
      TableName: TABLE,
    }),
  );

  const records = ((result.Items ?? []) as AudioFileRecord[])
    .filter((record) => record.status === "ready")
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt));

  const audioFiles = await Promise.all(
    records.map(withPlayUrl),
  );

  return respond(200, { audioFiles });
}

async function getAudioFile(
  id: string,
): Promise<APIGatewayProxyResult> {
  const result = await docs.send(
    new GetCommand({
      TableName: TABLE,
      Key: { id },
    }),
  );

  if (!result.Item) {
    return fail(404, "Audio file not found");
  }

  const record = result.Item as AudioFileRecord;

  if (record.status !== "ready") {
    return respond(200, record);
  }

  return respond(200, await withPlayUrl(record));
}

async function createAudioFile(
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const body = parseBody(event);

  const name =
    typeof body.name === "string"
      ? body.name.trim()
      : "";

  const fileName =
    typeof body.fileName === "string"
      ? body.fileName.trim()
      : "";

  const contentType =
    typeof body.contentType === "string"
      ? body.contentType
      : "";

  const sizeBytes =
    typeof body.sizeBytes === "number"
      ? body.sizeBytes
      : 0;

  if (!name) {
    return fail(400, "A name is required");
  }

  if (!fileName) {
    return fail(400, "A file is required");
  }

  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return fail(
      415,
      "That file type is not supported. Choose an mp3, wav, ogg or m4a file.",
    );
  }

  if (
    sizeBytes <= 0 ||
    sizeBytes > MAX_SIZE_BYTES
  ) {
    return fail(
      413,
      `Audio files must be between 1 byte and ${
        MAX_SIZE_BYTES / 1024 / 1024
      } MB`,
    );
  }

  const id = crypto.randomUUID();

  const record: AudioFileRecord = {
    id,
    name,
    fileName,
    contentType,
    sizeBytes,
    storageKey: `audio/${id}/${fileName}`,
    status: "uploading",
    addedAt: new Date().toISOString(),
  };

  await docs.send(
    new PutCommand({
      TableName: TABLE,
      Item: record,
    }),
  );

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: record.storageKey,
      ContentType: contentType,
    }),
    {
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    },
  );

  return respond(201, {
    audioFile: record,
    uploadUrl,
  });
}

async function markAudioFileReady(
  id: string,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> {
  const body = parseBody(event);

  if (body.status !== "ready") {
    return fail(400, 'status must be "ready"');
  }

  const existing = await docs.send(
    new GetCommand({
      TableName: TABLE,
      Key: { id },
    }),
  );

  if (!existing.Item) {
    return fail(404, "Audio file not found");
  }

  const updated = await docs.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { id },
      UpdateExpression: "SET #status = :ready",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":ready": "ready",
      },
      ReturnValues: "ALL_NEW",
    }),
  );

  return respond(
    200,
    await withPlayUrl(
      updated.Attributes as AudioFileRecord,
    ),
  );
}

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const id = event.pathParameters?.audioFileId;

  try {
    if (event.httpMethod === "OPTIONS") {
      return corsPreflight();
    }

    switch (`${event.httpMethod} ${event.resource}`) {
      case "GET /audio-files":
        return await listAudioFiles();

      case "POST /audio-files":
        return await createAudioFile(event);

      case "GET /audio-files/{audioFileId}":
        return id
          ? await getAudioFile(id)
          : fail(
              400,
              "An audio file id is required",
            );

      case "PATCH /audio-files/{audioFileId}":
        return id
          ? await markAudioFileReady(id, event)
          : fail(
              400,
              "An audio file id is required",
            );

      default:
        return fail(404, "Unknown route");
    }
  } catch (error) {
    console.error(
      "audio-files request failed",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unexpected error";

    return fail(500, message);
  }
};