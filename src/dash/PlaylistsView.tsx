import { useEffect, useState } from "react";
import { Check, ListMusic, Play, Plus, Star } from "lucide-react";
import type { DashTheme } from "./themes";
import {
  createPlaylist,
  listAudioFiles,
  listPlaylists,
  makePlaylistDefault,
  ApiError,
  type AudioFile,
  type Playlist,
} from "../lib/api";
import { isBackendConfigured } from "../lib/amplify";
import { AudioAccountPanel } from "./AudioAccountPanel";
import { useSignedIn } from "../lib/useSignedIn";

type Screen = "list" | "create" | "confirm";

function trackSummary(playlist: Playlist) {
  const count = playlist.tracks.length;
  return `${count} ${count === 1 ? "track" : "tracks"}`;
}

// ── The playlists that have been saved ─────────────────────────
function PlaylistList({
  playlists,
  theme,
  onPlay,
  onMakeDefault,
}: {
  playlists: Playlist[];
  theme: DashTheme;
  onPlay?: (playlist: Playlist) => void;
  onMakeDefault?: (playlist: Playlist) => void;
}) {
  if (playlists.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: theme.card, border: `1px solid ${theme.border}` }}
      >
        <ListMusic className="w-6 h-6 mx-auto mb-2" style={{ color: theme.mutedFg }} />
        <p className="text-sm" style={{ color: theme.mutedFg }}>
          No playlists yet — create one so every session opens with ambience
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2" aria-label="Playlists">
      {playlists.map(playlist => (
        <li
          key={playlist.id}
          className="rounded-xl px-4 py-3"
          style={{ background: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPlay?.(playlist)}
              disabled={!onPlay || playlist.tracks.length === 0}
              aria-label={`Play ${playlist.name}`}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
              style={{ background: `${theme.primary}20`, color: theme.primary }}
            >
              <Play className="w-3.5 h-3.5" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: theme.foreground }}>
                {playlist.name}
              </p>
              <p className="text-xs" style={{ color: theme.mutedFg }}>
                {trackSummary(playlist)}
              </p>
            </div>

            {playlist.isDefault ? (
              <span
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shrink-0"
                style={{ background: `${theme.accent}20`, color: theme.accent }}
              >
                <Star className="w-3 h-3" />
                Default playlist
              </span>
            ) : (
              onMakeDefault && (
                <button
                  onClick={() => onMakeDefault(playlist)}
                  aria-label={`Make ${playlist.name} default`}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium shrink-0"
                  style={{
                    background: theme.overlay(0.06),
                    border: `1px solid ${theme.border}`,
                    color: theme.mutedFg,
                  }}
                >
                  Make Default
                </button>
              )
            )}
          </div>

          {playlist.tracks.length > 0 && (
            <ul className="mt-2.5 pl-11 space-y-1" aria-label={`Tracks in ${playlist.name}`}>
              {playlist.tracks.map((track, index) => (
                <li key={track.id} className="text-xs truncate" style={{ color: theme.mutedFg }}>
                  {index + 1}. {track.name}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

// ── Create Playlist screen ─────────────────────────────────────
function CreatePlaylistScreen({
  theme,
  audioFiles,
  onCancel,
  onCreated,
}: {
  theme: DashTheme;
  audioFiles: AudioFile[];
  onCancel: () => void;
  onCreated: (playlist: Playlist) => void;
}) {
  const [name, setName] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCreate = name.trim().length > 0 && chosen.length > 0 && !busy;

  // Chosen order is kept, so the playlist plays in the order it was built up.
  const toggle = (id: string) =>
    setChosen(prev => (prev.includes(id) ? prev.filter(chosenId => chosenId !== id) : [...prev, id]));

  const handleCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      onCreated(await createPlaylist(name.trim(), chosen));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Your session has expired — sign in again to create playlists."
          : err instanceof Error
            ? err.message
            : "The playlist could not be created",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="rounded-2xl p-6 max-w-lg"
      style={{ background: theme.card, border: `1px solid ${theme.border}` }}
    >
      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.foreground }}>
        Name
      </label>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Deep work ambience"
        className="w-full rounded-xl px-3 py-2 text-sm mb-5 outline-none"
        style={{ background: theme.overlay(0.05), border: `1px solid ${theme.border}`, color: theme.foreground }}
      />

      <p className="text-sm font-medium mb-1.5" style={{ color: theme.foreground }}>
        Audio Files
      </p>
      <p className="text-xs mb-2.5" style={{ color: theme.mutedFg }}>
        Only what you choose here goes into the playlist.
      </p>

      {audioFiles.length === 0 ? (
        <p className="text-sm mb-5" style={{ color: theme.mutedFg }}>
          No audio files yet — add audio files first, then build a playlist from them.
        </p>
      ) : (
        <div
          className="rounded-xl mb-5 max-h-64 overflow-y-auto"
          style={{ border: `1px solid ${theme.border}` }}
        >
          {audioFiles.map(file => (
            <label
              key={file.id}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
              style={{ borderBottom: `1px solid ${theme.border}` }}
            >
              <input
                type="checkbox"
                checked={chosen.includes(file.id)}
                onChange={() => toggle(file.id)}
                className="w-4 h-4 shrink-0"
                style={{ accentColor: theme.primary }}
              />
              <span className="text-sm truncate" style={{ color: theme.foreground }}>
                {file.name}
              </span>
            </label>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs mb-4" style={{ color: "#ef4444" }} role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm font-medium"
          style={{ background: theme.overlay(0.06), border: `1px solid ${theme.border}`, color: theme.mutedFg }}
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!canCreate}
          className="rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-40"
          style={{ background: theme.primary, color: theme.primaryFg }}
        >
          {busy ? "Creating…" : "Create"}
        </button>
      </div>
    </div>
  );
}

// ── Playlists view ─────────────────────────────────────────────
export function PlaylistsView({
  theme,
  onPlay,
}: {
  theme: DashTheme;
  onPlay?: (playlist: Playlist) => void;
}) {
  const [screen, setScreen] = useState<Screen>("list");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(isBackendConfigured);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { signedIn, checking, refresh } = useSignedIn();

  useEffect(() => {
    if (!isBackendConfigured) return;
    let cancelled = false;

    Promise.all([listPlaylists(), listAudioFiles()])
      .then(([savedPlaylists, files]) => {
        if (cancelled) return;
        setPlaylists(savedPlaylists);
        setAudioFiles(files);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Playlists could not be loaded");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreated = (created: Playlist) => {
    setPlaylists(prev => [...prev, created]);
    setScreen("confirm");
  };

  /** Only one playlist can be the default, so the others stand down here too. */
  const handleMakeDefault = async (playlist: Playlist) => {
    setLoadError(null);
    try {
      const updated = await makePlaylistDefault(playlist.id);
      setPlaylists(prev => prev.map(p => ({ ...p, isDefault: p.id === updated.id })));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "The default playlist could not be changed");
    }
  };

  const list = (
    <PlaylistList
      playlists={playlists}
      theme={theme}
      onPlay={onPlay}
      onMakeDefault={signedIn ? handleMakeDefault : undefined}
    />
  );

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: theme.foreground }}>
            Playlists
          </h2>
          <p className="text-sm mt-0.5" style={{ color: theme.mutedFg }}>
            Curate what plays when someone arrives and when they start a session
          </p>
        </div>

        {screen === "list" && signedIn && (
          <button
            onClick={() => setScreen("create")}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shrink-0"
            style={{ background: theme.primary, color: theme.primaryFg }}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Playlist
          </button>
        )}
      </div>

      {!isBackendConfigured && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: theme.overlay(0.05), border: `1px solid ${theme.border}`, color: theme.mutedFg }}
        >
          Playlists are stored in the cloud. Deploy a backend with{" "}
          <code style={{ color: theme.foreground }}>npx ampx sandbox</code> to create and play them.
        </div>
      )}

      {isBackendConfigured && !checking && !signedIn && (
        <AudioAccountPanel
          theme={theme}
          onSignedIn={refresh}
          purpose="create playlists"
          browsingNote="Listening is open to everyone — building a playlist needs an account."
        />
      )}

      {loadError && (
        <p className="text-sm mb-4" style={{ color: "#ef4444" }} role="alert">
          {loadError}
        </p>
      )}

      {screen === "create" && (
        <CreatePlaylistScreen
          theme={theme}
          audioFiles={audioFiles}
          onCancel={() => setScreen("list")}
          onCreated={handleCreated}
        />
      )}

      {screen === "confirm" && (
        <div>
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5"
            style={{ background: `${theme.primary}18`, border: `1px solid ${theme.primary}40` }}
          >
            <Check className="w-4 h-4 shrink-0" style={{ color: theme.primary }} />
            <span className="text-sm font-medium" style={{ color: theme.foreground }}>
              Playlist saved
            </span>
          </div>

          <h3 className="text-sm font-semibold mb-2.5" style={{ color: theme.foreground }}>
            Playlists
          </h3>
          {list}

          <button
            onClick={() => setScreen("list")}
            className="mt-5 rounded-xl px-4 py-2 text-sm font-medium"
            style={{ background: theme.overlay(0.06), border: `1px solid ${theme.border}`, color: theme.foreground }}
          >
            Done
          </button>
        </div>
      )}

      {screen === "list" &&
        (loading ? (
          <p className="text-sm" style={{ color: theme.mutedFg }}>
            Loading playlists…
          </p>
        ) : (
          list
        ))}
    </div>
  );
}
