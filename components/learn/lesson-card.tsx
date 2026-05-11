import Link from "next/link";
import { Check, Clock, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LessonCard({
  id,
  title,
  minutes,
  completed = false,
  locked = false,
  upNext = false,
  className,
}: {
  id: string;
  title: string;
  minutes: number;
  completed?: boolean;
  locked?: boolean;
  upNext?: boolean;
  className?: string;
}) {
  const inner = (
    <Card
      className={cn(
        "flex items-center gap-4 p-4 transition-colors",
        !locked && "hover:border-border hover:bg-secondary/30",
        locked && "opacity-60",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          completed && "bg-primary text-primary-foreground",
          !completed && !locked && "border border-border bg-background",
          locked && "border border-border bg-muted",
        )}
        aria-hidden
      >
        {completed ? (
          <Check className="size-4" />
        ) : locked ? (
          <Lock className="size-4 text-muted-foreground" />
        ) : (
          <Clock className="size-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {completed ? "Completed" : `${minutes} min${upNext ? " · Up next" : ""}`}
        </p>
      </div>
    </Card>
  );

  if (locked) return inner;
  return (
    <Link
      href={`/learn/${id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
    >
      {inner}
    </Link>
  );
}
