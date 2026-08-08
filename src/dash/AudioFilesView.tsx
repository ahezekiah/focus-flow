import { useEffect, useRef, useState } from "react";
import { Check, ListMusic, Play, Plus, Upload } from "lucide-react";
import type { DashTheme } from "./themes";
import { addAudioFile, listAudioFiles, ApiError, type AudioFile } from "../lib/api";
import { isBackendConfigured } from "../lib/amplify";
import { AudioAccountPanel } from "./AudioAccountPanel";
import { useSignedIn } from "../lib/useSignedIn";

type Screen = "list" | "add" | "confirm";

function fmtBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── The list of audio files that have been added ───────────────
function AudioFileList({
  files,
  theme,
  onPlay,
}: {
  files: AudioFile[];
  theme: DashTheme;
  onPlay?: (file: AudioFile) => void;
}) {
  if (files.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ background: theme.card, border: `1px solid ${theme.border}` }}
      >
        <ListMusic className="w-6 h-6 mx-auto mb-2" style={{ color: theme.mutedFg }} />
        <p className="text-sm" style={{ color: theme.mutedFg }}>
          No audio files yet — add one to start building a playlist
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {files.map(file => (
        <li
          key={file.id}
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: theme.card, border: `1px solid ${theme.border}` }}
        >
          <button
            onClick={() => onPlay?.(file)}
            disabled={!onPlay}
            aria-label={`Play ${file.name}`}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40"
            style={{ background: `${theme.primary}20`, color: theme.primary }}
          >
            <Play className="w-3.5 h-3.5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" style={{ color: theme.foreground }}>
              {file.name}
            </p>
            <p className="text-xs truncate" style={{ color: theme.mutedFg }}>
              {file.fileName} · {fmtBytes(file.sizeBytes)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Add Audio screen ───────────────────────────────────────────
function AddAudioScreen({
  theme,
  onCancel,
  onAdded,
}: {
  theme: DashTheme;
  onCancel: () => void;
  onAdded: (file: AudioFile) => void;
}) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAdd = name.trim().length > 0 && file !== null && !busy;

  const handleBrowse = (chosen: File | null) => {
    setFile(chosen);
    // Offer the file's own name so the designer only types when they want to
    if (chosen && !name.trim()) setName(chosen.name.replace(/\.[^/.]+$/, ""));
  };

  const handleAdd = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onAdded(await addAudioFile(name.trim(), file));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? "Your session has expired — sign in again to add audio files."
          : err instanceof Error
            ? err.message
            : "The audio file could not be added",
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
        placeholder="Deep focus rain"
        className="w-full rounded-xl px-3 py-2 text-sm mb-5 outline-none"
        style={{ background: theme.overlay(0.05), border: `1px solid ${theme.border}`, color: theme.foreground }}
      />

      <label className="block text-sm font-medium mb-1.5" style={{ color: theme.foreground }}>
        File
      </label>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
          style={{ background: theme.overlay(0.06), border: `1px solid ${theme.border}`, color: theme.foreground }}
        >
          <Upload className="w-3.5 h-3.5" />
          Browse
        </button>
        <span className="text-xs truncate" style={{ color: theme.mutedFg }}>
          {file ? `${file.name} · ${fmtBytes(file.size)}` : "No file chosen"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={e => {
            handleBrowse(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </div>

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
          onClick={handleAdd}
          disabled={!canAdd}
          className="rounded-xl px-5 py-2 text-sm font-semibold disabled:opacity-40"
          style={{ background: theme.primary, color: theme.primaryFg }}
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </div>
    </div>
  );
}

// ── Audio Files view ───────────────────────────────────────────
export function AudioFilesView({
  theme,
  onPlay,
  onLibraryChange,
}: {
  theme: DashTheme;
  onPlay?: (file: AudioFile) => void;
  onLibraryChange?: (files: AudioFile[]) => void;
}) {
  const [screen, setScreen] = useState<Screen>("list");
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [loading, setLoading] = useState(isBackendConfigured);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { signedIn, checking, refresh } = useSignedIn();

  useEffect(() => {
    if (!isBackendConfigured) return;
    let cancelled = false;

    listAudioFiles()
      .then(loaded => {
        if (cancelled) return;
        setFiles(loaded);
        onLibraryChange?.(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Audio files could not be loaded");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdded = (added: AudioFile) => {
    const next = [...files, added];
    setFiles(next);
    onLibraryChange?.(next);
    setScreen("confirm");
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: theme.foreground }}>
            Audio Files
          </h2>
          <p className="text-sm mt-0.5" style={{ color: theme.mutedFg }}>
            Add music and ambience so it is ready to play in a playlist
          </p>
        </div>

        {screen === "list" && signedIn && (
          <button
            onClick={() => setScreen("add")}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shrink-0"
            style={{ background: theme.primary, color: theme.primaryFg }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Audio File
          </button>
        )}
      </div>

      {!isBackendConfigured && (
        <div
          className="rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: theme.overlay(0.05), border: `1px solid ${theme.border}`, color: theme.mutedFg }}
        >
          Audio files are stored in the cloud. Deploy a backend with{" "}
          <code style={{ color: theme.foreground }}>npx ampx sandbox</code> to add and play them.
        </div>
      )}

      {isBackendConfigured && !checking && !signedIn && (
        <AudioAccountPanel theme={theme} onSignedIn={refresh} />
      )}

      {loadError && (
        <p className="text-sm mb-4" style={{ color: "#ef4444" }} role="alert">
          {loadError}
        </p>
      )}

      {screen === "add" && (
        <AddAudioScreen theme={theme} onCancel={() => setScreen("list")} onAdded={handleAdded} />
      )}

      {screen === "confirm" && (
        <div>
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 mb-5"
            style={{ background: `${theme.primary}18`, border: `1px solid ${theme.primary}40` }}
          >
            <Check className="w-4 h-4 shrink-0" style={{ color: theme.primary }} />
            <span className="text-sm font-medium" style={{ color: theme.foreground }}>
              Audio file complete
            </span>
          </div>

          <h3 className="text-sm font-semibold mb-2.5" style={{ color: theme.foreground }}>
            Audio Files
          </h3>
          <AudioFileList files={files} theme={theme} onPlay={onPlay} />

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
            Loading audio files…
          </p>
        ) : (
          <AudioFileList files={files} theme={theme} onPlay={onPlay} />
        ))}
    </div>
  );
}
