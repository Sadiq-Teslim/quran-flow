import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";

export const GuidedContentSchema = z.object({
  welcomeMessage: z.string(),
  modules: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      stage: z.string(),
    }),
  ),
  starterVerses: z.array(
    z.object({
      id: z.number(),
      chapterId: z.number(),
      verseNumber: z.number(),
      textEnglish: z.string(),
    }),
  ),
  nextSteps: z.array(z.string()),
});
export type GuidedContent = z.infer<typeof GuidedContentSchema>;

export async function getGuidedContent(): Promise<GuidedContent | null> {
  if (!hasAccessToken()) return null;
  try {
    const response = z.object({
      lessons: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string().nullable().optional(),
          stage: z.union([z.string(), z.number()]).optional(),
        }),
      ).optional(),
    }).parse(
      await apiFetch<unknown>("/api/v1/education/feed", { auth: true }),
    );
    return GuidedContentSchema.parse({
      welcomeMessage: "Start gently. QuranFlow will guide your first steps.",
      modules: (response.lessons ?? []).slice(0, 3).map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description ?? null,
        stage: String(module.stage ?? "foundation"),
      })),
      starterVerses: [],
      nextSteps: ["Read three verses.", "Save one reflection.", "Return tomorrow."],
    });
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return null;
  }
}
