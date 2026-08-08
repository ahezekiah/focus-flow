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

const backend = defineBackend({ auth, storage, audioFiles });

const apiStack = backend.createStack("FocusFlowApi");

// ── Data ───────────────────────────────────────────────────────
const audioFileTable = new Table(apiStack, "AudioFileTable", {
  partitionKey: { name: "id", type: AttributeType.STRING },
  billingMode: BillingMode.PAY_PER_REQUEST,
});

const bucket = backend.storage.resources.bucket;
const audioFilesLambda = backend.audioFiles.resources.lambda;

backend.audioFiles.addEnvironment("AUDIO_FILE_TABLE", audioFileTable.tableName);
backend.audioFiles.addEnvironment("AUDIO_BUCKET", bucket.bucketName);

audioFileTable.grantReadWriteData(audioFilesLambda);
bucket.grantReadWrite(audioFilesLambda);

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

/** Adding or changing an audio file requires a signed-in user. */
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

// Surfaced to the frontend through amplify_outputs.json
backend.addOutput({
  custom: {
    apiUrl: api.url,
  },
});
