import { Facebook, Instagram, Twitter, Youtube, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { Icon: Facebook,  href: "https://facebook.com/aapkaplot",   label: "Facebook"  },
  { Icon: Instagram, href: "https://instagram.com/aapkaplot",  label: "Instagram" },
  { Icon: Twitter,   href: "https://x.com/aapkaplot",          label: "X (Twitter)" },
  { Icon: Youtube,   href: "https://youtube.com/@aapkaplot",   label: "YouTube"   },
  { Icon: Linkedin,  href: "https://linkedin.com/company/aapkaplot", label: "LinkedIn" },
];

export function FooterSocial({ className }: { className?: string }) {
  return (
    <div className={cn("flex gap-2", className)}>
      {LINKS.map(({ Icon, href, label }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="grid h-9 w-9 place-items-center rounded-xl border border-ink-200 bg-white text-ink-700 transition hover:border-brand-500/40 hover:text-brand-600"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
