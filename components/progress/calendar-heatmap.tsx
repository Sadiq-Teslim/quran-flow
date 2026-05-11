"use client";

import { cn } from "@/lib/utils";

export function CalendarHeatmap({
  days,
  className,
}: {
  days: { date: string; read: boolean }[];
  className?: string;
}) {
  const weeks: { date: string; read: boolean }[][] = [];
  let currentWeek: { date: string; read: boolean }[] = [];
  for (const d of days) {
    const dow = new Date(d.date).getDay();
    if (currentWeek.length === 0 && dow !== 1) {
      for (let i = 0; i < ((dow + 6) % 7); i++) {
        currentWeek.push({ date: `pad-${i}-${d.date}`, read: false });
      }
    }
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length) weeks.push(currentWeek);

  return (
    <div className={cn("flex gap-1.5 overflow-x-auto pb-1", className)} aria-hidden>
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1.5">
          {week.map((d) => (
            <span
              key={d.date}
              className={cn(
                "size-3 rounded-[3px]",
                d.date.startsWith("pad-")
                  ? "bg-transparent"
                  : d.read
                    ? "bg-primary"
                    : "bg-muted",
              )}
              title={d.date.startsWith("pad-") ? "" : d.date}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
