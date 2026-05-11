import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";
import { mockDb } from "@/lib/mocks/db";
import { simulateNetwork } from "@/lib/mocks/delay";

export const StreakSchema = z.object({
  current: z.number(),
  longest: z.number(),
  lastReadDate: z.string(),
  noZeroDayMode: z.boolean(),
});
export type Streak = z.infer<typeof StreakSchema>;

export const WeekActivitySchema = z.object({
  weekStart: z.string(),
  days: z.array(
    z.object({
      day: z.string(),
      date: z.string(),
      read: z.boolean(),
    }),
  ),
});
export type WeekActivity = z.infer<typeof WeekActivitySchema>;

export const StreakHistorySchema = z.array(
  z.object({ date: z.string(), read: z.boolean() }),
);
export type StreakHistory = z.infer<typeof StreakHistorySchema>;

const ApiStreakSchema = z.object({
  current_streak: z.number(),
  longest_streak: z.number(),
  total_days_engaged: z.number(),
});

const ApiHabitHistorySchema = z.object({
  items: z.array(
    z.object({
      tracking_date: z.string(),
      actual_reading_verses: z.number(),
      reflection_completed: z.boolean(),
      educational_content_engaged: z.boolean(),
      minimum_session_completed: z.boolean(),
    }),
  ),
});

export async function getStreak(): Promise<Streak> {
  if (hasAccessToken()) {
    try {
      const streak = ApiStreakSchema.parse(
        await apiFetch<unknown>("/api/v1/habits/streak", { auth: true }),
      );
      return StreakSchema.parse({
        current: streak.current_streak,
        longest: streak.longest_streak,
        lastReadDate: new Date().toISOString().slice(0, 10),
        noZeroDayMode: true,
      });
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(100, 250);
  return StreakSchema.parse(mockDb.streak);
}

export async function getWeekActivity(): Promise<WeekActivity> {
  if (hasAccessToken()) {
    try {
      const history = await getStreakHistory();
      const days = history.slice(-7).map((day) => ({
        day: new Date(`${day.date}T00:00:00`).toLocaleDateString("en", {
          weekday: "short",
        }),
        date: day.date,
        read: day.read,
      }));
      return WeekActivitySchema.parse({
        weekStart: days[0]?.date ?? new Date().toISOString().slice(0, 10),
        days,
      });
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(100, 250);
  return WeekActivitySchema.parse(mockDb.weekActivity);
}

export async function getStreakHistory(): Promise<StreakHistory> {
  if (hasAccessToken()) {
    try {
      const history = ApiHabitHistorySchema.parse(
        await apiFetch<unknown>("/api/v1/habits/history?days=90", { auth: true }),
      );
      return StreakHistorySchema.parse(
        history.items.map((item) => ({
          date: item.tracking_date,
          read:
            item.minimum_session_completed ||
            item.actual_reading_verses > 0 ||
            item.reflection_completed ||
            item.educational_content_engaged,
        })),
      );
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(200, 400);
  return StreakHistorySchema.parse(mockDb.streakHistory);
}

const ApiReEntrySchema = z.object({
  id: z.string(),
  reason: z.string(),
  days_inactive: z.number(),
  message: z.string(),
  simplified_plan: z.object({
    id: z.string(),
    name: z.string(),
    verses_per_day: z.number(),
  }),
});

export async function startReEntry(reason = "manual_restart") {
  const response = ApiReEntrySchema.parse(
    await apiFetch<unknown>("/api/v1/habits/re-entry", {
      auth: true,
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  );
  return {
    id: response.id,
    reason: response.reason,
    daysInactive: response.days_inactive,
    message: response.message,
    plan: {
      id: response.simplified_plan.id,
      name: response.simplified_plan.name,
      versesPerDay: response.simplified_plan.verses_per_day,
    },
  };
}
