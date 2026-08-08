import { defineFunction } from "@aws-amplify/backend";

/** Lambda behind the /api/audio-files REST endpoints. */
export const audioFiles = defineFunction({
  name: "audio-files",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
