"use client";

import { useStreak, useStreakHistory } from "@/hooks/use-streak";
import { useAnalytics, useProgressSummary, useInsights } from "@/hooks/use-progress";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarHeatmap } from "@/components/progress/calendar-heatmap";
import { IdentityBadge } from "@/components/identity-badge";

export default function ProgressPage() {
  const summary = useProgressSummary();
  const streak = useStreak();
  const history = useStreakHistory();
  const insights = useInsights();
  const analytics = useAnalytics();

  return (
    <div className="pb-6">
      <ScreenHeader title="Your journey" subtitle="A quiet record, just for you" />
      <div className="space-y-8 px-5 sm:px-6">
        <Card className="bg-gradient-to-b from-accent/[0.06] to-transparent p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Identity
          </p>
          {summary.isLoading || !summary.data ? (
            <Skeleton className="mt-3 h-9 w-48" />
          ) : (
            <>
              <p className="mt-2 font-serif text-3xl leading-tight">
                {summary.data.identity}
              </p>
              <div className="mt-3">
                <IdentityBadge
                  label={`Earned ${summary.data.identityEarnedWeeksAgo} weeks ago`}
                />
              </div>
            </>
          )}
        </Card>

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-xl leading-tight">Streak</h2>
            {streak.data ? (
              <p className="text-sm text-muted-foreground">
                {streak.data.current} days · longest {streak.data.longest}
              </p>
            ) : null}
          </div>
          {history.isLoading || !history.data ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : (
            <Card className="p-4">
              <CalendarHeatmap days={history.data} />
              <p className="mt-3 text-xs text-muted-foreground">
                Last 90 days
              </p>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl leading-tight">This month</h2>
          {summary.isLoading || !summary.data ? (
            <Skeleton className="h-24 w-full rounded-2xl" />
          ) : (
            <Card className="space-y-3 p-5 font-serif text-base leading-relaxed">
              <p>
                <span className="text-muted-foreground">Verses read · </span>
                <span className="font-semibold">{summary.data.versesThisMonth}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Reflections · </span>
                <span className="font-semibold">
                  {summary.data.reflectionsThisMonth}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Lessons completed · </span>
                <span className="font-semibold">
                  {summary.data.lessonsCompletedThisMonth}
                </span>
              </p>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl leading-tight">Consistency analytics</h2>
          {analytics.isLoading || !analytics.data ? (
            <Skeleton className="h-28 w-full rounded-2xl" />
          ) : (
            <Card className="space-y-4 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  30-day consistency
                </p>
                <p className="mt-1 font-serif text-3xl leading-tight">
                  {Math.round(analytics.data.consistencyScore)}%
                </p>
              </div>
              <div className="grid grid-cols-5 items-end gap-2">
                {analytics.data.versesRead.slice(-5).map((item) => (
                  <div key={item.day} className="space-y-2">
                    <div
                      className="rounded-t-md bg-primary/70"
                      style={{ height: `${Math.max(8, item.verses * 3)}px` }}
                    />
                    <p className="truncate text-center text-[10px] text-muted-foreground">
                      {item.day}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl leading-tight">Insights</h2>
          {insights.isLoading || !insights.data ? (
            <Skeleton className="h-20 w-full rounded-2xl" />
          ) : (
            <div className="space-y-3">
              {insights.data.map((i) => (
                <Card key={i.id} className="p-5">
                  <p className="font-serif italic leading-relaxed">{i.text}</p>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
