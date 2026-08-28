import type { FocusFlowBrowserDriver } from "./focus-flow.browser.driver";
import type { DslContext } from "../support/dsl-context";
import { mp3Asset, playableMp3Asset, type AudioPayload } from "../support/audio-asset";
import { parseParam, parseParamList } from "./params";

/**
 * The domain vocabulary for Focus Flow. Specs talk to this and nothing else.
 * No selectors, no protocol, no waiting mechanics — those live in the driver.
 */

const WELCOME = "/";
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

// ── Guided registration ──────────────────────────────────────
const SIGN_IN_PAGE = "/signin";
const START_HERE = "Start Your First Session";
const REGISTRATION_HEADING = "Create your account";
const CREATE_ACCOUNT = "Create account";
const REGISTRATION_NAME_FIELD = "Name";
const EMAIL_FIELD = "Email";
const PASSWORD_FIELD = "Password";
const NEWCOMER_NAME = "Jordan Smith";
const NEWCOMER_PASSWORD = "Sunlit-Harbor-42";
const CONTINUE = "Continue";
const FINISH = "Finish";
const BACK = "Back";
const GET_STARTED = "Get Started";
const SIGN_IN = "Sign in";
const SIGN_OUT = "Sign out";
const ALL_SET = "You're all set";
const DONE_STEP = "Done";
const OWN_CHOICE = "Custom";
const NO_PLAYLIST = "No Playlist";
const SESSION_LENGTH_CHOICES = "Session length choices";
const FOCUS_TYPE_CHOICES = "Focus type choices";
const PLAYLIST_CHOICES = "Playlist choices";
const THEME_CHOICES = "Theme choices";
const OWN_LENGTH_FIELD = "Session length in minutes";
const OWN_TYPE_FIELD = "Your focus type";
const FIRST_TASK_FIELD = "Your first task";

export class FocusFlowDsl {
  private chosenFile?: AudioPayload;
  private registration?: { email: string; password: string };

  constructor(
    readonly driver: FocusFlowBrowserDriver,
    readonly ctx: DslContext,
  ) {}

