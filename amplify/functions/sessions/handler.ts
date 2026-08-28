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

const SESSION_TABLE = process.env.SESSION_TABLE!;

const docs = DynamoDBDocumentClient.from(
    new DynamoDBClient({})
);

type SessionStatus =
    | "configured"
    | "in_progress"
    | "paused"
    | "completed";

interface SessionRecord {
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

const CORS_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "Content-Type,Authorization",
    "Access-Control-Allow-Methods":
        "GET,POST,PATCH,OPTIONS",
};

function respond(
    statusCode: number,
    body: unknown
): APIGatewayProxyResult {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(body),
    };
}

function fail(
    statusCode: number,
    message: string
): APIGatewayProxyResult {
    return respond(statusCode, { message });
}

function parseBody(
    event: APIGatewayProxyEvent
): Record<string, unknown> {
    if (!event.body) return {};

    try {
        return JSON.parse(
            event.body
        ) as Record<string, unknown>;
    } catch {
        throw new Error(
            "Request body is not valid JSON"
        );
    }
}

function getUserId(
    event: APIGatewayProxyEvent
): string | null {
    const claims =
        event.requestContext.authorizer?.claims;

    if (!claims) {
        return null;
    }

    const sub = claims.sub;

    return typeof sub === "string"
        ? sub
        : null;
}

async function createSession(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    const userId = getUserId(event);

    if (!userId) {
        return fail(401, "User is not authenticated");
    }

    const body = parseBody(event);

    const durationMinutes =
        typeof body.durationMinutes === "number"
            ? body.durationMinutes
            : Number(body.durationMinutes);

    const objective =
        typeof body.objective === "string"
            ? body.objective.trim()
            : "";

    const task =
        typeof body.task === "string"
            ? body.task.trim()
            : "";

    if (
        !Number.isFinite(durationMinutes) ||
        durationMinutes <= 0
    ) {
        return fail(
            400,
            "A valid duration is required"
        );
    }

    if (!objective) {
        return fail(
            400,
            "An objective is required"
        );
    }

    if (!task) {
        return fail(
            400,
            "A task is required"
        );
    }

    const now = new Date().toISOString();

    const record: SessionRecord = {
        id: crypto.randomUUID(),
        userId,

        durationMinutes,
        objective,
        task,

        status: "configured",

        createdAt: now,
    };

    if (typeof body.audioId === "string") {
        record.audioId = body.audioId;
    }

    if (typeof body.audioName === "string") {
        record.audioName = body.audioName;
    }

    if (
        body.audioType === "playlist" ||
        body.audioType === "track"
    ) {
        record.audioType = body.audioType;
    }

    await docs.send(
        new PutCommand({
            TableName: SESSION_TABLE,
            Item: record,
        })
    );

    return respond(201, {
        session: record,
    });
}

async function listSessions(
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    const userId = getUserId(event);

    if (!userId) {
        return fail(401, "User is not authenticated");
    }

    const result = await docs.send(
        new ScanCommand({
            TableName: SESSION_TABLE,
            FilterExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId,
            },
        })
    );

    const sessions = (
        (result.Items ?? []) as SessionRecord[]
    ).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
    );

    return respond(200, {
        sessions,
    });
}

async function getSession(
    id: string,
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    const userId = getUserId(event);

    if (!userId) {
        return fail(401, "User is not authenticated");
    }

    const result = await docs.send(
        new GetCommand({
            TableName: SESSION_TABLE,
            Key: { id },
        })
    );

    if (!result.Item) {
        return fail(404, "Session not found");
    }

    const session =
        result.Item as SessionRecord;

    if (session.userId !== userId) {
        return fail(403, "Forbidden");
    }

    return respond(200, {
        session,
    });
}

async function updateSession(
    id: string,
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
    const userId = getUserId(event);

    if (!userId) {
        return fail(401, "User is not authenticated");
    }

    const existing = await docs.send(
        new GetCommand({
            TableName: SESSION_TABLE,
            Key: { id },
        })
    );

    if (!existing.Item) {
        return fail(404, "Session not found");
    }

    const session =
        existing.Item as SessionRecord;

    if (session.userId !== userId) {
        return fail(403, "Forbidden");
    }

    const body = parseBody(event);

    const nextStatus =
        typeof body.status === "string"
            ? body.status
            : undefined;

    const allowedStatuses: SessionStatus[] = [
        "configured",
        "in_progress",
        "paused",
        "completed",
    ];

    if (
        !nextStatus ||
        !allowedStatuses.includes(
            nextStatus as SessionStatus
        )
    ) {
        return fail(
            400,
            "A valid session status is required"
        );
    }

    const now = new Date().toISOString();

    let updateExpression =
        "SET #status = :status";

    const names: Record<string, string> = {
        "#status": "status",
    };

    const values: Record<string, unknown> = {
        ":status": nextStatus,
    };

    if (
        nextStatus === "in_progress" &&
        !session.startedAt
    ) {
        updateExpression +=
            ", startedAt = :startedAt";

        values[":startedAt"] = now;
    }

    if (nextStatus === "completed") {
        updateExpression +=
            ", completedAt = :completedAt";

        values[":completedAt"] = now;
    }

    const updated = await docs.send(
        new UpdateCommand({
            TableName: SESSION_TABLE,
            Key: { id },

            UpdateExpression: updateExpression,

            ExpressionAttributeNames: names,
            ExpressionAttributeValues: values,

            ReturnValues: "ALL_NEW",
        })
    );

    return respond(200, {
        session:
            updated.Attributes as SessionRecord,
    });
}

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    const id =
        event.pathParameters?.sessionId;

    try {
        switch (
        `${event.httpMethod} ${event.resource}`
        ) {
            case "GET /sessions":
                return await listSessions(event);

            case "POST /sessions":
                return await createSession(event);

            case "GET /sessions/{sessionId}":
                return id
                    ? await getSession(id, event)
                    : fail(
                        400,
                        "A session id is required"
                    );

            case "PATCH /sessions/{sessionId}":
                return id
                    ? await updateSession(id, event)
                    : fail(
                        400,
                        "A session id is required"
                    );

            default:
                return fail(
                    404,
                    "Unknown route"
                );
        }
    } catch (error) {
        console.error(
            "sessions request failed",
            error
        );

        const message =
            error instanceof Error
                ? error.message
                : "Unexpected error";

        return fail(500, message);
    }
};