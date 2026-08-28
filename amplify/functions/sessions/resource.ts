import { defineFunction } from "@aws-amplify/backend";

export const sessions = defineFunction({
    name: "sessions",
    entry: "./handler.ts",
    timeoutSeconds: 30,
});