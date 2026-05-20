"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useStreak, useWeekActivity } from "@/hooks/use-streak";
import { useTodayPlan } from "@/hooks/use-today-plan";
import { useLearnPath } from "@/hooks/use-learn";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IdentityBadge } from "@/components/identity-badge";
import { StreakRing } from "@/components/streak-ring";
import { WeekDots } from "@/components/week-dots";
import { DayPlanCard } from "@/components/day-plan-card";

export default function HomePage() {
  const user = useUser();
  const streak = useStreak();
  const week = useWeekActivity();
  const plan = useTodayPlan();
  const learn = useLearnPath();

  const nextLesson = learn.data?.stages
    .flatMap((s) => s.lessons.map((l) => ({ ...l, locked: s.locked })))
    .find((l) => !l.completed && !l.locked);

  return (
    <div className="space-y-8 px-5 pb-6 pt-8 sm:px-6">
      <header>
        {user.isLoading ? (
          <Skeleton className="h-7 w-44" />
        ) : (
          <h1 className="font-serif text-3xl leading-tight tracking-tight">
            {!user.data || user.data.isAnonymous
              ? "As-salamu alaykum."
              : `As-salamu alaykum, ${user.data.name}.`}
          </h1>
        )}
        {user.data?.identity ? (
          <div className="mt-2">
            <IdentityBadge label={`Your path: ${user.data.identity}`} />
          </div>
        ) : null}
      </header>

      <Card className="bg-gradient-to-b from-primary/[0.05] to-transparent">
        <div className="flex items-center gap-5 p-6">
          {streak.isLoading || !streak.data ? (
            <Skeleton className="size-24 rounded-full" />
          ) : (
            <StreakRing value={streak.data.current} max={Math.max(30, streak.data.longest)} />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-serif text-xl leading-tight">
              {streak.data ? `${streak.data.current} day streak` : "Your streak"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {streak.data?.noZeroDayMode
                ? "No-zero days kept."
                : "Three verses keeps the day alive."}
            </p>
            {streak.data ? (
              <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                Longest - {streak.data.longest}
              </p>
            ) : null}
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-tight">Today&apos;s reading</h2>
        {plan.isLoading ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : plan.data ? (
          <DayPlanCard plan={plan.data} />
        ) : (
          <Card className="p-5 text-sm text-muted-foreground">
            Something didn&apos;t load. Pull to refresh.
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl leading-tight">Continue learning</h2>
        {learn.isLoading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : nextLesson ? (
          <Link
            href={`/learn/${nextLesson.id}`}
            className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="flex items-center gap-3 p-5 transition-colors hover:border-border hover:bg-secondary/30">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wider text-accent">
                  {nextLesson.stageName}
                </p>
                <p className="mt-1 truncate font-serif text-lg leading-tight">
                  {nextLesson.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {nextLesson.minutes} min read
                </p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
            </Card>
          </Link>
        ) : (
          <Card className="p-5 text-sm text-muted-foreground">
            You&apos;re all caught up. Beautiful.
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl leading-tight">This week</h2>
        {week.isLoading || !week.data ? (
          <Skeleton className="h-12 w-full rounded-xl" />
        ) : (
          <WeekDots days={week.data.days} />
        )}
      </section>
    </div>
  );
}
