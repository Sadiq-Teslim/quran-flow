import { z } from "zod";
import { apiFetch, hasAccessToken } from "@/lib/api/client";

export const TajweedLessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.string(),
  exampleVerseRef: z.string(),
});
export type TajweedLesson = z.infer<typeof TajweedLessonSchema>;

export const TajweedFeedbackSchema = z.object({
  id: z.string(),
  verseId: z.number().nullable(),
  audioUrl: z.string().nullable(),
  pronunciationScore: z.number().nullable(),
  feedbackSummary: z.string().nullable(),
  notes: z.string().nullable(),
});
export type TajweedFeedback = z.infer<typeof TajweedFeedbackSchema>;

const ApiLessonsSchema = z.object({
  lessons: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      difficulty: z.string(),
      example_verse_ref: z.string(),
    }),
  ),
});

const ApiFeedbackSchema = z.object({
  id: z.string(),
  verse_id: z.number().nullable().optional(),
  audio_url: z.string().nullable().optional(),
  pronunciation_score: z.number().nullable().optional(),
  feedback_summary: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

function mapFeedback(feedback: z.infer<typeof ApiFeedbackSchema>) {
  return TajweedFeedbackSchema.parse({
    id: feedback.id,
    verseId: feedback.verse_id ?? null,
    audioUrl: feedback.audio_url ?? null,
    pronunciationScore: feedback.pronunciation_score ?? null,
    feedbackSummary: feedback.feedback_summary ?? null,
    notes: feedback.notes ?? null,
  });
}

export async function listTajweedLessons(): Promise<TajweedLesson[]> {
  const response = ApiLessonsSchema.parse(
    await apiFetch<unknown>("/api/v1/tajweed/lessons"),
  );
  return response.lessons.map((lesson) =>
    TajweedLessonSchema.parse({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      difficulty: lesson.difficulty,
      exampleVerseRef: lesson.example_verse_ref,
    }),
  );
}

export async function listTajweedFeedback(): Promise<TajweedFeedback[]> {
  if (!hasAccessToken()) return [];
  try {
    const feedback = z
      .array(ApiFeedbackSchema)
      .parse(await apiFetch<unknown>("/api/v1/tajweed/my-feedback", { auth: true }));
    return feedback.map(mapFeedback);
  } catch {
    return [];
  }
}

export async function submitTajweedFeedback(input: {
  verseId?: number;
  audioUrl?: string;
  score?: number;
  notes?: string;
}) {
  const feedback = ApiFeedbackSchema.parse(
    await apiFetch<unknown>("/api/v1/tajweed/feedback", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        verse_id: input.verseId ?? null,
        audio_url: input.audioUrl || null,
        pronunciation_score: input.score ?? null,
        notes: input.notes || null,
      }),
    }),
  );
  return mapFeedback(feedback);
}
