/**
 * Tiny Sentry / GlitchTip reporter — no SDK dependency.
 *
 * Sentry's "store" endpoint accepts a single Event JSON. GlitchTip is
 * Sentry-protocol compatible, so the same code targets either backend.
 *
 *   - Set SENTRY_DSN in env to enable.
 *     DSN format:  https://<publicKey>@<host>/<projectId>
 *   - When empty / unparseable, captureException is a console-warn no-op.
 *
 * Free to run: GlitchTip self-hosted via deploy/glitchtip.docker-compose.yml.
 */

interface DsnParts {
  publicKey: string;
  host: string;
  scheme: string;
  projectId: string;
}

function parseDsn(dsn: string | undefined): DsnParts | null {
  if (!dsn) return null;
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\/+/, "").split("/").pop();
    if (!u.username || !projectId) return null;
    return {
      publicKey: u.username,
      host: u.host,
      scheme: u.protocol.replace(":", ""),
      projectId,
    };
  } catch {
    return null;
  }
}

const DSN = parseDsn(process.env.SENTRY_DSN);
const ENVIRONMENT = process.env.NODE_ENV;
const RELEASE = process.env.NEXT_PUBLIC_RELEASE ?? "dev";

function eventEnvelopeUrl(dsn: DsnParts): string {
  return `${dsn.scheme}://${dsn.host}/api/${dsn.projectId}/store/`;
}

function authHeader(dsn: DsnParts): string {
  return [
    "Sentry sentry_version=7",
    `sentry_client=aapkaplot/1`,
    `sentry_key=${dsn.publicKey}`,
  ].join(", ");
}

interface CaptureContext {
  level?: "error" | "warning" | "info";
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export async function captureException(
  err: unknown,
  context: CaptureContext = {}
): Promise<void> {
  if (!DSN) {
    // Quiet in console — useful in dev, but don't spam logs in prod.
    if (typeof window === "undefined") {
      console.warn("[sentry:noop]", err);
    }
    return;
  }

  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Unknown error";
  const stack = err instanceof Error ? err.stack : undefined;
  const type = err instanceof Error ? err.name : "Error";

  const event = {
    event_id: randomId(),
    timestamp: Date.now() / 1000,
    platform: "javascript",
    level: context.level ?? "error",
    environment: ENVIRONMENT,
    release: RELEASE,
    tags: context.tags ?? {},
    extra: context.extra ?? {},
    exception: {
      values: [
        {
          type,
          value: message,
          stacktrace: stack
            ? {
                frames: parseStack(stack),
              }
            : undefined,
        },
      ],
    },
  };

  try {
    await fetch(eventEnvelopeUrl(DSN), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": authHeader(DSN),
      },
      body: JSON.stringify(event),
      keepalive: true,
    });
  } catch {
    // Never let the reporter throw — it would mask the original error.
  }
}

function randomId(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseStack(stack: string) {
  // Naive parser: Sentry expects `frames` in oldest-first order.
  return stack
    .split("\n")
    .slice(1)
    .map((line) => {
      const m = line.match(/at (.+?) \((.+?):(\d+):(\d+)\)/) ||
                line.match(/at (.+?):(\d+):(\d+)/);
      if (!m) return { function: line.trim() };
      if (m.length === 5) {
        return { function: m[1], filename: m[2], lineno: Number(m[3]), colno: Number(m[4]) };
      }
      return { filename: m[1], lineno: Number(m[2]), colno: Number(m[3]) };
    })
    .reverse();
}
