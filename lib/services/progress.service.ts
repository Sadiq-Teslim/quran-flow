import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";
import { mockDb } from "@/lib/mocks/db";
import { simulateNetwork } from "@/lib/mocks/delay";

export const ProgressSummarySchema = z.object({
  versesThisMonth: z.number(),
  reflectionsThisMonth: z.number(),
  lessonsCompletedThisMonth: z.number(),
  identity: z.string(),
  identityEarnedWeeksAgo: z.number(),
});
export type ProgressSummary = z.infer<typeof ProgressSummarySchema>;

export const InsightSchema = z.object({ id: z.string(), text: z.string() });
export type Insight = z.infer<typeof InsightSchema>;

export const AnalyticsSchema = z.object({
  consistencyScore: z.number(),
  weeklyConsistency: z.array(
    z.object({ week: z.string(), hits: z.number(), total: z.number() }),
  ),
  versesRead: z.array(z.object({ day: z.string(), verses: z.number() })),
});
export type Analytics = z.infer<typeof AnalyticsSchema>;

const ApiOverviewSchema = z.object({
  verses_this_month: z.number().optional(),
  total_verses_read: z.number().optional(),
  reflections_this_month: z.number().optional(),
  total_reflections: z.number().optional(),
  lessons_completed_this_month: z.number().optional(),
  lessons_completed: z.number().optional(),
  identity: z.string().optional(),
  identity_earned_weeks_ago: z.number().optional(),
});

const ApiConsistencySchema = z.object({
  score: z.number(),
});

export async function getProgressSummary(): Promise<ProgressSummary> {
  if (hasAccessToken()) {
    try {
      const overview = await apiFetch<unknown>("/api/v1/progress/summary", { auth: true });
      const parsedOverview = ApiOverviewSchema.parse(overview);
      return ProgressSummarySchema.parse({
        versesThisMonth:
          parsedOverview.verses_this_month ?? parsedOverview.total_verses_read ?? 0,
        reflectionsThisMonth:
          parsedOverview.reflections_this_month ?? parsedOverview.total_reflections ?? 0,
        lessonsCompletedThisMonth:
          parsedOverview.lessons_completed_this_month ??
          parsedOverview.lessons_completed ??
          0,
        identity: parsedOverview.identity ?? mockDb.progressSummary.identity,
        identityEarnedWeeksAgo:
          parsedOverview.identity_earned_weeks_ago ??
          mockDb.progressSummary.identityEarnedWeeksAgo,
      });
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(100, 250);
  return ProgressSummarySchema.parse({
    ...mockDb.progressSummary,
    reflectionsThisMonth: mockDb.reflections.length,
    lessonsCompletedThisMonth: mockDb.completedLessonIds.length,
  });
}

export async function getInsights(): Promise<Insight[]> {
  await simulateNetwork(200, 400);
  return mockDb.insights.map((i) => InsightSchema.parse(i));
}

export async function getAnalytics(): Promise<Analytics> {
  if (hasAccessToken()) {
    try {
      const [consistency, weekly, verses] = await Promise.all([
        apiFetch<unknown>("/api/v1/progress/summary", {
          auth: true,
        }),
        apiFetch<unknown>("/api/v1/progress/activity-days?limit=30", {
          auth: true,
        }),
        apiFetch<unknown>("/api/v1/progress/activity-days?limit=7", {
          auth: true,
        }),
      ]);
      const days = z
        .object({
          days: z.array(z.record(z.string(), z.unknown())).optional(),
          items: z.array(z.record(z.string(), z.unknown())).optional(),
        })
        .parse(weekly);
      const activity = days.days ?? days.items ?? [];
      return AnalyticsSchema.parse({
        consistencyScore:
          ApiConsistencySchema.partial().parse(consistency).score ??
          Math.round((activity.filter((day) => day.read || day.completed).length / 30) * 100),
        weeklyConsistency: [{ week: "Current", hits: activity.filter((day) => day.read || day.completed).length, total: Math.max(activity.length, 1) }],
        versesRead: (z
          .object({
            days: z.array(z.record(z.string(), z.unknown())).optional(),
            items: z.array(z.record(z.string(), z.unknown())).optional(),
          })
          .parse(verses).days ?? [])
          .map((day) => ({
            day: String(day.date ?? day.day ?? ""),
            verses: Number(day.verses_read ?? day.verses ?? 0),
          })),
      });
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  return AnalyticsSchema.parse({
    consistencyScore: 76,
    weeklyConsistency: [{ week: "Demo", hits: 5, total: 7 }],
    versesRead: [
      { day: "Mon", verses: 8 },
      { day: "Tue", verses: 12 },
      { day: "Wed", verses: 6 },
      { day: "Thu", verses: 10 },
      { day: "Fri", verses: 14 },
    ],
  });
}
