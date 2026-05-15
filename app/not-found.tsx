import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main>
        <Container className="grid min-h-[65vh] place-items-center py-20 text-center">
          <div className="max-w-xl">
            <p className="text-[12.5px] font-semibold uppercase tracking-wider text-brand-600">
              404
            </p>
            <h1 className="mt-2 text-display-lg font-display text-ink-900">
              Page not found
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink-600">
              The page you're looking for doesn't exist or has moved. Try
              searching for properties, or head back home.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/">
                <Button variant="primary" size="lg" iconLeft={<ArrowLeft className="h-4 w-4" />}>
                  Back to home
                </Button>
              </Link>
              <Link href="/search">
                <Button variant="outline" size="lg" iconLeft={<Search className="h-4 w-4" />}>
                  Browse properties
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
