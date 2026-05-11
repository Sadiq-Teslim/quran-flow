import { cn } from "@/lib/utils";

export function WeekDots({
  days,
  className,
}: {
  days: { day: string; date: string; read: boolean }[];
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {days.map((d) => (
        <div key={d.date} className="flex flex-col items-center gap-2">
          <span
            className={cn(
              "size-3 rounded-full transition-colors",
              d.read ? "bg-primary" : "border border-border bg-transparent",
            )}
            aria-label={`${d.day} ${d.read ? "read" : "not read"}`}
          />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {d.day[0]}
          </span>
        </div>
      ))}
    </div>
  );
}
