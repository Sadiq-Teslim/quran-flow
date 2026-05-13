import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";
import { mockDb } from "@/lib/mocks/db";
import { simulateNetwork } from "@/lib/mocks/delay";

export const VerseSchema = z.object({
  id: z.number().optional(),
  surah: z.number(),
  surahName: z.string(),
  ayah: z.number(),
  arabic: z.string(),
  transliteration: z.string(),
  translation: z.string(),
  lesson: z.string().optional(),
  takeaway: z.string().optional(),
  relatedDua: z.string().optional(),
});
export type Verse = z.infer<typeof VerseSchema>;

export const TodayPlanSchema = z.object({
  id: z.string(),
  date: z.string(),
  surah: z.number(),
  surahName: z.string(),
  startAyah: z.number(),
  endAyah: z.number(),
  estimatedMinutes: z.number(),
  anchor: z.enum(["after_fajr", "morning", "afternoon", "maghrib", "before_sleep"]),
  verses: z.array(z.number()),
});
export type TodayPlan = z.infer<typeof TodayPlanSchema>;

export const ChapterSchema = z.object({
  id: z.number(),
  number: z.number(),
  nameArabic: z.string(),
  nameEnglish: z.string(),
  meaning: z.string().nullable(),
  revelationType: z.string(),
  verseCount: z.number(),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const VerseLocalizationSchema = z.object({
  id: z.string(),
  verseId: z.number(),
  language: z.string(),
  kind: z.string(),
  content: z.string(),
  reviewStatus: z.string(),
});
export type VerseLocalization = z.infer<typeof VerseLocalizationSchema>;

export const ReadingHistoryItemSchema = z.object({
  id: z.string(),
  chapterId: z.number(),
  startVerse: z.number(),
  endVerse: z.number(),
  versesCompleted: z.number(),
  durationMinutes: z.number().nullable(),
  deviceType: z.string().nullable(),
  completed: z.boolean(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type ReadingHistoryItem = z.infer<typeof ReadingHistoryItemSchema>;

const ApiVerseSchema = z.object({
  id: z.number(),
  chapter_id: z.number(),
  verse_number: z.number(),
  text_ar: z.string(),
  text_transliteration: z.string().nullable().optional(),
  text_en: z.string(),
  tafsir_summary: z.string().nullable().optional(),
  key_lesson: z.string().nullable().optional(),
  actionable_takeaway: z.string().nullable().optional(),
});

const ApiChapterSchema = z.object({
  id: z.number(),
  number: z.number(),
  name_ar: z.string().optional(),
  name_en: z.string(),
  name_transliteration: z.string().nullable().optional(),
  revelation_type: z.string().optional(),
  verse_count: z.number(),
});

const ApiChapterListSchema = z.object({
  items: z.array(ApiChapterSchema),
});

const ApiChapterDetailSchema = z.object({
  chapter: ApiChapterSchema,
});

const ApiVerseLocalizationsSchema = z.object({
  verse_id: z.number(),
  items: z.array(
    z.object({
      id: z.string(),
      verse_id: z.number(),
      language: z.string(),
      content_kind: z.string(),
      content: z.string(),
      review_status: z.string(),
    }),
  ),
});

const ApiReadingHistorySchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      chapter_id: z.number(),
      start_verse: z.number(),
      end_verse: z.number(),
      verses_completed: z.number(),
      session_duration_minutes: z.number().nullable().optional(),
      device_type: z.string().nullable().optional(),
      completed: z.boolean(),
      completed_at: z.string().nullable().optional(),
      created_at: z.string(),
    }),
  ),
  total: z.number(),
});

const ApiTodayPlanSchema = z.object({
  plan_id: z.string().nullable().optional(),
  verses_per_day: z.number(),
  verses: z.array(ApiVerseSchema),
});

type ApiVerse = z.infer<typeof ApiVerseSchema>;
type ApiChapter = z.infer<typeof ApiChapterSchema>;

const chapterCache = new Map<number, ApiChapter>();

async function getChapter(chapterId: number): Promise<ApiChapter> {
  const cached = chapterCache.get(chapterId);
  if (cached) return cached;

  const detail = ApiChapterDetailSchema.parse(
    await apiFetch<unknown>(`/api/v1/quran/chapters/${chapterId}?page=1&per_page=1`),
  );
  chapterCache.set(chapterId, detail.chapter);
  return detail.chapter;
}

async function mapApiVerse(verse: ApiVerse): Promise<Verse> {
  const chapter = await getChapter(verse.chapter_id);
  return VerseSchema.parse({
    id: verse.id,
    surah: verse.chapter_id,
    surahName: chapter.name_en,
    ayah: verse.verse_number,
    arabic: verse.text_ar,
    transliteration: verse.text_transliteration ?? "",
    translation: verse.text_en,
    lesson: verse.key_lesson ?? verse.tafsir_summary ?? undefined,
    takeaway: verse.actionable_takeaway ?? undefined,
  });
}

function mapApiChapter(chapter: ApiChapter): Chapter {
  return ChapterSchema.parse({
    id: chapter.id,
    number: chapter.number,
    nameArabic: chapter.name_ar ?? "",
    nameEnglish: chapter.name_en,
    meaning: chapter.name_transliteration ?? null,
    revelationType: chapter.revelation_type ?? "",
    verseCount: chapter.verse_count,
  });
}

export async function listChapters(): Promise<Chapter[]> {
  const responses = await Promise.all([
    apiFetch<unknown>("/api/v1/quran/chapters?page=1&per_page=100"),
    apiFetch<unknown>("/api/v1/quran/chapters?page=2&per_page=100"),
  ]);
  const chapters = responses.flatMap(
    (response) => ApiChapterListSchema.parse(response).items,
  );
  for (const chapter of chapters) chapterCache.set(chapter.number, chapter);
  return chapters.map(mapApiChapter);
}

