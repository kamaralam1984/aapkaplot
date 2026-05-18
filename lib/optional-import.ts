/**
 * Dynamic import that bypasses webpack's static analyzer. Use this for
 * optional dependencies (next-auth, @anthropic-ai/sdk, @aws-sdk/*) so
 * production builds don't fail when the package isn't installed.
 *
 *   const sdk = await importOptional<typeof import("next-auth")>("next-auth");
 *   if (!sdk) return fallback();
 */

// The `Function` constructor keeps the import expression opaque to bundlers.
const dynamicImport: (name: string) => Promise<any> = new Function(
  "n",
  "return import(n)"
) as any;

export async function importOptional<T = any>(name: string): Promise<T | null> {
  try {
    return (await dynamicImport(name)) as T;
  } catch {
    return null;
  }
}
