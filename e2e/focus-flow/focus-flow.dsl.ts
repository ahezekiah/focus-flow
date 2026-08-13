import type { FocusFlowBrowserDriver } from "./focus-flow.browser.driver";
import type { DslContext } from "../support/dsl-context";
import { mp3Asset, type AudioPayload } from "../support/audio-asset";
import { parseParam } from "./params";

/**
 * The domain vocabulary for Focus Flow. Specs talk to this and nothing else.
 * No selectors, no protocol, no waiting mechanics — those live in the driver.
 */

const DASHBOARD = "/dash";
const AUDIO_FILES = "Audio Files";
const ADD_AUDIO_FILE = "Add Audio File";
const NAME_FIELD = "Deep focus rain";
const ADDITION_COMPLETE = "Audio file complete";
const LOADING = "Loading audio files…";

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

  /** Names the audio file they have on hand and adds it to the collection. */
  async addsAudioFile(nameParam: string): Promise<void> {
    const name = this.ctx.alias(parseParam(nameParam, "name"));

    await this.driver.clickButtonIfPresent("Done");
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
