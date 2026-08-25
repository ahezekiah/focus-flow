import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AmbientMusicContext, DEFAULT_TRACK, type AmbientMusic } from "./ambientMusic";

/**
 * Starts the default music as soon as FocusFlow opens and keeps it playing while the
 * visitor moves from the homepage through set-up and on to their dashboard.
 */
export function AmbientMusicProvider({ children }: { children: ReactNode }) {
  const [audio] = useState(() => {
    const el = new Audio(DEFAULT_TRACK.url);
    el.loop = true;
    el.preload = "auto";
    return el;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isDefaultTrack, setIsDefaultTrack] = useState(true);
  const ownedRef = useRef(true);

  const takeOver = useCallback(() => {
    ownedRef.current = false;
    setIsDefaultTrack(false);
  }, []);

  // Browsers stay silent until the visitor has touched the page, so when the first
  // attempt is turned down the music waits for their very next click or keypress.
  useEffect(() => {
    let cleanup = () => {};

    const startOnGesture = () => {
      if (!ownedRef.current) return;
      void audio.play().catch(() => {});
    };

    audio.play().catch(() => {
      const events = ["pointerdown", "keydown", "touchstart"] as const;
      events.forEach(e => window.addEventListener(e, startOnGesture, { once: true }));
      cleanup = () => events.forEach(e => window.removeEventListener(e, startOnGesture));
    });

    return () => cleanup();
  }, [audio]);

  // Keep the reported state honest no matter who calls play or pause.
  useEffect(() => {
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [audio]);

  const value = useMemo<AmbientMusic>(
    () => ({ audio, isPlaying, isDefaultTrack, takeOver }),
    [audio, isPlaying, isDefaultTrack, takeOver],
  );

  return <AmbientMusicContext.Provider value={value}>{children}</AmbientMusicContext.Provider>;
}
