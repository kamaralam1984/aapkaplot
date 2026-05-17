import Link from "next/link";
import Image from "next/image";
import { Youtube, Play, ExternalLink } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { YOUTUBE_CHANNEL_URL, type YouTubeVideo } from "@/lib/youtube";

interface YouTubeRailProps {
  videos: YouTubeVideo[];
}

/**
 * Latest videos from the @aapkaplot YouTube channel. Server-rendered, free
 * (RSS feed only, no API key). When the channel is empty / unreachable the
 * rail simply doesn't render.
 */
export function YouTubeRail({ videos }: YouTubeRailProps) {
  if (!videos.length) return null;
  const [hero, ...rest] = videos;
  const channelName = hero.channelName;

  return (
    <section className="relative mt-12">
      <Container size="wide">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/70 bg-rose-50 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wider text-rose-700">
              <Youtube className="h-3.5 w-3.5" />
              YouTube · {channelName}
            </span>
            <h2 className="mt-2 text-display-md font-display text-ink-900">
              Property tours, market reads & deep-dives
            </h2>
            <p className="mt-1 text-[13.5px] text-ink-500">
              Subscribe for weekly walkthroughs and India real-estate insights.
            </p>
          </div>
          <Link
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#ff0000] px-4 text-[13.5px] font-bold text-white shadow-soft hover:brightness-95"
          >
            <Youtube className="h-4 w-4" />
            Subscribe
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          {/* Hero video */}
          <Link
            href={hero.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block aspect-video overflow-hidden rounded-2xl bg-ink-100"
          >
            <Image
              src={hero.thumbnailUrl}
              alt={hero.title}
              fill
              sizes="(min-width:1024px) 60vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <span className="absolute left-4 top-4 grid h-14 w-14 place-items-center rounded-full bg-[#ff0000] text-white shadow-glow transition group-hover:scale-110">
              <Play className="h-6 w-6 fill-current" />
            </span>
            <div className="absolute inset-x-4 bottom-4">
              <p className="line-clamp-2 text-[15px] font-bold text-white drop-shadow">
                {hero.title}
              </p>
              <p className="mt-1 text-[11.5px] text-white/80">
                {new Date(hero.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
          </Link>

          {/* Sidebar list */}
          <ul className="space-y-3">
            {rest.slice(0, 4).map((v) => (
              <li key={v.id}>
                <Link
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group surface-card flex gap-3 overflow-hidden p-2 transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <div className="relative aspect-video h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                    <Image
                      src={v.thumbnailUrl}
                      alt={v.title}
                      fill
                      sizes="112px"
                      className="object-cover"
                      unoptimized
                    />
                    <span className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                      <Play className="h-5 w-5 fill-white text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <p className="line-clamp-2 text-[13px] font-semibold text-ink-900">
                      {v.title}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-500">
                      {new Date(v.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
