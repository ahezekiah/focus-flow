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

  private alias(nameParam: string): string {
    return this.dsl.ctx.alias(parseParam(nameParam, "name"));
  }
}

export const confirmThat = (dsl: FocusFlowDsl): FocusFlowDslAssert => new FocusFlowDslAssert(dsl);
