import { test, confirmThat } from "../../fixtures";

/**
 * Story-01 — Onboard New User
 *
 * As a New User, I want a brief guided registration so that I understand FocusFlow's key
 * features and can start my first session quickly. Scenarios mirror
 * docs/requirements/capabilities/cap-02-user-onboarding/functions/fn-01-onboarding-flow/
 * epics/ep-1-onboard-customer/stories/story-01-onboard-new-user.md
 */
test.describe("Story-01: Onboard New User", () => {
  // ── AC1: Returning vs. new users ─────────────────────────────
  test("Returning user skips registration", async ({ focusFlow }) => {
    // GIVEN a user has already completed registration
    await focusFlow.hasFinishedRegistration();
    await focusFlow.signsOut();

    // WHEN they log in again
    await focusFlow.logsIn();

    // THEN the system shall take them directly to their dashboard
    await confirmThat(focusFlow).dashboardIsShowing();
  });

  test("New or unfinished user sees registration", async ({ focusFlow }) => {
    // GIVEN a user has not completed registration, or is brand new
    await focusFlow.newUserCreatesTheirAccount();
    await focusFlow.walksAwayFromRegistration();

    // WHEN they log in
    await focusFlow.logsIn();

    // THEN the system shall present the guided registration flow
    await confirmThat(focusFlow).registrationStepIsShowing("step: Sessions");
  });

  // ── AC2: Creating an account ─────────────────────────────────
  test("User successfully creates an account", async ({ focusFlow }) => {
    // GIVEN a new user is on the registration screen
    await focusFlow.newUserOpensRegistration();

    // WHEN they enter their name, email, and password and submit
    await focusFlow.submitsTheirDetails();

    // THEN the system shall create their account and continue into registration
    await confirmThat(focusFlow).registrationStepIsShowing("step: Sessions");
  });

  test("User submits incomplete or invalid details", async ({ focusFlow }) => {
    // GIVEN a new user is on the registration screen
    await focusFlow.newUserOpensRegistration();

    // WHEN they submit details that are incomplete or don't meet the requirements
    await focusFlow.submitsDetailsThatWillNotDo();

    // THEN the system shall reject the submission and display a clear message next to the
    // field that needs attention
    await confirmThat(focusFlow).registrationWasRefused();
    await confirmThat(focusFlow).fieldWasQueried("field: Name");
    await confirmThat(focusFlow).fieldWasQueried("field: Email");
    await confirmThat(focusFlow).fieldWasQueried("field: Password");
  });

  // ── AC3a: Sessions ───────────────────────────────────────────
  test("Sessions step explains the feature and asks for a choice", async ({ focusFlow }) => {
    // GIVEN a new user reaches the Sessions step of registration
    await focusFlow.newUserCreatesTheirAccount();

    // WHEN the step appears
    await confirmThat(focusFlow).registrationStepIsShowing("step: Sessions");

    // THEN the system shall explain what a session is and ask the user for their first
    // session length and focus type
    await confirmThat(focusFlow).stepExplainsItself("step: Sessions");
    await confirmThat(focusFlow).stepAsksFor("choices: Session length, What will you focus on?");
  });

  test("User sets a session length and focus type of their own", async ({ focusFlow }) => {
    // GIVEN none of the suggested session lengths or focus types suit the user
    await focusFlow.newUserCreatesTheirAccount();

    // WHEN they enter a session length and a focus type of their own
    await focusFlow.entersTheirOwnSessionLength("length: 37");
    await focusFlow.entersTheirOwnFocusType("type: Thesis edits");
    await focusFlow.continuesToStep("step: Tasks");

    // THEN the system shall accept what they entered and let them continue
    await confirmThat(focusFlow).registrationStepIsShowing("step: Tasks");
    await focusFlow.goesBackToStep("step: Sessions");
    await confirmThat(focusFlow).sessionIsSetTo("length: 37", "type: Thesis edits");
  });

  test("Sessions step holds the user until a choice is made", async ({ focusFlow }) => {
    // GIVEN a new user has not chosen or entered a session length and focus type
    await focusFlow.newUserCreatesTheirAccount();

    // WHEN they try to continue
    await focusFlow.triesToContinue();

    // THEN the system shall keep them on the Sessions step and prompt them to make a choice
    await confirmThat(focusFlow).registrationIsHeldOn("step: Sessions");
  });

  // ── AC3b: Tasks ──────────────────────────────────────────────
  test("Tasks step explains the feature and asks for an entry", async ({ focusFlow }) => {
    // GIVEN a new user reaches the Tasks step of registration
    await focusFlow.newUserCreatesTheirAccount();
    await focusFlow.setsUpTheirFirstSession();

    // WHEN the step appears
    await confirmThat(focusFlow).registrationStepIsShowing("step: Tasks");

    // THEN the system shall explain what a task is and ask the user to add their first task
    await confirmThat(focusFlow).stepExplainsItself("step: Tasks");
    await confirmThat(focusFlow).stepAsksFor("choices: Your first task");
  });

  test("Tasks step holds the user until an entry is made", async ({ focusFlow }) => {
    // GIVEN a new user has not entered a task
    await focusFlow.newUserCreatesTheirAccount();
    await focusFlow.setsUpTheirFirstSession();

    // WHEN they try to continue
    await focusFlow.triesToContinue();

    // THEN the system shall keep them on the Tasks step and prompt them to complete it
    await confirmThat(focusFlow).registrationIsHeldOn("step: Tasks");
  });

  // ── AC3c: Playlist ───────────────────────────────────────────
  test("Playlist step explains the feature and offers the playlists on hand", async ({ focusFlow }) => {
    // GIVEN a new user reaches the Playlist step of registration
    await focusFlow.newUserCreatesTheirAccount();
    await focusFlow.setsUpTheirFirstSession();
    await focusFlow.addsTheirFirstTask("task: Read Chapter 4");

    // WHEN the step appears
    await confirmThat(focusFlow).registrationStepIsShowing("step: Playlist");

    // THEN the system shall explain what a playlist does for a session and display the
    // playlists on hand together with a "No Playlist" choice
    await confirmThat(focusFlow).stepExplainsItself("step: Playlist");
    await confirmThat(focusFlow).playlistsAreOffered();
    await confirmThat(focusFlow).goingWithoutAPlaylistIsOffered();
  });

  test("Playlist step holds the user until a choice is made", async ({ focusFlow }) => {
    // GIVEN a new user has not chosen a playlist
    await focusFlow.newUserCreatesTheirAccount();
    await focusFlow.setsUpTheirFirstSession();
    await focusFlow.addsTheirFirstTask("task: Read Chapter 4");

    // WHEN they try to continue
    await focusFlow.triesToContinue();

    // THEN the system shall keep them on the Playlist step and prompt them to make a choice
    await confirmThat(focusFlow).registrationIsHeldOn("step: Playlist");
  });

  test("Choosing a playlist or none lets the user carry on", async ({ focusFlow }) => {
    // GIVEN the playlists on offer are displayed
    await focusFlow.newUserCreatesTheirAccount();
    await focusFlow.setsUpTheirFirstSession();
    await focusFlow.addsTheirFirstTask("task: Read Chapter 4");
    await confirmThat(focusFlow).playlistsAreOffered();

    // WHEN the user picks one of them, or picks "No Playlist"
    await focusFlow.choosesPlaylist("playlist: Rain");
    await focusFlow.continuesToStep("step: Theme");
    await focusFlow.goesBackToStep("step: Playlist");
    await focusFlow.choosesToGoWithoutAPlaylist();

    // THEN the system shall let them continue to the next step
    await focusFlow.continuesToStep("step: Theme");
    await confirmThat(focusFlow).registrationStepIsShowing("step: Theme");
  });

  // ── AC3d: Theme ──────────────────────────────────────────────
  test("Theme step explains the feature and offers every look", async ({ focusFlow }) => {
    // GIVEN a new user reaches the Theme step of registration
    await focusFlow.newUserCreatesTheirAccount();
    await focusFlow.setsUpTheirFirstSession();
    await focusFlow.addsTheirFirstTask("task: Read Chapter 4");
    await focusFlow.choosesPlaylist("playlist: Rain");
    await focusFlow.continuesToStep("step: Theme");

    // WHEN the step appears
    await confirmThat(focusFlow).registrationStepIsShowing("step: Theme");

    // THEN the system shall explain what a theme changes and display every look on offer,
    // Cafe among them
    await confirmThat(focusFlow).stepExplainsItself("step: Theme");
    await confirmThat(focusFlow).looksAreOffered(
      "themes: Focus Flow, Cozy Cabin, Modern Workspace, Library, Night City, Forest, Cafe, Space Station",
    );
    await confirmThat(focusFlow).lookIsOffered("theme: Cafe");
  });

  test("The look a user picks stays with them", async ({ focusFlow }) => {
    // GIVEN a new user has picked a look during registration
    await focusFlow.hasFinishedRegistration("theme: Cafe");

    // WHEN they finish registration and arrive at their dashboard
    await confirmThat(focusFlow).dashboardIsShowing();

    // THEN the system shall dress the dashboard in the look they picked, and keep it on the
    // next time they log in
    await confirmThat(focusFlow).dashboardWearsTheLook("theme: Cafe");
    await focusFlow.signsOut();
    await focusFlow.logsIn();
    await confirmThat(focusFlow).dashboardWearsTheLook("theme: Cafe");
  });

  // ── AC4: Finishing registration ──────────────────────────────
  test("User completes registration", async ({ focusFlow }) => {
    // GIVEN a new user has completed every step of registration
    await focusFlow.newUserCreatesTheirAccount();
    await focusFlow.setsUpTheirFirstSession();
    await focusFlow.addsTheirFirstTask("task: Read Chapter 4");
    await focusFlow.choosesPlaylist("playlist: Rain");
    await focusFlow.continuesToStep("step: Theme");
    await focusFlow.choosesLook("theme: Cafe");
    await focusFlow.continuesToStep("step: Done");

    // WHEN they select "Get Started" on the final step
    await focusFlow.getsStarted();

    // THEN the system shall take them to their personalized dashboard
    await confirmThat(focusFlow).dashboardIsShowing();
  });

  test("User leaves registration early", async ({ focusFlow }) => {
    // GIVEN a new user exits or abandons registration before finishing
    await focusFlow.newUserCreatesTheirAccount();
    await focusFlow.setsUpTheirFirstSession();
    await focusFlow.walksAwayFromRegistration();

    // WHEN they next log in
    await focusFlow.logsIn();

    // THEN the system shall bring them back to registration where they left off, rather than
    // taking them to the dashboard
    await confirmThat(focusFlow).registrationStepIsShowing("step: Tasks");
  });
});
