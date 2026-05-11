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
  total_verses_read: z.number(),
  total_reflections: z.number(),
  current_streak_days: z.number(),
  longest_streak_days: z.number(),
  total_days_engaged: z.number(),
});

const ApiProgressListSchema = z.object({
  items: z.array(z.object({ is_completed: z.boolean() })),
});

const ApiConsistencySchema = z.object({
  score: z.number(),
});

const ApiWeeklyConsistencySchema = z.array(
  z.object({ week: z.string(), hits: z.number(), total: z.number() }),
);

const ApiVersesReadSchema = z.array(
  z.object({ day: z.string(), verses: z.number() }),
);

export async function getProgressSummary(): Promise<ProgressSummary> {
  if (hasAccessToken()) {
    try {
      const [overview, lessonProgress] = await Promise.all([
        apiFetch<unknown>("/api/v1/analytics/overview", { auth: true }),
        apiFetch<unknown>("/api/v1/education/me/progress", { auth: true }),
      ]);
      const parsedOverview = ApiOverviewSchema.parse(overview);
      const parsedProgress = ApiProgressListSchema.parse(lessonProgress);
      return ProgressSummarySchema.parse({
        versesThisMonth: parsedOverview.total_verses_read,
        reflectionsThisMonth: parsedOverview.total_reflections,
        lessonsCompletedThisMonth: parsedProgress.items.filter((item) => item.is_completed).length,
        identity: mockDb.progressSummary.identity,
        identityEarnedWeeksAgo: mockDb.progressSummary.identityEarnedWeeksAgo,
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
        apiFetch<unknown>("/api/v1/habits/consistency-score?days=30", {
          auth: true,
        }),
        apiFetch<unknown>("/api/v1/analytics/weekly-consistency", {
          auth: true,
        }),
        apiFetch<unknown>("/api/v1/analytics/verses-read", {
          auth: true,
        }),
      ]);
      return AnalyticsSchema.parse({
        consistencyScore: ApiConsistencySchema.parse(consistency).score,
        weeklyConsistency: ApiWeeklyConsistencySchema.parse(weekly),
        versesRead: ApiVersesReadSchema.parse(verses),
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
