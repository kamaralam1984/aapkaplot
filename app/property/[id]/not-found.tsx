import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

export default function PropertyNotFound() {
  return (
    <>
      <Navbar />
      <main>
        <Container className="grid min-h-[60vh] place-items-center py-20 text-center">
          <div>
            <p className="text-[12.5px] font-semibold uppercase tracking-wider text-brand-600">404</p>
            <h1 className="mt-2 text-display-md font-display text-ink-900">
              We couldn't find that property
            </h1>
            <p className="mt-2 max-w-md text-[14px] text-ink-500">
              It may have been sold, paused or removed. Try searching nearby properties instead.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link href="/">
                <Button variant="primary" size="lg">Back to home</Button>
              </Link>
              <Link href="/search">
                <Button variant="outline" size="lg">Browse properties</Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
