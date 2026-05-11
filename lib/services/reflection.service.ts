import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";
import { mockDb, persistDb } from "@/lib/mocks/db";
import { simulateNetwork } from "@/lib/mocks/delay";

export const ReflectionSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  verseRef: z
    .object({ surah: z.number(), ayah: z.number() })
    .nullable()
    .optional(),
  title: z.string(),
  body: z.string(),
});
export type Reflection = z.infer<typeof ReflectionSchema>;

export const CreateReflectionSchema = z.object({
  verseRef: z
    .object({ surah: z.number(), ayah: z.number() })
    .nullable()
    .optional(),
  title: z.string().min(1),
  body: z.string().min(1),
});
export type CreateReflectionPayload = z.infer<typeof CreateReflectionSchema>;

const ApiReflectionSchema = z.object({
  id: z.string(),
  verse_id: z.number(),
  content: z.string(),
  created_at: z.string(),
});

const ApiReflectionListSchema = z.object({
  items: z.array(ApiReflectionSchema),
});

const ApiVerseIdSchema = z.object({
  id: z.number(),
});

function mapApiReflection(reflection: z.infer<typeof ApiReflectionSchema>): Reflection {
  const [first, ...rest] = reflection.content.split(/\n\n+/);
  const title = rest.length > 0 ? first : "Reflection";
  const body = rest.length > 0 ? rest.join("\n\n") : reflection.content;
  return ReflectionSchema.parse({
    id: reflection.id,
    createdAt: reflection.created_at,
    verseRef: null,
    title,
    body,
  });
}

async function getVerseId(verseRef: NonNullable<CreateReflectionPayload["verseRef"]>) {
  const verse = ApiVerseIdSchema.parse(
    await apiFetch<unknown>(
      `/api/v1/quran/chapters/${verseRef.surah}/verses/${verseRef.ayah}`,
    ),
  );
  return verse.id;
}

export async function listReflections(): Promise<Reflection[]> {
  if (hasAccessToken()) {
    try {
      const response = ApiReflectionListSchema.parse(
        await apiFetch<unknown>("/api/v1/reflections", { auth: true }),
      );
      return response.items
        .map(mapApiReflection)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(150, 350);
  return [...mockDb.reflections]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((r) => ReflectionSchema.parse(r));
}

export async function getReflection(id: string): Promise<Reflection> {
  if (hasAccessToken()) {
    try {
      const reflection = ApiReflectionSchema.parse(
        await apiFetch<unknown>(`/api/v1/reflections/${id}`, { auth: true }),
      );
      return mapApiReflection(reflection);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(100, 250);
  const reflection = mockDb.reflections.find((x) => x.id === id);
  if (!reflection) throw new Error("Reflection not found");
  return ReflectionSchema.parse(reflection);
}

export async function createReflection(payload: CreateReflectionPayload): Promise<Reflection> {
  CreateReflectionSchema.parse(payload);

  if (hasAccessToken() && payload.verseRef) {
    try {
      const verseId = await getVerseId(payload.verseRef);
      const reflection = ApiReflectionSchema.parse(
        await apiFetch<unknown>("/api/v1/reflections", {
          auth: true,
          method: "POST",
          body: JSON.stringify({
            verse_id: verseId,
            reflection_type: "personal",
            content: `${payload.title}\n\n${payload.body}`,
            is_shared: false,
          }),
        }),
      );
      return mapApiReflection(reflection);
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(250, 550);
  const next: Reflection = {
    id: `r_${Date.now()}`,
    createdAt: new Date().toISOString(),
    verseRef: payload.verseRef ?? null,
    title: payload.title,
    body: payload.body,
  };
  mockDb.reflections = [next, ...mockDb.reflections];
  persistDb();
  return next;
}

export async function deleteReflection(id: string): Promise<{ ok: true }> {
  if (hasAccessToken()) {
    try {
      await apiFetch(`/api/v1/reflections/${id}`, {
        auth: true,
        method: "DELETE",
      });
      return { ok: true };
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(100, 250);
  mockDb.reflections = mockDb.reflections.filter((r) => r.id !== id);
  persistDb();
  return { ok: true };
}
