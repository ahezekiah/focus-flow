import { defineBackend } from "@aws-amplify/backend";
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { auth } from "./auth/resource";
import { storage } from "./storage/resource";
import { audioFiles } from "./functions/audio-files/resource";
import { playlists } from "./functions/playlists/resource";
import { sessions } from "./functions/sessions/resource";

const backend = defineBackend({ auth, storage, audioFiles, playlists, sessions });

const apiStack = backend.createStack("FocusFlowApi");

// ── Data ───────────────────────────────────────────────────────
const audioFileTable = new Table(backend.stack, "AudioFileTable", {
  partitionKey: { name: "id", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

const playlistTable = new Table(backend.stack, "PlaylistTable", {
  partitionKey: { name: "id", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

const sessionTable = new Table(backend.stack, "SessionTable", {
    partitionKey: { name: "id", type: AttributeType.STRING },
    billingMode: BillingMode.PAY_PER_REQUEST,
});

const bucket = backend.storage.resources.bucket;
const audioFilesLambda = backend.audioFiles.resources.lambda;
const playlistsLambda = backend.playlists.resources.lambda;
const sessionsLambda = backend.sessions.resources.lambda;

backend.audioFiles.addEnvironment("AUDIO_FILE_TABLE", audioFileTable.tableName);
backend.audioFiles.addEnvironment("AUDIO_BUCKET", bucket.bucketName);

audioFileTable.grantReadWriteData(audioFilesLambda);
bucket.grantReadWrite(audioFilesLambda);

// A playlist names audio files it does not own, so it only ever reads them.
backend.playlists.addEnvironment("PLAYLIST_TABLE", playlistTable.tableName);
backend.playlists.addEnvironment("AUDIO_FILE_TABLE", audioFileTable.tableName);
backend.playlists.addEnvironment("AUDIO_BUCKET", bucket.bucketName);
backend.sessions.addEnvironment("SESSION_TABLE", sessionTable.tableName);



playlistTable.grantReadWriteData(playlistsLambda);
audioFileTable.grantReadData(playlistsLambda);
bucket.grantRead(playlistsLambda);
sessionTable.grantReadWriteData(sessionsLambda);

// ── REST API ───────────────────────────────────────────────────
const api = new RestApi(apiStack, "FocusFlowRestApi", {
  restApiName: "focus-flow-api",
  deployOptions: { stageName: "api" },
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  },
});

const cognitoAuthorizer = new CognitoUserPoolsAuthorizer(apiStack, "FocusFlowAuthorizer", {
  cognitoUserPools: [backend.auth.resources.userPool],
});

/** Adding or changing an audio file or a playlist requires a signed-in user. */
const signedIn = {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuthorizer,
};

const integration = new LambdaIntegration(audioFilesLambda);

// /audio-files — browsing the default playlist is public reference data
const audioFilesResource = api.root.addResource("audio-files");
audioFilesResource.addMethod("GET", integration);
audioFilesResource.addMethod("POST", integration, signedIn);

// /audio-files/{audioFileId}
const audioFileResource = audioFilesResource.addResource("{audioFileId}");
audioFileResource.addMethod("GET", integration);
audioFileResource.addMethod("PATCH", integration, signedIn);

const playlistIntegration = new LambdaIntegration(playlistsLambda);

// /playlists — playlists are public reference data, so a visitor hears one straight away
const playlistsResource = api.root.addResource("playlists");
playlistsResource.addMethod("GET", playlistIntegration);
playlistsResource.addMethod("POST", playlistIntegration, signedIn);

// /playlists/default — the one playlist a new customer hears on arrival
playlistsResource.addResource("default").addMethod("GET", playlistIntegration);

// /playlists/{playlistId} — PATCH marks a playlist as the default
const playlistResource = playlistsResource.addResource("{playlistId}");
playlistResource.addMethod("GET", playlistIntegration);
playlistResource.addMethod("PATCH", playlistIntegration, signedIn);

const sessionIntegration =
  new LambdaIntegration(sessionsLambda);

// /sessions
const sessionsResource =
  api.root.addResource("sessions");

sessionsResource.addMethod(
  "GET",
  sessionIntegration,
  signedIn
);

sessionsResource.addMethod(
  "POST",
  sessionIntegration,
  signedIn
);

// /sessions/{sessionId}
const sessionResource =
  sessionsResource.addResource(
    "{sessionId}"
  );

sessionResource.addMethod(
  "GET",
  sessionIntegration,
  signedIn
);

sessionResource.addMethod(
  "PATCH",
  sessionIntegration,
  signedIn
);

// Surfaced to the frontend through amplify_outputs.json
backend.addOutput({
  custom: {
    apiUrl: api.url,
  },
});
