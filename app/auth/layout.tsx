import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-surface lg:grid-cols-[1.05fr_1fr]">
      {/* Left: form */}
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16">
        <Logo />
        <div className="my-auto w-full max-w-md self-center">{children}</div>
        <footer className="mt-12 text-[12px] text-ink-500">
          <p>
            By continuing you agree to AapKaPlot's{" "}
            <Link href="#" className="underline-offset-2 hover:underline">Terms</Link> &amp;{" "}
            <Link href="#" className="underline-offset-2 hover:underline">Privacy</Link>.
          </p>
        </footer>
      </div>

      {/* Right: brand panel */}
      <aside className="relative hidden overflow-hidden bg-brand-gradient lg:block">
        <div className="absolute inset-0 bg-noise opacity-50" aria-hidden />
        <div className="absolute inset-0 dot-grid opacity-30" aria-hidden />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" aria-hidden />

        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold backdrop-blur-md w-fit">
            <span className="h-1.5 w-1.5 rounded-full bg-white" /> Trusted by 20,000+ buyers
          </div>

          <div>
            <p className="text-[40px] font-display font-bold leading-[1.1] tracking-tight">
              Your next address,
              <br /> discovered by AI.
            </p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/85">
              Find verified plots, flats and houses near you with live satellite view,
              AI investment scoring and instant WhatsApp leads.
            </p>
          </div>

          <ul className="space-y-2.5 text-[13.5px] text-white/85">
            <li className="inline-flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">✓</span>
              100% verified owners
            </li>
            <li className="inline-flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">✓</span>
              Live nearby property engine
            </li>
            <li className="inline-flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">✓</span>
              AI investment recommendations
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
