import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";
import { mockDb } from "@/lib/mocks/db";
import { simulateNetwork } from "@/lib/mocks/delay";

const DEFAULT_TRANSLATION_ID = 20;
const DEFAULT_TAFSIR_ID = 169;
const LOCALIZED_TRANSLATION_IDS = {
  yo: 125,
  ha: 32,
} as const;

export const VerseSchema = z.object({
  id: z.number().optional(),
  surah: z.number(),
  surahName: z.string(),
  ayah: z.number(),
  arabic: z.string(),
  transliteration: z.string(),
  translation: z.string(),
  localizedTranslations: z.record(z.string(), z.string()).optional(),
  tafsirSummary: z.string().optional(),
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

const ApiTranslatedNameSchema = z
  .object({ name: z.string().nullable().optional() })
  .nullable()
  .optional();

const ApiChapterSchema = z.object({
  id: z.number(),
  name_arabic: z.string().optional(),
  name_simple: z.string(),
  name_complex: z.string().optional(),
  revelation_place: z.string().optional(),
  verses_count: z.number(),
  translated_name: ApiTranslatedNameSchema,
});

const ApiChaptersSchema = z.object({
  chapters: z.array(ApiChapterSchema),
});

const ApiScriptVerseSchema = z.object({
  id: z.number(),
  verse_key: z.string(),
  text_uthmani: z.string().optional(),
  text_imlaei: z.string().optional(),
});

const ApiScriptVersesSchema = z.object({
  verses: z.array(ApiScriptVerseSchema),
});

const ApiVerseByKeySchema = z.object({
  verse: z.object({
    id: z.number(),
    verse_key: z.string(),
    verse_number: z.number(),
    words: z
      .array(
        z.object({
          text: z.string().optional(),
          transliteration: z
            .object({ text: z.string().nullable().optional() })
            .nullable()
            .optional(),
        }),
      )
      .optional(),
  }),
});

const ApiTranslationsSchema = z.object({
  translations: z.array(
    z.object({
      id: z.number(),
      resource_id: z.number(),
      text: z.string(),
    }),
  ),
});

const ApiTafsirSchema = z.object({
  tafsir: z
    .object({
      text: z.string().nullable().optional(),
      resource_name: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
});

const ApiTodayPlanSchema = z.object({
  id: z.string().optional(),
  plan_id: z.string().optional(),
  date: z.string().optional(),
  items: z.array(z.unknown()).optional(),
  plan_items: z.array(z.unknown()).optional(),
  verses: z.array(z.unknown()).optional(),
  verses_per_day: z.number().optional(),
});

const ApiReadingSessionsSchema = z.object({
  sessions: z.array(z.record(z.string(), z.unknown())).optional(),
  items: z.array(z.record(z.string(), z.unknown())).optional(),
});

const ApiAiVerseExplanationSchema = z.object({
  explanation: z.string().nullable().optional(),
  key_lesson: z.string().nullable().optional(),
  lesson: z.string().nullable().optional(),
});

type ApiChapter = z.infer<typeof ApiChapterSchema>;
type ApiScriptVerse = z.infer<typeof ApiScriptVerseSchema>;

const chapterCache = new Map<number, ApiChapter>();
const scriptCache = new Map<number, ApiScriptVerse[]>();

function stripHtml(value?: string | null) {
  return (value ?? "")
    .replace(/<sup[^>]*>.*?<\/sup>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseVerseKey(verseKey: string) {
  const [surah, ayah] = verseKey.split(":").map((part) => Number.parseInt(part, 10));
  return { surah, ayah };
}

async function getChapter(chapterId: number): Promise<ApiChapter> {
  const cached = chapterCache.get(chapterId);
  if (cached) return cached;

  const response = ApiChapterSchema.parse(
    await apiFetch<unknown>(`/api/v1/quran/chapters/${chapterId}`),
  );
  chapterCache.set(chapterId, response);
  return response;
}

async function getChapterScript(chapterId: number) {
  const cached = scriptCache.get(chapterId);
  if (cached) return cached;

  const response = ApiScriptVersesSchema.parse(
    await apiFetch<unknown>(
      `/api/v1/quran/quran/verses/uthmani?chapter_number=${chapterId}`,
    ),
  );
  scriptCache.set(chapterId, response.verses);
  return response.verses;
}

function mapApiChapter(chapter: ApiChapter): Chapter {
  return ChapterSchema.parse({
    id: chapter.id,
    number: chapter.id,
    nameArabic: chapter.name_arabic ?? "",
    nameEnglish: chapter.name_simple,
    meaning: chapter.translated_name?.name ?? chapter.name_complex ?? null,
    revelationType: chapter.revelation_place ?? "",
    verseCount: chapter.verses_count,
  });
}

async function getTranslation(verseKey: string) {
  const response = ApiTranslationsSchema.parse(
    await apiFetch<unknown>(
      `/api/v1/quran/translations/${DEFAULT_TRANSLATION_ID}/by_ayah/${verseKey}`,
    ),
  );
  return stripHtml(response.translations[0]?.text);
}

async function getTafsir(verseKey: string) {
  const response = ApiTafsirSchema.parse(
    await apiFetch<unknown>(
      `/api/v1/quran/tafsirs/${DEFAULT_TAFSIR_ID}/by_ayah/${verseKey}`,
    ),
  );
  return stripHtml(response.tafsir?.text);
}

async function getLocalizedTranslations(verseKey: string) {
  const entries = await Promise.all(
    Object.entries(LOCALIZED_TRANSLATION_IDS).map(async ([language, resourceId]) => {
      try {
        const response = ApiTranslationsSchema.parse(
          await apiFetch<unknown>(
            `/api/v1/quran/translations/${resourceId}/by_ayah/${verseKey}`,
          ),
        );
        const text = stripHtml(response.translations[0]?.text);
        return text ? [language, text] : null;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(entries.filter(Boolean) as [string, string][]);
}

function buildFallbackKeyLesson(translation: string, tafsir: string) {
  const source = tafsir || translation;
  if (!source) return undefined;
  const firstSentence = source
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .find((sentence) => sentence.length > 35);
  if (!firstSentence) return undefined;
  return firstSentence.slice(0, 220);
}

async function getAiKeyLesson(verseKey: string, translation: string, tafsir: string) {
  if (!hasAccessToken()) return buildFallbackKeyLesson(translation, tafsir);
  try {
    const response = ApiAiVerseExplanationSchema.parse(
      await apiFetch<unknown>("/api/v1/ai/explain-verse", {
        auth: true,
        method: "POST",
        body: JSON.stringify({
          verse_key: verseKey,
          source_payload: {
            translation,
            tafsir,
          },
        }),
      }),
    );
    const lesson = response.key_lesson ?? response.lesson ?? response.explanation;
    if (lesson && !/must cite verified/i.test(lesson)) return stripHtml(lesson).slice(0, 300);
  } catch {
    // Fall through to a source-grounded local summary when the AI service is unavailable.
  }
  return buildFallbackKeyLesson(translation, tafsir);
}

async function mapVerseByKey(verseKey: string): Promise<Verse> {
  const [{ verse }, chapter, script, translation, tafsir, localizedTranslations] = await Promise.all([
    ApiVerseByKeySchema.parse(
      await apiFetch<unknown>(
        `/api/v1/quran/verses/by_key/${verseKey}?words=true`,
      ),
    ),
    getChapter(parseVerseKey(verseKey).surah),
    getChapterScript(parseVerseKey(verseKey).surah),
    getTranslation(verseKey),
    getTafsir(verseKey).catch(() => ""),
    getLocalizedTranslations(verseKey),
  ]);
  const { surah, ayah } = parseVerseKey(verse.verse_key);
  const scriptVerse = script.find((item) => item.verse_key === verse.verse_key);
  const arabic =
    scriptVerse?.text_uthmani ??
    verse.words?.map((word) => word.text).filter(Boolean).join(" ") ??
    "";
  const transliteration =
    verse.words
      ?.map((word) => word.transliteration?.text)
      .filter(Boolean)
      .join(" ") ?? "";

  return VerseSchema.parse({
    id: verse.id,
    surah,
    surahName: chapter.name_simple,
    ayah,
    arabic,
    transliteration,
    translation,
    localizedTranslations,
    tafsirSummary: tafsir ? tafsir.slice(0, 900) : undefined,
    lesson: await getAiKeyLesson(verseKey, translation, tafsir),
  });
}

export async function listChapters(): Promise<Chapter[]> {
  const response = ApiChaptersSchema.parse(await apiFetch<unknown>("/api/v1/quran/chapters"));
  for (const chapter of response.chapters) chapterCache.set(chapter.id, chapter);
  return response.chapters.map(mapApiChapter);
}

export async function searchVerses(query: string): Promise<Verse[]> {
  if (query.trim().length < 2) return [];
  try {
    const response = z
      .object({
        results: z.array(z.record(z.string(), z.unknown())).optional(),
        verses: z.array(z.record(z.string(), z.unknown())).optional(),
      })
      .parse(
        await apiFetch<unknown>(
          `/api/v1/quran/search?mode=quick&query=${encodeURIComponent(
            query.trim(),
          )}&page=1&size=10`,
        ),
      );
    const records = response.results ?? response.verses ?? [];
    const keys = records
      .map((record) => String(record.verse_key ?? record.ayah_key ?? ""))
      .filter(Boolean)
      .slice(0, 5);
    return Promise.all(keys.map(mapVerseByKey));
  } catch {
    await simulateNetwork(100, 250);
    return mockDb.verses
      .filter((verse) =>
        `${verse.surahName} ${verse.translation} ${verse.arabic}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
      .map((verse) => VerseSchema.parse(verse));
  }
}

export async function getVerseLocalizations(_verseId?: number): Promise<VerseLocalization[]> {
  void _verseId;
  return [];
}

export async function getReadingHistory(): Promise<{
  items: ReadingHistoryItem[];
  total: number;
}> {
  if (!hasAccessToken()) return { items: [], total: 0 };
  try {
    const response = ApiReadingSessionsSchema.parse(
      await apiFetch<unknown>("/api/v1/reading-sessions?limit=20", {
        auth: true,
      }),
    );
    const sessions = response.sessions ?? response.items ?? [];
    const items = sessions.map((session, index) => {
      const verseStart = String(session.verse_start ?? session.start_verse ?? "1:1");
      const verseEnd = String(session.verse_end ?? session.end_verse ?? verseStart);
      const start = parseVerseKey(verseStart);
      const end = parseVerseKey(verseEnd);
      return ReadingHistoryItemSchema.parse({
        id: String(session.id ?? `session_${index}`),
        chapterId: start.surah || 1,
        startVerse: start.ayah || 1,
        endVerse: end.ayah || start.ayah || 1,
        versesCompleted: Number(session.verses_read ?? session.verses_completed ?? 1),
        durationMinutes:
          typeof session.minutes === "number"
            ? session.minutes
            : typeof session.session_duration_minutes === "number"
              ? session.session_duration_minutes
              : null,
        deviceType: String(session.source ?? session.device_type ?? "web"),
        completed: Boolean(session.completed ?? session.finished_at ?? true),
        completedAt:
          typeof session.finished_at === "string" ? session.finished_at : null,
        createdAt:
          typeof session.created_at === "string"
            ? session.created_at
            : new Date().toISOString(),
      });
    });
    return { items, total: items.length };
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return { items: [], total: 0 };
  }
}

export async function getTodayPlan(): Promise<TodayPlan> {
  if (hasAccessToken()) {
    try {
      const plan = ApiTodayPlanSchema.parse(
        await apiFetch<unknown>("/api/v1/plans/today", { auth: true }),
      );
      const records = plan.items ?? plan.plan_items ?? plan.verses ?? [];
      const verseKeys = records
        .map((record) => {
          if (typeof record === "string") return record;
          if (typeof record !== "object" || record === null) return "";
          const object = record as Record<string, unknown>;
          return String(object.verse_key ?? object.verse_start ?? object.ayah_key ?? "");
        })
        .filter(Boolean);
      if (verseKeys.length > 0) {
        const first = parseVerseKey(verseKeys[0]);
        const last = parseVerseKey(verseKeys[verseKeys.length - 1]);
        const chapter = await getChapter(first.surah);
        return TodayPlanSchema.parse({
          id: plan.id ?? plan.plan_id ?? `plan_${new Date().toISOString().slice(0, 10)}`,
          date: plan.date ?? new Date().toISOString().slice(0, 10),
          surah: first.surah,
          surahName: chapter.name_simple,
          startAyah: first.ayah,
          endAyah: last.ayah,
          estimatedMinutes: Math.max(1, Math.ceil(verseKeys.length * 1.5)),
          anchor: "after_fajr",
          verses: verseKeys.map((key) => parseVerseKey(key).ayah),
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
    return await mapVerseByKey(`${surah}:${ayah}`);
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
    if (ayah < chapter.verses_count) return getVerse(surah, ayah + 1);
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
    return getVerse(prevChapter.id, prevChapter.verses_count);
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

export async function saveReading(input: { surah: number; ayah: number }): Promise<{ ok: true }> {
  if (hasAccessToken()) {
    try {
      await apiFetch("/api/v1/reading-sessions", {
        auth: true,
        method: "POST",
        body: JSON.stringify({
          verse_start: `${input.surah}:${input.ayah}`,
          verse_end: `${input.surah}:${input.ayah}`,
          source: "web",
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
