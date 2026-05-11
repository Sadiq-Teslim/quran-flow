"use client";

import Link from "next/link";
import { PenLine, Plus } from "lucide-react";
import { useReflections } from "@/hooks/use-reflections";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReflectionListItem } from "@/components/reflection/reflection-list-item";
import { EmptyState } from "@/components/empty-state";

function groupByPeriod(reflections: { id: string; createdAt: string }[]) {
  const today: typeof reflections = [];
  const week: typeof reflections = [];
  const earlier: typeof reflections = [];
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  for (const r of reflections) {
    const d = new Date(r.createdAt);
    if (d >= startOfToday) today.push(r);
    else if (d >= startOfWeek) week.push(r);
    else earlier.push(r);
  }
  return { today, week, earlier };
}

export default function ReflectPage() {
  const { data, isLoading } = useReflections();
  const groups = data ? groupByPeriod(data) : null;

  return (
    <div className="pb-6">
      <ScreenHeader
        title="Reflections"
        subtitle="A quiet record of what stays with you"
        right={
          <Button asChild size="icon" variant="secondary" aria-label="New reflection">
            <Link href="/reflect/new">
              <Plus className="size-4" aria-hidden />
            </Link>
          </Button>
        }
      />
      <div className="px-5 sm:px-6">
        {isLoading || !data || !groups ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            icon={PenLine}
            title="No reflections yet."
            description="The first one is the hardest. Write a sentence and you've begun."
            action={
              <Button asChild>
                <Link href="/reflect/new">Write the first one</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-8">
            {groups.today.length ? (
              <section className="space-y-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Today
                </h2>
                <div className="space-y-3">
                  {groups.today.map((r) => (
                    <ReflectionListItem key={r.id} reflection={r as never} />
                  ))}
                </div>
              </section>
            ) : null}
            {groups.week.length ? (
              <section className="space-y-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  This week
                </h2>
                <div className="space-y-3">
                  {groups.week.map((r) => (
                    <ReflectionListItem key={r.id} reflection={r as never} />
                  ))}
                </div>
              </section>
            ) : null}
            {groups.earlier.length ? (
              <section className="space-y-3">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Earlier
                </h2>
                <div className="space-y-3">
                  {groups.earlier.map((r) => (
                    <ReflectionListItem key={r.id} reflection={r as never} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
