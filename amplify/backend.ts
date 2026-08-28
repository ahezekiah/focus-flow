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

const backend = defineBackend({
  auth,
  storage,
  audioFiles,
  playlists,
});

/* ============================================================
 * API STACK
 * ========================================================== */

const apiStack = backend.createStack("FocusFlowApi");

/* ============================================================
 * DYNAMODB
 * ========================================================== */

const audioFileTable = new Table(backend.stack, "AudioFileTable", {
  partitionKey: {
    name: "id",
    type: AttributeType.STRING,
  },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

const playlistTable = new Table(backend.stack, "PlaylistTable", {
  partitionKey: {
    name: "id",
    type: AttributeType.STRING,
  },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

/* ============================================================
 * STORAGE
 * ========================================================== */

const bucket = backend.storage.resources.bucket;

const audioFilesLambda = backend.audioFiles.resources.lambda;
const playlistsLambda = backend.playlists.resources.lambda;

/* ============================================================
 * AUDIO FILE LAMBDA ENVIRONMENT + PERMISSIONS
 * ========================================================== */

backend.audioFiles.addEnvironment(
  "AUDIO_FILE_TABLE",
  audioFileTable.tableName,
);

backend.audioFiles.addEnvironment(
  "AUDIO_BUCKET",
  bucket.bucketName,
);

audioFileTable.grantReadWriteData(audioFilesLambda);
bucket.grantReadWrite(audioFilesLambda);

/* ============================================================
 * PLAYLIST LAMBDA ENVIRONMENT + PERMISSIONS
 * ========================================================== */

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

playlistTable.grantReadWriteData(playlistsLambda);
audioFileTable.grantReadData(playlistsLambda);
bucket.grantRead(playlistsLambda);

/* ============================================================
 * REST API
 * ========================================================== */

const api = new RestApi(apiStack, "FocusFlowRestApi", {
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

    allowCredentials: false,
  },
});

/* ============================================================
 * COGNITO AUTHORIZER
 * ========================================================== */

const cognitoAuthorizer = new CognitoUserPoolsAuthorizer(
  apiStack,
  "FocusFlowAuthorizer",
  {
    cognitoUserPools: [
      backend.auth.resources.userPool,
    ],
  },
);

const signedIn = {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuthorizer,
};

/* ============================================================
 * AUDIO FILES
 * ========================================================== */

const audioFilesIntegration = new LambdaIntegration(
  audioFilesLambda,
);

const audioFilesResource = api.root.addResource(
  "audio-files",
);

/*
 * Public GET
 */
audioFilesResource.addMethod(
  "GET",
  audioFilesIntegration,
);

/*
 * Authenticated POST
 */
audioFilesResource.addMethod(
  "POST",
  audioFilesIntegration,
  signedIn,
);

/*
 * /audio-files/{audioFileId}
 */

const audioFileResource =
  audioFilesResource.addResource("{audioFileId}");

audioFileResource.addMethod(
  "GET",
  audioFilesIntegration,
);

audioFileResource.addMethod(
  "PATCH",
  audioFilesIntegration,
  signedIn,
);

/* ============================================================
 * PLAYLISTS
 * ========================================================== */

const playlistsIntegration = new LambdaIntegration(
  playlistsLambda,
);

const playlistsResource = api.root.addResource(
  "playlists",
);

/*
 * Public GET
 */
playlistsResource.addMethod(
  "GET",
  playlistsIntegration,
);

/*
 * Authenticated POST
 */
playlistsResource.addMethod(
  "POST",
  playlistsIntegration,
  signedIn,
);

/*
 * /playlists/default
 */

const defaultPlaylistResource =
  playlistsResource.addResource("default");

defaultPlaylistResource.addMethod(
  "GET",
  playlistsIntegration,
);

/*
 * /playlists/{playlistId}
 */

const playlistResource =
  playlistsResource.addResource("{playlistId}");

playlistResource.addMethod(
  "GET",
  playlistsIntegration,
);

playlistResource.addMethod(
  "PATCH",
  playlistsIntegration,
  signedIn,
);

/* ============================================================
 * FRONTEND OUTPUT
 * ========================================================== */

backend.addOutput({
  custom: {
    apiUrl: api.url,
  },
});