export async function searchVerses(query: string): Promise<Verse[]> {
  if (query.trim().length < 2) return [];
  const response = z
    .object({ items: z.array(ApiVerseSchema) })
    .parse(
      await apiFetch<unknown>(
        `/api/v1/quran/search?q=${encodeURIComponent(query.trim())}&page=1&per_page=20`,
      ),
    );
  return Promise.all(response.items.map(mapApiVerse));
}

export async function getVerseLocalizations(verseId?: number) {
  if (!verseId) return [];
  const response = ApiVerseLocalizationsSchema.parse(
    await apiFetch<unknown>(`/api/v1/quran/verses/${verseId}/localizations`),
  );
  return response.items.map((item) =>
    VerseLocalizationSchema.parse({
      id: item.id,
      verseId: item.verse_id,
      language: item.language,
      kind: item.content_kind,
      content: item.content,
      reviewStatus: item.review_status,
    }),
  );
}

export async function getReadingHistory(): Promise<{
  items: ReadingHistoryItem[];
  total: number;
}> {
  if (!hasAccessToken()) return { items: [], total: 0 };
  try {
    const response = ApiReadingHistorySchema.parse(
      await apiFetch<unknown>("/api/v1/quran/reading-history?page=1&page_size=20", {
        auth: true,
      }),
    );
    return {
      total: response.total,
      items: response.items.map((item) =>
        ReadingHistoryItemSchema.parse({
          id: item.id,
          chapterId: item.chapter_id,
          startVerse: item.start_verse,
          endVerse: item.end_verse,
          versesCompleted: item.verses_completed,
          durationMinutes: item.session_duration_minutes ?? null,
          deviceType: item.device_type ?? null,
          completed: item.completed,
          completedAt: item.completed_at ?? null,
          createdAt: item.created_at,
        }),
      ),
    };
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return { items: [], total: 0 };
  }
}

export async function getTodayPlan(): Promise<TodayPlan> {
  if (hasAccessToken()) {
    try {
      const plan = ApiTodayPlanSchema.parse(
        await apiFetch<unknown>("/api/v1/quran/today", { auth: true }),
      );
      if (plan.verses.length > 0) {
        const first = plan.verses[0];
        const last = plan.verses[plan.verses.length - 1];
        const chapter = await getChapter(first.chapter_id);
        return TodayPlanSchema.parse({
          id: plan.plan_id ?? `plan_${new Date().toISOString().slice(0, 10)}`,
          date: new Date().toISOString().slice(0, 10),
          surah: first.chapter_id,
          surahName: chapter.name_en,
          startAyah: first.verse_number,
          endAyah: last.verse_number,
          estimatedMinutes: Math.max(1, Math.ceil(plan.verses_per_day * 1.5)),
          anchor: "after_fajr",
          verses: plan.verses.map((v) => v.verse_number),
        });
      }
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(300, 700);
  return TodayPlanSchema.parse(mockDb.todayPlan);
}

export async function getVerse(surah: number, ayah: number): Promise<Verse> {
  try {
    const verse = ApiVerseSchema.parse(
      await apiFetch<unknown>(`/api/v1/quran/chapters/${surah}/verses/${ayah}`),
    );
    return mapApiVerse(verse);
  } catch {
    // Keep the prototype readable if the public API is asleep or missing a verse.
  }

  await simulateNetwork(100, 250);
  const v = mockDb.verses.find((x) => x.surah === surah && x.ayah === ayah);
  if (!v) {
    const fallback = mockDb.verses[0];
    return VerseSchema.parse({ ...fallback, surah, ayah });
  }
  return VerseSchema.parse(v);
}

export async function getNextVerse(surah: number, ayah: number): Promise<Verse | null> {
  try {
    const chapter = await getChapter(surah);
    if (ayah < chapter.verse_count) return getVerse(surah, ayah + 1);
    if (surah < 114) return getVerse(surah + 1, 1);
    return null;
  } catch {
    // Fall back to the local demo data below.
  }

  await simulateNetwork(100, 250);
  const sorted = [...mockDb.verses].sort(
    (a, b) => a.surah * 10000 + a.ayah - (b.surah * 10000 + b.ayah),
  );
  const idx = sorted.findIndex((v) => v.surah === surah && v.ayah === ayah);
  if (idx < 0 || idx >= sorted.length - 1) return null;
  return VerseSchema.parse(sorted[idx + 1]);
}

export async function getPrevVerse(surah: number, ayah: number): Promise<Verse | null> {
  try {
    if (ayah > 1) return getVerse(surah, ayah - 1);
    if (surah <= 1) return null;
    const prevChapter = await getChapter(surah - 1);
    return getVerse(prevChapter.number, prevChapter.verse_count);
  } catch {
    // Fall back to the local demo data below.
  }

  await simulateNetwork(100, 250);
  const sorted = [...mockDb.verses].sort(
    (a, b) => a.surah * 10000 + a.ayah - (b.surah * 10000 + b.ayah),
  );
  const idx = sorted.findIndex((v) => v.surah === surah && v.ayah === ayah);
  if (idx <= 0) return null;
  return VerseSchema.parse(sorted[idx - 1]);
}

export async function saveReading(_input: { surah: number; ayah: number }): Promise<{ ok: true }> {
  if (hasAccessToken()) {
    try {
      await apiFetch("/api/v1/quran/log-reading", {
        auth: true,
        method: "POST",
        body: JSON.stringify({
          chapter_id: _input.surah,
          start_verse: _input.ayah,
          end_verse: _input.ayah,
          session_duration_minutes: 0,
          device_type: "web",
        }),
      });
      return { ok: true };
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(100, 250);
  return { ok: true };
}
