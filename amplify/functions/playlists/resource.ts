import { defineFunction } from "@aws-amplify/backend";

/** Lambda behind the /api/playlists REST endpoints. */
export const playlists = defineFunction({
  name: "playlists",
  entry: "./handler.ts",
  timeoutSeconds: 30,
});
