import { cn } from "@/lib/utils";

export function IdentityBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-accent" aria-hidden />
      {label}
    </span>
  );
}
