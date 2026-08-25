import { createContext, useContext } from "react";

/** The tune everyone hears the moment FocusFlow opens, before signing in or setting anything up. */
export const DEFAULT_TRACK = {
  id: "focusflow-default",
  name: "FocusFlow Default",
  url: "/audio/focusflow-default.mp3",
};

export interface AmbientMusic {
  /** The one audio element for the whole app — it outlives every page change. */
  audio: HTMLAudioElement;
  isPlaying: boolean;
  /** True while the default tune is still the one playing, untouched by the listener. */
  isDefaultTrack: boolean;
  /** Hands control of the music to the dashboard, so the listener can pause it or put something else on. */
  takeOver: () => void;
}

export const AmbientMusicContext = createContext<AmbientMusic | null>(null);

export function useAmbientMusic(): AmbientMusic {
  const ctx = useContext(AmbientMusicContext);
  if (!ctx) throw new Error("useAmbientMusic must be used inside AmbientMusicProvider");
  return ctx;
}
