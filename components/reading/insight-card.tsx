import { cn } from "@/lib/utils";

type Tone = "lesson" | "takeaway" | "dua";

const tones: Record<Tone, { label: string; border: string; bg: string }> = {
  lesson: {
    label: "Key lesson",
    border: "border-l-primary",
    bg: "bg-primary/[0.04]",
  },
  takeaway: {
    label: "Try today",
    border: "border-l-accent",
    bg: "bg-accent/[0.06]",
  },
  dua: {
    label: "Related dua",
    border: "border-l-muted-foreground/40",
    bg: "bg-secondary/40",
  },
};

export function InsightCard({
  tone,
  children,
  arabic = false,
  className,
}: {
  tone: Tone;
  children: React.ReactNode;
  arabic?: boolean;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <aside
      className={cn(
        "rounded-xl border-l-4 p-4 sm:p-5",
        t.border,
        t.bg,
        "border-y border-r border-border/40",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t.label}
      </p>
      <div
        className={cn(
          "mt-2 leading-relaxed",
          arabic
            ? "text-right text-xl leading-[2] [font-family:var(--font-arabic),serif]"
            : "font-serif text-[15px] sm:text-base",
        )}
        {...(arabic ? { lang: "ar", dir: "rtl" } : {})}
      >
        {children}
      </div>
    </aside>
  );
}
