import { test, confirmThat, backendReady, backendNotReadyReason } from "../../fixtures";

/**
 * S-1.3.1 — Designer Creates a Playlist
 *
 * As a Designer, I want to create a playlist so that when the customer enters the experience
 * they are interested and/or curious, and so that when the customer begins a session they have
 * ambience to play. Scenarios mirror docs/requirements/capabilities/cap-01-platform-foundation/
 * functions/fn-01-platform-deployment/epics/ep-3-default-playlist/stories/
 * story-01-designer-creates-a-playlist.md
 */
test.describe("Story-01: Designer Creates a Playlist", () => {
  test.skip(!backendReady, backendNotReadyReason);

  test("A playlist is saved under the name the designer gives it", async ({ focusFlow }) => {
    // GIVEN the designer has chosen the audio files for a new playlist
    await focusFlow.signsInAsDesigner();
    await focusFlow.systemHasAudioFiles("names: audio 1, audio 2");

    // WHEN they name the playlist "name 1"
    await focusFlow.createsPlaylist("name: name 1", "files: audio 1, audio 2");

    // THEN the playlist is saved as "name 1"
    await confirmThat(focusFlow).savingIsConfirmed();
    await focusFlow.browsesPlaylists();
    await confirmThat(focusFlow).playlistIsSavedAs("name: name 1");
  });

  test("A playlist holds only the audio files the designer chooses for it", async ({ focusFlow }) => {
    // GIVEN the system has audio files 1, 2 and 3
    await focusFlow.signsInAsDesigner();
    await focusFlow.systemHasAudioFiles("names: audio 1, audio 2, audio 3");

    // WHEN the designer specifies audio files 1 and 2 to be in the playlist named "name 1"
    await focusFlow.createsPlaylist("name: name 1", "files: audio 1, audio 2");

    // THEN the playlist "name 1" holds audio files 1 and 2
    await confirmThat(focusFlow).playlistHolds("name: name 1", "files: audio 1, audio 2");

    // AND audio file 3 is not in the playlist
    await confirmThat(focusFlow).playlistDoesNotHold("name: name 1", "file: audio 3");
  });

  test("A customer who enters the experience hears the default playlist", async ({ focusFlow }) => {
    // GIVEN the default playlist holds audio files 1, 2 and 3
    await focusFlow.signsInAsDesigner();
    await focusFlow.systemHasAudioFiles("names: audio 1, audio 2, audio 3");
    await focusFlow.createsPlaylist("name: name 1", "files: audio 1, audio 2, audio 3");
    await focusFlow.makesPlaylistTheDefault("name: name 1");

    // WHEN a customer enters the experience
    await focusFlow.customerEntersTheExperience();

    // THEN the default playlist plays audio files 1, 2 and 3
    await confirmThat(focusFlow).playlistIsPlaying("name: name 1");
    await confirmThat(focusFlow).playlistPlaysTracks("names: audio 1, audio 2, audio 3");
  });

  test("A playlist is available to play", async ({ focusFlow }) => {
    // GIVEN a playlist has been created
    await focusFlow.signsInAsDesigner();
    await focusFlow.systemHasAudioFiles("names: audio 1, audio 2");
    await focusFlow.createsPlaylist("name: name 2", "files: audio 1, audio 2");

    // WHEN a customer plays a playlist
    await focusFlow.customerPlaysPlaylist("name: name 2");

    // THEN that playlist plays
    await confirmThat(focusFlow).playlistIsPlaying("name: name 2");
  });
});
