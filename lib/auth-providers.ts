/**
 * NextAuth provider config. Each provider is enabled only when its
 * environment credentials are present, so the app keeps booting in
 * dev without OAuth keys.
 *
 * Required env per provider:
 *   Google : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   Apple  : APPLE_CLIENT_ID, APPLE_CLIENT_SECRET
 *   GitHub : GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 */
import { importOptional } from "./optional-import";

/**
 * next-auth v4 ships its providers as CJS. An ESM `await import(...)` of a
 * CJS module gives us a namespace where `default` is the module.exports
 * object itself, and the real factory function lives at `default.default`.
 * Different bundlers/Node versions occasionally hand us the flatter shape,
 * so we probe three levels deep.
 */
function unwrapFactory(mod: unknown): ((opts: unknown) => unknown) | null {
  if (typeof mod === "function") return mod as (opts: unknown) => unknown;
  if (mod && typeof mod === "object") {
    const m = mod as { default?: unknown };
    if (typeof m.default === "function") return m.default as (opts: unknown) => unknown;
    if (m.default && typeof m.default === "object") {
      const inner = (m.default as { default?: unknown }).default;
      if (typeof inner === "function") return inner as (opts: unknown) => unknown;
    }
  }
  return null;
}

export async function buildProviders() {
  const providers: unknown[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const mod = await importOptional<unknown>("next-auth/providers/google");
    const factory = unwrapFactory(mod);
    if (factory) {
      providers.push(
        factory({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
      );
    } else {
      console.warn(
        "[auth-providers] google factory not callable. module shape:",
        Object.keys((mod as object) ?? {})
      );
    }
  }

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    const mod = await importOptional<unknown>("next-auth/providers/apple");
    const factory = unwrapFactory(mod);
    if (factory) {
      providers.push(
        factory({
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
        })
      );
    }
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    const mod = await importOptional<unknown>("next-auth/providers/github");
    const factory = unwrapFactory(mod);
    if (factory) {
      providers.push(
        factory({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        })
      );
    }
  }

  return providers;
}

export function isOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID ||
      process.env.APPLE_CLIENT_ID ||
      process.env.GITHUB_CLIENT_ID
  );
}
