/** The tune everyone hears the moment FocusFlow opens, before signing in or setting anything up. */
export const DEFAULT_TRACK = {
  id: "focusflow-default",
  name: "FocusFlow Default",
  url: "/audio/focusflow-default.mp3",
};

const GESTURES = ["pointerdown", "keydown", "touchstart"] as const;

let element: HTMLAudioElement | null = null;
/** True while the welcome music is ours to drive — the dashboard hands this over to the listener. */
let owned = true;
let waitingForGesture = false;

/** The one audio element for the whole app — it outlives every page change. */
export function ambientAudio(): HTMLAudioElement {
  if (!element) {
    element = new Audio(DEFAULT_TRACK.url);
    element.loop = true;
    element.preload = "auto";
  }
  return element;
}

/** Hands the music to the dashboard, so the listener can pause it or put something else on. */
export function releaseAmbientMusic(): void {
  owned = false;
}

/**
 * Puts the welcome tune back on from the top — at app open, and whenever someone lands
 * back on the homepage, signing out included. Browsers stay silent until the visitor has
 * touched the page, so a turned-down request waits for their very next click or keypress.
 */
export function startDefaultMusic(): void {
  const audio = ambientAudio();
  owned = true;

  const defaultSrc = new URL(DEFAULT_TRACK.url, window.location.origin).href;
  if (audio.src !== defaultSrc) audio.src = DEFAULT_TRACK.url;
  audio.loop = true;
  audio.currentTime = 0;

  audio.play().catch(() => {
    if (waitingForGesture) return;
    waitingForGesture = true;

    const startOnGesture = () => {
      waitingForGesture = false;
      if (!owned) return;
      void audio.play().catch(() => {});
    };
    GESTURES.forEach(e => window.addEventListener(e, startOnGesture, { once: true }));
  });
}
