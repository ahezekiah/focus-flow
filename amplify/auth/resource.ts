import { defineAuth } from "@aws-amplify/backend";

/**
 * Cognito user pool. Adding audio files is a signed-in action; browsing the
 * default playlist is not (see docs/tech-stack/AWS_Architecture.md).
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
