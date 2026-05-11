"use client";

import {
  mockUser,
  mockVerses,
  mockTodayPlan,
  mockStreak,
  mockWeekActivity,
  mockLessons,
  mockReflections,
  mockProgressSummary,
  mockInsights,
  mockStreakHistory,
} from "@/lib/mocks/fixtures";

const STORAGE_KEY = "qf-mock-db-v1";

type Reflection = (typeof mockReflections)[number];

type PersistedShape = {
  user: typeof mockUser;
  reflections: Reflection[];
  completedLessonIds: string[];
};

const initial: PersistedShape = {
  user: mockUser,
  reflections: mockReflections,
  completedLessonIds: ["l_foundation_1"],
};

function loadPersisted(): PersistedShape {
  if (typeof window === "undefined") return initial;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch {
    return initial;
  }
}

function persist(state: PersistedShape) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const persisted = loadPersisted();

export const mockDb = {
  user: persisted.user,
  verses: mockVerses,
  todayPlan: mockTodayPlan,
  streak: mockStreak,
  weekActivity: mockWeekActivity,
  lessons: mockLessons,
  reflections: persisted.reflections,
  completedLessonIds: persisted.completedLessonIds,
  progressSummary: mockProgressSummary,
  insights: mockInsights,
  streakHistory: mockStreakHistory,
};

export function persistDb() {
  persist({
    user: mockDb.user,
    reflections: mockDb.reflections,
    completedLessonIds: mockDb.completedLessonIds,
  });
}
