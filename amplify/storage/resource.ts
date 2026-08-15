import { defineStorage } from "@aws-amplify/backend";

/**
 * S3 bucket holding uploaded audio files.
 *
 * The browser never talks to this bucket with its own credentials — the
 * audio-files Lambda signs short-lived upload and playback URLs, so no
 * client-facing access rules are granted here.
 */
export const storage = defineStorage({
  name: "focusFlowAudio",
});
