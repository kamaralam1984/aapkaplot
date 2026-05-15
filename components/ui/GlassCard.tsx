import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "soft" | "strong";
}

export function GlassCard({
  intensity = "soft",
  className,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border",
        intensity === "soft"
          ? "bg-white/70 backdrop-blur-xl border-white/60 shadow-card"
          : "bg-white/90 backdrop-blur-2xl border-white/70 shadow-lift",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
