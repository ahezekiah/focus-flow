import { test, confirmThat, backendReady, backendNotReadyReason } from "../../fixtures";

/**
 * S-1.3.2 — Add Audio Files
 *
 * As a Designer, I want to add audio files so that I can play music and build a playlist.
 * Scenarios mirror docs/requirements/capabilities/cap-01-platform-foundation/functions/
 * fn-01-platform-deployment/epics/ep-3-default-playlist/stories/story-02-add-audio-files.md
 */
test.describe("Story-02: Add Audio Files", () => {
  test.skip(!backendReady, backendNotReadyReason);

  test("An audio file that has been downloaded can be added to the collection", async ({
    focusFlow,
  }) => {
    // GIVEN there is an audio file on my desktop as an mp3
    await focusFlow.signsInAsDesigner();
    await focusFlow.hasAudioFileOnTheirDesktop("file: rainfall.mp3");

    // WHEN I add that audio file to the system
    await focusFlow.addsAudioFile("name: Rainfall");

    // THEN the audio file is available to be played
    await confirmThat(focusFlow).additionIsConfirmed();
    await confirmThat(focusFlow).audioFileCanBePlayed("name: Rainfall");
  });

  test("An added audio file is available to be played", async ({ focusFlow }) => {
    // GIVEN an audio file is in the system
    await focusFlow.signsInAsDesigner();
    await focusFlow.hasAudioFileOnTheirDesktop("file: ocean.mp3");
    await focusFlow.addsAudioFile("name: Ocean Waves");

    // WHEN I browse audio files
    await focusFlow.browsesAudioFiles();

    // THEN I am shown that the file exists
    await confirmThat(focusFlow).showsAudioFileInList("name: Ocean Waves");
    await confirmThat(focusFlow).audioFileCanBePlayed("name: Ocean Waves");
  });

  test("Added audio files are listed together after they are added", async ({ focusFlow }) => {
    // GIVEN I have added one or more audio files
    await focusFlow.signsInAsDesigner();
    await focusFlow.hasAudioFileOnTheirDesktop("file: rainfall.mp3");
    await focusFlow.addsAudioFile("name: Rainfall");
    await focusFlow.hasAudioFileOnTheirDesktop("file: forest.mp3");
    await focusFlow.addsAudioFile("name: Forest");

    // WHEN I browse audio files
    await focusFlow.browsesAudioFiles();

    // THEN I am shown that all the audio files exist
    await confirmThat(focusFlow).listsAudioFilesTogether("names: Rainfall, Forest");
  });
});
