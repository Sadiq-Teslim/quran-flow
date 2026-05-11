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

const ApiGuidedContentSchema = z.object({
  welcome_message: z.string(),
  foundation_modules: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable().optional(),
      stage: z.string(),
    }),
  ),
  starter_verses: z.array(
    z.object({
      id: z.number(),
      chapter_id: z.number(),
      verse_number: z.number(),
      text_en: z.string(),
    }),
  ),
  next_steps: z.array(z.string()),
});

export async function getGuidedContent(): Promise<GuidedContent | null> {
  if (!hasAccessToken()) return null;
  try {
    const response = ApiGuidedContentSchema.parse(
      await apiFetch<unknown>("/api/v1/new-muslim/guided-content", {
        auth: true,
      }),
    );
    return GuidedContentSchema.parse({
      welcomeMessage: response.welcome_message,
      modules: response.foundation_modules.map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description ?? null,
        stage: module.stage,
      })),
      starterVerses: response.starter_verses.map((verse) => ({
        id: verse.id,
        chapterId: verse.chapter_id,
        verseNumber: verse.verse_number,
        textEnglish: verse.text_en,
      })),
      nextSteps: response.next_steps,
    });
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return null;
  }
}
