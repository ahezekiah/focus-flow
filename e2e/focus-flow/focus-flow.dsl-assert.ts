import type { FocusFlowDsl } from "./focus-flow.dsl";
import { parseParam, parseParamList } from "./params";

/**
 * The assertion half of the domain vocabulary, reached as `confirmThat(focusFlow)`.
 * Each verb mirrors the setup verb it checks, so aliases line up.
 */
export class FocusFlowDslAssert {
  constructor(private readonly dsl: FocusFlowDsl) {}

  /** The designer is told the audio file was added. */
  async additionIsConfirmed(): Promise<void> {
    await this.dsl.driver.waitForText("Audio file complete");
  }

  /** The audio file is offered for playing, and storage serves back what was added. */
  async audioFileCanBePlayed(nameParam: string): Promise<void> {
    const name = this.alias(nameParam);

    await this.dsl.driver.expectControlEnabled(`Play ${name}`);
    await this.dsl.driver.expectStoredBytes(name, this.dsl.chosenFileSize());
  }

  /** The audio file is shown among the audio files that have been added. */
  async showsAudioFileInList(nameParam: string): Promise<void> {
    await this.dsl.driver.waitForRowContaining(this.alias(nameParam));
  }

  /** Every audio file that was added is shown, all in the one list. */
  async listsAudioFilesTogether(namesParam: string): Promise<void> {
    const names = parseParamList(namesParam, "names").map(name => this.dsl.ctx.alias(name));

    for (const name of names) {
      await this.dsl.driver.waitForRowContaining(name);
    }
    await this.dsl.driver.expectRowsShareOneList();
  }

  // ── Playlists ────────────────────────────────────────────────
  /** The designer is told the playlist was saved. */
  async savingIsConfirmed(): Promise<void> {
    await this.dsl.driver.waitForText("Playlist saved");
  }

  /** The playlist is held by the system under the name the designer typed. */
  async playlistIsSavedAs(nameParam: string): Promise<void> {
    const name = this.alias(nameParam);

    await this.dsl.driver.waitForItemInList("Playlists", name);
    await this.dsl.driver.expectStoredPlaylistNamed(name);
  }

  /** The playlist holds exactly the audio files that were chosen, in that order. */
  async playlistHolds(nameParam: string, filesParam: string): Promise<void> {
    const name = this.alias(nameParam);
    const files = parseParamList(filesParam, "files").map(file => this.dsl.ctx.alias(file));

    for (const file of files) {
      await this.dsl.driver.waitForItemInList(`Tracks in ${name}`, file);
    }
    await this.dsl.driver.expectStoredPlaylistTracks(name, files);
  }

  /** The audio file was left out of the playlist. */
  async playlistDoesNotHold(nameParam: string, fileParam: string): Promise<void> {
    const name = this.alias(nameParam);
    const file = this.dsl.ctx.alias(parseParam(fileParam, "file"));

    await this.dsl.driver.expectItemMissingFromList(`Tracks in ${name}`, file);
  }

  /** That playlist is what the customer is hearing right now. */
  async playlistIsPlaying(nameParam: string): Promise<void> {
    const name = this.alias(nameParam);

    await this.dsl.driver.waitForTextInPanel("Player", name);
    // Only a playlist that is playing offers to pause.
    await this.dsl.driver.waitForButtonInPanel("Player", "Pause");
    await this.dsl.driver.expectPlaybackToProgress();
  }

  /** These are the audio files playing, in the order the customer hears them. */
  async playlistPlaysTracks(namesParam: string): Promise<void> {
    const names = parseParamList(namesParam, "names").map(name => this.dsl.ctx.alias(name));

    await this.dsl.driver.waitForTextInPanel("Now playing", "Playing");
    await this.dsl.driver.expectListItemsInOrder("Now playing tracks", names);
  }

  private alias(nameParam: string): string {
    return this.dsl.ctx.alias(parseParam(nameParam, "name"));
  }
}

export const confirmThat = (dsl: FocusFlowDsl): FocusFlowDslAssert => new FocusFlowDslAssert(dsl);
