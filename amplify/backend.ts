import { defineBackend } from "@aws-amplify/backend";

import {
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";

import {
  AttributeType,
  BillingMode,
  Table,
} from "aws-cdk-lib/aws-dynamodb";

import { auth } from "./auth/resource";
import { storage } from "./storage/resource";

import { audioFiles } from "./functions/audio-files/resource";
import { playlists } from "./functions/playlists/resource";

const backend = defineBackend({
  auth,
  storage,
  audioFiles,
  playlists,
});

const apiStack = backend.createStack("FocusFlowApi");

// ─────────────────────────────────────────────────────────────
// DynamoDB
// ─────────────────────────────────────────────────────────────

const audioFileTable = new Table(
  backend.stack,
  "AudioFileTable",
  {
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },

    billingMode: BillingMode.PAY_PER_REQUEST,
  },
);

const playlistTable = new Table(
  backend.stack,
  "PlaylistTable",
  {
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },

    billingMode: BillingMode.PAY_PER_REQUEST,
  },
);

// ─────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────

const bucket = backend.storage.resources.bucket;

// ─────────────────────────────────────────────────────────────
// Audio Lambda permissions
// ─────────────────────────────────────────────────────────────

const audioFilesLambda =
  backend.audioFiles.resources.lambda;

backend.audioFiles.addEnvironment(
  "AUDIO_FILE_TABLE",
  audioFileTable.tableName,
);

backend.audioFiles.addEnvironment(
  "AUDIO_BUCKET",
  bucket.bucketName,
);

audioFileTable.grantReadWriteData(
  audioFilesLambda,
);

bucket.grantReadWrite(
  audioFilesLambda,
);

// ─────────────────────────────────────────────────────────────
// Playlist Lambda permissions
// ─────────────────────────────────────────────────────────────

const playlistsLambda =
  backend.playlists.resources.lambda;

backend.playlists.addEnvironment(
  "PLAYLIST_TABLE",
  playlistTable.tableName,
);

backend.playlists.addEnvironment(
  "AUDIO_FILE_TABLE",
  audioFileTable.tableName,
);

backend.playlists.addEnvironment(
  "AUDIO_BUCKET",
  bucket.bucketName,
);

playlistTable.grantReadWriteData(
  playlistsLambda,
);

audioFileTable.grantReadData(
  playlistsLambda,
);

bucket.grantRead(
  playlistsLambda,
);

// ─────────────────────────────────────────────────────────────
// REST API
// ─────────────────────────────────────────────────────────────

const api = new RestApi(
  apiStack,
  "FocusFlowRestApi",
  {
    restApiName: "focus-flow-api",

    deployOptions: {
      stageName: "api",
    },

    defaultCorsPreflightOptions: {
      allowOrigins: Cors.ALL_ORIGINS,

      allowMethods: [
        "GET",
        "POST",
        "PATCH",
        "OPTIONS",
      ],

      allowHeaders: [
        "Content-Type",
        "Authorization",
      ],
    },
  },
);

// ─────────────────────────────────────────────────────────────
// Audio files
//
// IMPORTANT:
// There is NO Cognito API Gateway authorizer here.
//
// Lambda receives the Authorization header directly.
// ─────────────────────────────────────────────────────────────

const audioIntegration =
  new LambdaIntegration(audioFilesLambda);

const audioFilesResource =
  api.root.addResource("audio-files");

audioFilesResource.addMethod(
  "GET",
  audioIntegration,
);

audioFilesResource.addMethod(
  "POST",
  audioIntegration,
);

const audioFileResource =
  audioFilesResource.addResource(
    "{audioFileId}",
  );

audioFileResource.addMethod(
  "GET",
  audioIntegration,
);

audioFileResource.addMethod(
  "PATCH",
  audioIntegration,
);

// ─────────────────────────────────────────────────────────────
// Playlists
// ─────────────────────────────────────────────────────────────

const playlistIntegration =
  new LambdaIntegration(playlistsLambda);

const playlistsResource =
  api.root.addResource("playlists");

playlistsResource.addMethod(
  "GET",
  playlistIntegration,
);

playlistsResource.addMethod(
  "POST",
  playlistIntegration,
);

playlistsResource
  .addResource("default")
  .addMethod(
    "GET",
    playlistIntegration,
  );

const playlistResource =
  playlistsResource.addResource(
    "{playlistId}",
  );

playlistResource.addMethod(
  "GET",
  playlistIntegration,
);

playlistResource.addMethod(
  "PATCH",
  playlistIntegration,
);

// ─────────────────────────────────────────────────────────────
// Frontend output
// ─────────────────────────────────────────────────────────────

backend.addOutput({
  custom: {
    apiUrl: api.url,
  },
});