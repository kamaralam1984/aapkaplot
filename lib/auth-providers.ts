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

export async function buildProviders() {
  const providers: any[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const mod = await importOptional<any>("next-auth/providers/google");
    if (mod?.default) {
      providers.push(
        mod.default({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
      );
    }
  }

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    const mod = await importOptional<any>("next-auth/providers/apple");
    if (mod?.default) {
      providers.push(
        mod.default({
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
        })
      );
    }
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    const mod = await importOptional<any>("next-auth/providers/github");
    if (mod?.default) {
      providers.push(
        mod.default({
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
