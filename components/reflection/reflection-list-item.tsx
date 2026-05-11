import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Reflection } from "@/lib/services/reflection.service";

function preview(text: string, max = 120) {
  const trimmed = text.trim();
  return trimmed.length > max ? trimmed.slice(0, max).trimEnd() + "…" : trimmed;
}

export function ReflectionListItem({ reflection }: { reflection: Reflection }) {
  return (
    <Link
      href={`/reflect/${reflection.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
    >
      <Card className="p-5 transition-colors hover:border-border hover:bg-secondary/30">
        <p className="font-serif text-lg leading-tight">{reflection.title}</p>
        <p className="mt-2 line-clamp-2 font-serif text-sm leading-relaxed text-muted-foreground">
          {preview(reflection.body)}
        </p>
        <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
          {new Date(reflection.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </p>
      </Card>
    </Link>
  );
}
