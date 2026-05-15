"use client";

import { useState } from "react";
import { Play } from "lucide-react";

function parseYouTubeId(input: string): string | null {
  // Handles youtu.be/<id>, youtube.com/watch?v=<id>, youtube.com/embed/<id>
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtu.be")) return url.pathname.slice(1) || null;
    if (url.hostname.includes("youtube.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      const m = url.pathname.match(/\/embed\/([\w-]{6,})/);
      if (m) return m[1];
    }
  } catch {
    // bare 11-char id
    if (/^[\w-]{11}$/.test(input)) return input;
  }
  return null;
}

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

export function YouTubeEmbed({ url, title = "Property walkthrough" }: YouTubeEmbedProps) {
  const id = parseYouTubeId(url);
  const [active, setActive] = useState(false);

  if (!id) {
    return (
      <div className="grid aspect-video place-items-center bg-ink-100 text-[12.5px] text-ink-500">
        Invalid YouTube URL
      </div>
    );
  }

  if (!active) {
    return (
      <button
        type="button"
        onClick={() => setActive(true)}
        aria-label={`Play ${title}`}
        className="group relative grid aspect-video w-full place-items-center overflow-hidden bg-black"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
        />
        <span className="relative grid h-16 w-16 place-items-center rounded-full bg-white/95 text-rose-600 shadow-lift transition group-hover:scale-105">
          <Play className="h-7 w-7 translate-x-0.5 fill-current" />
        </span>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white shadow-soft">
          Video Tour
        </span>
      </button>
    );
  }

  return (
    <iframe
      className="aspect-video w-full"
      src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
