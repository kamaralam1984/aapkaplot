"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { captureException } from "@/lib/sentry";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
    captureException(error, {
      level: "error",
      tags: { runtime: "client", route: "global" },
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <main className="bg-surface">
      <Container className="grid min-h-screen place-items-center py-20 text-center">
        <div className="max-w-lg">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-display-md font-display text-ink-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
            We hit an unexpected error. The team has been notified — please try
            again or head back to the home page.
          </p>
          {error.digest && (
            <p className="mt-2 inline-block rounded-full bg-ink-100 px-3 py-1 font-mono text-[11px] text-ink-500">
              ref: {error.digest}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={reset}
              iconLeft={<RotateCcw className="h-4 w-4" />}
            >
              Try again
            </Button>
            <Link href="/">
              <Button variant="outline" size="lg" iconLeft={<Home className="h-4 w-4" />}>
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
