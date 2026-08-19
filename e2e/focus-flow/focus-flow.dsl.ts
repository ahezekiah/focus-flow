import type { FocusFlowBrowserDriver } from "./focus-flow.browser.driver";
import type { DslContext } from "../support/dsl-context";
import { mp3Asset, playableMp3Asset, type AudioPayload } from "../support/audio-asset";
import { parseParam, parseParamList } from "./params";

/**
 * The domain vocabulary for Focus Flow. Specs talk to this and nothing else.
 * No selectors, no protocol, no waiting mechanics — those live in the driver.
 */

const WELCOME = "/";
const DASHBOARD = "/dash";
const START_FIRST_SESSION = "Start Your First Session";
const AUDIO_FILES = "Audio Files";
const ADD_AUDIO_FILE = "Add Audio File";
const NAME_FIELD = "Deep focus rain";
const ADDITION_COMPLETE = "Audio file complete";
const LOADING = "Loading audio files…";
const PLAYLISTS = "Playlists";
const CREATE_PLAYLIST = "Create Playlist";
const PLAYLIST_NAME_FIELD = "Deep work ambience";
const PLAYLIST_SAVED = "Playlist saved";
const PLAYLISTS_LOADING = "Loading playlists…";
const DEFAULT_BADGE = "Default playlist";
const DONE = "Done";

export class FocusFlowDsl {
  private chosenFile?: AudioPayload;

  constructor(
    readonly driver: FocusFlowBrowserDriver,
    readonly ctx: DslContext,
  ) {}

  /** A designer with an account arrives on the audio files page, ready to add audio. */
  async signsInAsDesigner(emailParam = "email: designer@example.com"): Promise<void> {
    await this.driver.provideAccount(this.ctx.aliasEmail(parseParam(emailParam, "email")));
    await this.driver.open(DASHBOARD);
    await this.driver.clickNavItem(AUDIO_FILES);
    await this.driver.signInWithCredentials();
    await this.driver.waitForButton(ADD_AUDIO_FILE);
  }

  /** The designer already has the audio saved locally, downloaded as an mp3. */
  async hasAudioFileOnTheirDesktop(fileParam: string): Promise<void> {
    this.chosenFile = mp3Asset(parseParam(fileParam, "file"));
  }

  /** The audio a playlist will be built from is already in the system, long enough to hear. */
  async systemHasAudioFiles(namesParam: string): Promise<void> {
    for (const name of parseParamList(namesParam, "names")) {
      this.chosenFile = playableMp3Asset(name);
      await this.addsAudioFile(`name: ${name}`);
    }
  }

  /** Names the audio file they have on hand and adds it to the collection. */
  async addsAudioFile(nameParam: string): Promise<void> {
    const name = this.ctx.alias(parseParam(nameParam, "name"));

    await this.driver.clickButtonIfPresent(DONE);
    await this.driver.clickButtonByName(ADD_AUDIO_FILE);
    await this.driver.fillInputByPlaceholder(NAME_FIELD, name);
    await this.driver.chooseFile(this.requireChosenFile());
    await this.driver.clickButtonByName("Add");
    await this.driver.waitForText(ADDITION_COMPLETE);
  }

  /** Comes back to the audio files page fresh, so whatever is shown came from the system. */
  async browsesAudioFiles(): Promise<void> {
    await this.driver.reload();
    await this.driver.clickNavItem(AUDIO_FILES);
    await this.driver.waitForTextToClear(LOADING);
  }

  // ── Playlists ────────────────────────────────────────────────
  /** Names a new playlist and puts only the chosen audio files in it. */
  async createsPlaylist(nameParam: string, filesParam: string): Promise<void> {
    const name = this.ctx.alias(parseParam(nameParam, "name"));
    const files = parseParamList(filesParam, "files").map(file => this.ctx.alias(file));

    await this.driver.clickNavItem(PLAYLISTS);
    await this.driver.waitForTextToClear(PLAYLISTS_LOADING);
    await this.driver.clickButtonByName(CREATE_PLAYLIST);
    await this.driver.fillInputByPlaceholder(PLAYLIST_NAME_FIELD, name);

    for (const file of files) await this.driver.checkBoxByName(file);

    await this.driver.clickButtonByName("Create");
    await this.driver.waitForText(PLAYLIST_SAVED);
  }

  /** Settles which playlist a customer hears when they arrive. */
  async makesPlaylistTheDefault(nameParam: string): Promise<void> {
    const name = this.ctx.alias(parseParam(nameParam, "name"));

    await this.driver.clickNavItem(PLAYLISTS);
    await this.driver.clickButtonIfPresent(DONE);
    await this.driver.waitForItemInList(PLAYLISTS, name);
    // The very first playlist is already the default, so there is nothing to change.
    await this.driver.clickButtonIfPresent(`Make ${name} default`);
    await this.driver.waitForItemInListShowing(PLAYLISTS, name, DEFAULT_BADGE);
  }

  /** Comes back to the playlists page fresh, so whatever is shown came from the system. */
  async browsesPlaylists(): Promise<void> {
    await this.driver.reload();
    await this.driver.clickNavItem(PLAYLISTS);
    await this.driver.waitForTextToClear(PLAYLISTS_LOADING);
  }

  /** A customer arrives at Focus Flow and steps into the experience. */
  async customerEntersTheExperience(): Promise<void> {
    await this.driver.open(WELCOME);
    await this.driver.clickButtonByName(START_FIRST_SESSION);
  }

  /** A customer picks one of the playlists on offer and plays it. */
  async customerPlaysPlaylist(nameParam: string): Promise<void> {
    const name = this.ctx.alias(parseParam(nameParam, "name"));

    await this.driver.clickNavItem(PLAYLISTS);
    await this.driver.clickButtonIfPresent(DONE);
    await this.driver.clickButtonByName(`Play ${name}`);
  }

  /** How large the audio they chose is, so assertions can prove the same bytes came back. */
  chosenFileSize(): number {
    return this.requireChosenFile().byteLength;
  }

  private requireChosenFile(): AudioPayload {
    if (!this.chosenFile) {
      throw new Error("No audio file has been prepared — call hasAudioFileOnTheirDesktop first");
    }
    return this.chosenFile;
  }
}