  /** A designer with an account arrives on the audio files page, ready to add audio. */
  async signsInAsDesigner(emailParam = "email: designer@example.com"): Promise<void> {
    await this.driver.provideAccount(this.ctx.aliasEmail(parseParam(emailParam, "email")));
    // The dashboard is only reached by finishing setup, so the designer goes in that way.
    await this.hasFinishedRegistration();
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

  // ── Guided registration ──────────────────────────────────────
  /** A newcomer arrives at FocusFlow and starts creating an account. */
  async newUserOpensRegistration(): Promise<void> {
    await this.driver.open(WELCOME);
    await this.driver.clickButtonByName(START_HERE);
    await this.driver.waitForHeading(REGISTRATION_HEADING);
  }

  /** Gives the details registration asks for and submits them. */
  async submitsTheirDetails(emailParam = "email: jordan@example.com"): Promise<void> {
    const email = this.ctx.aliasEmail(parseParam(emailParam, "email"));
    this.registration = { email, password: NEWCOMER_PASSWORD };

    await this.driver.fillFieldByLabel(REGISTRATION_NAME_FIELD, NEWCOMER_NAME);
    await this.driver.fillFieldByLabel(EMAIL_FIELD, email);
    await this.driver.fillFieldByLabel(PASSWORD_FIELD, NEWCOMER_PASSWORD);
    await this.driver.clickButtonByName(CREATE_ACCOUNT);
  }

  /** Submits details that are incomplete and do not meet what is asked for. */
  async submitsDetailsThatWillNotDo(): Promise<void> {
    await this.driver.fillFieldByLabel(REGISTRATION_NAME_FIELD, "");
    await this.driver.fillFieldByLabel(EMAIL_FIELD, "not-an-email");
    await this.driver.fillFieldByLabel(PASSWORD_FIELD, "short");
    await this.driver.clickButtonByName(CREATE_ACCOUNT);
  }

  /** Registers and lands on the first step of guided setup. */
  async newUserCreatesTheirAccount(emailParam = "email: jordan@example.com"): Promise<void> {
    await this.newUserOpensRegistration();
    await this.submitsTheirDetails(emailParam);
    await this.waitForStep("Sessions");
  }

  /** Takes one of the suggested session lengths and focus types, then moves on. */
  async setsUpTheirFirstSession(
    lengthParam = "length: 45",
    typeParam = "type: Coding",
  ): Promise<void> {
    await this.driver.clickChoiceInGroup(
      SESSION_LENGTH_CHOICES,
      `${parseParam(lengthParam, "length")}m`,
    );
    await this.driver.clickChoiceInGroup(FOCUS_TYPE_CHOICES, parseParam(typeParam, "type"));
    await this.continuesToStep("step: Tasks");
  }

  /** Sets a session length none of the suggestions offer. */
  async entersTheirOwnSessionLength(lengthParam: string): Promise<void> {
    await this.driver.clickChoiceInGroup(SESSION_LENGTH_CHOICES, OWN_CHOICE);
    await this.driver.fillFieldByLabel(OWN_LENGTH_FIELD, parseParam(lengthParam, "length"));
  }

  /** Names a focus type none of the suggestions offer. */
  async entersTheirOwnFocusType(typeParam: string): Promise<void> {
    await this.driver.clickChoiceInGroup(FOCUS_TYPE_CHOICES, OWN_CHOICE);
    await this.driver.fillFieldByLabel(OWN_TYPE_FIELD, parseParam(typeParam, "type"));
  }

  /** Names the first thing they mean to get done, then moves on. */
  async addsTheirFirstTask(taskParam: string): Promise<void> {
    await this.driver.fillFieldByLabel(
      FIRST_TASK_FIELD,
      this.ctx.alias(parseParam(taskParam, "task")),
    );
    await this.continuesToStep("step: Playlist");
  }

  /** Picks the playlist their first session will play. */
  async choosesPlaylist(playlistParam: string): Promise<void> {
    await this.driver.clickChoiceInGroup(PLAYLIST_CHOICES, parseParam(playlistParam, "playlist"));
  }

  /** Decides their first session will run without a playlist. */
  async choosesToGoWithoutAPlaylist(): Promise<void> {
    await this.driver.clickChoiceInGroup(PLAYLIST_CHOICES, NO_PLAYLIST);
  }

  /** Picks the look their workspace will wear. */
  async choosesLook(themeParam: string): Promise<void> {
    await this.driver.clickChoiceInGroup(THEME_CHOICES, parseParam(themeParam, "theme"));
  }

  /** Moves on from the step they are on to the one they name. */
  async continuesToStep(stepParam: string): Promise<void> {
    const step = parseParam(stepParam, "step");

    await this.driver.clickButtonByName(step === DONE_STEP ? FINISH : CONTINUE);
    await this.waitForStep(step);
  }

  /** Goes back to a step they have already been through. */
  async goesBackToStep(stepParam: string): Promise<void> {
    const step = parseParam(stepParam, "step");

    await this.driver.clickButtonByName(BACK);
    await this.waitForStep(step);
  }

  /** Attempts to move on, without having done what the step asks for. */
  async triesToContinue(): Promise<void> {
    await this.driver.clickButtonByName(CONTINUE);
  }

  /** Leaves the closing screen of registration for their dashboard. */
  async getsStarted(): Promise<void> {
    await this.driver.clickButtonByName(GET_STARTED);
    await this.driver.waitForButton(SIGN_OUT);
  }

  /** Goes the whole way through registration and ends up on their dashboard. */
  async hasFinishedRegistration(themeParam = "theme: Cafe"): Promise<void> {
    await this.newUserCreatesTheirAccount();
    await this.setsUpTheirFirstSession();
    await this.addsTheirFirstTask("task: Read Chapter 4");
    await this.choosesPlaylist("playlist: Rain");
    await this.continuesToStep("step: Theme");
    await this.choosesLook(themeParam);
    await this.continuesToStep("step: Done");
    await this.getsStarted();
  }

  /** Abandons registration part way through, without finishing it. */
  async walksAwayFromRegistration(): Promise<void> {
    await this.driver.open(WELCOME);
  }

  /** Leaves FocusFlow from their dashboard. */
  async signsOut(): Promise<void> {
    await this.driver.clickButtonByName(SIGN_OUT);
  }

  /** Comes back to FocusFlow with the details they registered under. */
  async logsIn(): Promise<void> {
    const account = this.requireRegistration();

    await this.driver.open(SIGN_IN_PAGE);
    await this.driver.fillFieldIfPresent(EMAIL_FIELD, account.email);
    await this.driver.fillFieldIfPresent(PASSWORD_FIELD, account.password);
    await this.driver.clickButtonIfPresent(SIGN_IN);
  }

  /** The closing screen is the only one not titled after its step. */
  async waitForStep(step: string): Promise<void> {
    if (step === DONE_STEP) await this.driver.waitForText(ALL_SET);
    else await this.driver.waitForHeading(step);
  }

  private requireRegistration(): { email: string; password: string } {
    if (!this.registration) {
      throw new Error("Nobody has registered in this test yet — register before logging in");
    }
    return this.registration;
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
