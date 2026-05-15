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
export async function buildProviders() {
  const providers: any[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    try {
      // @ts-expect-error — optional dep, only loaded when keys exist.
      const Google = (await import("next-auth/providers/google")).default;
      providers.push(
        Google({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })
      );
    } catch (err) {
      console.warn("[auth] Google provider not installed:", (err as Error).message);
    }
  }

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    try {
      // @ts-expect-error — optional dep
      const Apple = (await import("next-auth/providers/apple")).default;
      providers.push(
        Apple({
          clientId: process.env.APPLE_CLIENT_ID,
          clientSecret: process.env.APPLE_CLIENT_SECRET,
        })
      );
    } catch (err) {
      console.warn("[auth] Apple provider not installed:", (err as Error).message);
    }
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    try {
      // @ts-expect-error — optional dep
      const GitHub = (await import("next-auth/providers/github")).default;
      providers.push(
        GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        })
      );
    } catch (err) {
      console.warn("[auth] GitHub provider not installed:", (err as Error).message);
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
