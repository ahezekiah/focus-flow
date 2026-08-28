import { defineAuth } from "@aws-amplify/backend";
import { preSignUp } from "./pre-sign-up/resource";

/**
 * Cognito user pool. Registering through the app creates the account here, so adding
 * audio files and building playlists work as soon as someone has signed up (DR-04).
 * Browsing the default playlist stays open to everyone
 * (see docs/tech-stack/AWS_Architecture.md).
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  triggers: {
    preSignUp,
  },
});
