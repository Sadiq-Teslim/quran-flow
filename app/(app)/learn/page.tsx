"use client";

import { Lock } from "lucide-react";
import { useEducationStages, useLearnPath } from "@/hooks/use-learn";
import { ScreenHeader } from "@/components/nav/screen-header";
import { LessonCard } from "@/components/learn/lesson-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function LearnPage() {
  const { data, isLoading } = useLearnPath();
  const stages = useEducationStages();

  return (
    <div className="pb-6">
      <ScreenHeader title="Learn" subtitle="Your path to understanding" />
      <div className="space-y-8 px-5 sm:px-6">
        {stages.data?.length ? (
          <section className="grid grid-cols-2 gap-3">
            {stages.data.map((stage) => (
              <div
                key={stage.key}
                className="rounded-lg border border-border/60 bg-card p-4"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-accent">
                  {stage.completedCount}/{stage.moduleCount}
                </p>
                <p className="mt-1 font-serif leading-tight">{stage.title}</p>
              </div>
            ))}
          </section>
        ) : null}
        {isLoading || !data ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          data.stages.map((stage, idx) => {
            const upNextId = stage.lessons.find((l) => !l.completed)?.id;
            return (
              <section key={stage.stage} className="space-y-3">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-accent">
                      Stage {stage.stage} - {stage.stageName}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {stage.locked
                        ? "Unlocks when previous stage is complete."
                        : `${stage.progressPct}% complete`}
                    </p>
                  </div>
                  {stage.locked ? (
                    <Lock className="size-4 text-muted-foreground" aria-hidden />
                  ) : null}
                </div>
                <div
                  className={cn(
                    "h-1.5 w-full overflow-hidden rounded-full bg-muted",
                    idx > 0 && "mt-1",
                  )}
                >
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${stage.progressPct}%` }}
                  />
                </div>
                <div className="space-y-3 pt-2">
                  {stage.lessons.map((l) => (
                    <LessonCard
                      key={l.id}
                      id={l.id}
                      title={l.title}
                      minutes={l.minutes}
                      completed={l.completed}
                      locked={stage.locked}
                      upNext={l.id === upNextId && !l.completed && !stage.locked}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
