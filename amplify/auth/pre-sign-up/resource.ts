import { defineFunction } from "@aws-amplify/backend";

/** Cognito pre-sign-up trigger, so registering needs no emailed confirmation code. */
export const preSignUp = defineFunction({
  name: "pre-sign-up",
  entry: "./handler.ts",
});
