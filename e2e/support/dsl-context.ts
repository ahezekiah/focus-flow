import { createHash } from "crypto";

/**
 * Temporal isolation. Every value the DSL writes into the system and later searches for
 * gets a short run-unique suffix, so two runs against the same sandbox never find each
 * other's data. Specs never see this — they always write plain names.
 *
 * See `.claude/prompt-snippets/e2e-conventions.md` for when to alias and when not to.
 */
export class DslContext {
  readonly seed: string;
  private readonly hash: string;
  private readonly aliases = new Map<string, string>();
  private sequence = 0;

  constructor(seed: string | number = Date.now()) {
    this.seed = String(seed);
    this.hash = createHash("sha256").update(this.seed).digest("hex").slice(0, 4);
  }

  /** `"Rainfall"` → `"Rainfall1a3f2"`. Stable for the life of this context. */
  alias(value: string): string {
    const cached = this.aliases.get(value);
    if (cached) return cached;

    const aliased = `${value}${++this.sequence}${this.hash}`;
    this.aliases.set(value, aliased);
    return aliased;
  }

  /** Aliases only the local part, so the result stays a valid address. */
  aliasEmail(email: string): string {
    const [local, domain] = email.split("@");
    return `${this.alias(local)}@${domain || "example.com"}`;
  }

  /** `"Playlist for ${Rainfall}"` → `"Playlist for Rainfall1a3f2"`. */
  interpolate(text: string): string {
    return text.replace(/\$\{([^}]+)\}/g, (_match, name: string) => {
      const known = this.aliases.get(name.trim());
      if (!known) throw new Error(`"${name.trim()}" has not been aliased in this context yet`);
      return known;
    });
  }
}
