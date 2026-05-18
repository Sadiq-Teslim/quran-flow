import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";
import { mockDb, persistDb } from "@/lib/mocks/db";
import { simulateNetwork } from "@/lib/mocks/delay";

export const LessonSchema = z.object({
  id: z.string(),
  stage: z.number(),
  stageName: z.string(),
  title: z.string(),
  minutes: z.number(),
  order: z.number(),
  summary: z.string(),
  body: z.string(),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const LearnPathSchema = z.object({
  stages: z.array(
    z.object({
      stage: z.number(),
      stageName: z.string(),
      lessons: z.array(
        LessonSchema.extend({ completed: z.boolean() }).omit({ body: true }),
      ),
      progressPct: z.number(),
      locked: z.boolean(),
    }),
  ),
});
export type LearnPath = z.infer<typeof LearnPathSchema>;

export const EducationStageSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z.string(),
  moduleCount: z.number(),
  completedCount: z.number(),
});
export type EducationStage = z.infer<typeof EducationStageSchema>;

const ApiModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  stage: z.union([z.string(), z.number()]).optional(),
  stage_name: z.string().nullable().optional(),
  order_index: z.number().nullable().optional(),
  order: z.number().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  minutes: z.number().nullable().optional(),
  content_markdown: z.string().nullable().optional(),
  body: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  completed: z.boolean().optional(),
});

const ApiStagesSchema = z.object({
  stages: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      description: z.string(),
      module_count: z.number(),
      completed_count: z.number(),
    }),
  ),
});

type ApiModule = z.infer<typeof ApiModuleSchema>;

function stageNumber(stage: string | number | undefined) {
  if (typeof stage === "number") return stage;
  const normalized = (stage ?? "foundation").toLowerCase();
  if (normalized.includes("foundation")) return 1;
  if (normalized.includes("understanding")) return 2;
  if (normalized.includes("application")) return 3;
  if (normalized.includes("reflection")) return 4;
  return Number.parseInt(normalized, 10) || 1;
}

function stageName(stage: string) {
  const normalized = stage.replace(/[_-]/g, " ");
  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapApiModule(module: ApiModule): Lesson {
  const stage = stageNumber(module.stage);
  return LessonSchema.parse({
    id: module.id,
    stage,
    stageName: module.stage_name ?? stageName(String(module.stage ?? stage)),
    title: module.title,
    minutes: module.duration_minutes ?? module.minutes ?? 3,
    order: module.order_index ?? module.order ?? 0,
    summary:
      module.summary ??
      module.description ??
      "A short guided lesson for today's Quran journey.",
    body:
      module.content_markdown ??
      module.body ??
      module.description ??
      "This module is being prepared by the QuranFlow learning team.",
  });
}

async function getRemoteCompletedLessonIds(): Promise<string[]> {
  return [];
}

function buildLearnPath(lessons: Lesson[], completedLessonIds: string[]): LearnPath {
  const stages: LearnPath["stages"] = [];
  const grouped = new Map<number, Lesson[]>();
  for (const l of lessons) {
    if (!grouped.has(l.stage)) grouped.set(l.stage, []);
    grouped.get(l.stage)!.push(l);
  }
  let prevComplete = true;
  for (const stage of [...grouped.keys()].sort((a, b) => a - b)) {
    const stageLessons = grouped.get(stage)!.sort((a, b) => a.order - b.order);
    const completedCount = stageLessons.filter((l) =>
      completedLessonIds.includes(l.id),
    ).length;
    const allComplete = completedCount === stageLessons.length;
    stages.push({
      stage,
      stageName: stageLessons[0].stageName,
      lessons: stageLessons.map((lesson) => ({
        id: lesson.id,
        stage: lesson.stage,
        stageName: lesson.stageName,
        title: lesson.title,
        minutes: lesson.minutes,
        order: lesson.order,
        summary: lesson.summary,
        completed: completedLessonIds.includes(lesson.id),
      })),
      progressPct: Math.round((completedCount / stageLessons.length) * 100),
      locked: !prevComplete,
    });
    prevComplete = allComplete;
  }
  return LearnPathSchema.parse({ stages });
}

export async function getLearnPath(): Promise<LearnPath> {
  try {
    const feed = z
      .object({
        lessons: z.array(ApiModuleSchema).optional(),
        modules: z.array(ApiModuleSchema).optional(),
        items: z.array(ApiModuleSchema).optional(),
      })
      .parse(await apiFetch<unknown>("/api/v1/education/feed", { auth: hasAccessToken() }));
    const modules = feed.lessons ?? feed.modules ?? feed.items ?? [];
    if (modules.length > 0) {
      return buildLearnPath(
        modules.map(mapApiModule),
        modules.filter((module) => module.completed).map((module) => module.id),
      );
    }
  } catch {
    // The backend currently has no seed modules in some environments.
  }

  await simulateNetwork(200, 500);
  return buildLearnPath(mockDb.lessons, mockDb.completedLessonIds);
}

export async function getLesson(
  id: string,
): Promise<Lesson & { completed: boolean }> {
  try {
    const lessonModule = ApiModuleSchema.parse(
      await apiFetch<unknown>(`/api/v1/education/lessons/${id}`),
    );
    const completedIds = await getRemoteCompletedLessonIds();
    return { ...mapApiModule(lessonModule), completed: completedIds.includes(id) };
  } catch {
    // Use the local learning path until the backend has module content.
  }

  await simulateNetwork(100, 250);
  const lesson = mockDb.lessons.find((x) => x.id === id);
  if (!lesson) throw new Error("Lesson not found");
  const parsed = LessonSchema.parse(lesson);
  return { ...parsed, completed: mockDb.completedLessonIds.includes(id) };
}

export async function markLessonComplete(id: string): Promise<{ ok: true }> {
  if (hasAccessToken()) {
    try {
      await apiFetch(`/api/v1/education/lessons/${id}/complete`, {
        auth: true,
        method: "POST",
      });
      return { ok: true };
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(150, 350);
  if (!mockDb.completedLessonIds.includes(id)) {
    mockDb.completedLessonIds = [...mockDb.completedLessonIds, id];
    persistDb();
  }
  return { ok: true };
}

export async function getEducationStages(): Promise<EducationStage[]> {
  if (!hasAccessToken()) return [];
  try {
    const response = ApiStagesSchema.parse(
      await apiFetch<unknown>("/api/v1/education/stages", { auth: true }),
    );
    return response.stages.map((stage) =>
      EducationStageSchema.parse({
        key: stage.key,
        title: stage.title,
        description: stage.description,
        moduleCount: stage.module_count,
        completedCount: stage.completed_count,
      }),
    );
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return [];
  }
}
