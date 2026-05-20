import { z } from "zod";

const QuranAudioQuerySchema = z.object({
  surah: z.coerce.number().int().min(1).max(114),
  ayah: z.coerce.number().int().min(1).max(286),
  reciter: z.string().trim().min(1).default("ar.alafasy"),
  format: z.enum(["json", "audio"]).default("json"),
});

const QuranAudioResponseSchema = z.object({
  code: z.number(),
  status: z.string(),
  data: z.object({
    audio: z.string().url(),
    edition: z
      .object({
        englishName: z.string().optional(),
      })
      .optional(),
  }),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = QuranAudioQuerySchema.parse({
      surah: url.searchParams.get("surah"),
      ayah: url.searchParams.get("ayah"),
      reciter: url.searchParams.get("reciter") ?? "ar.alafasy",
      format: url.searchParams.get("format") ?? "json",
    });
    const response = await fetch(
      `https://api.alquran.cloud/v1/ayah/${query.surah}:${query.ayah}/${query.reciter}`,
      { cache: "force-cache", next: { revalidate: 60 * 60 * 24 * 30 } },
    );

    if (!response.ok) {
      return Response.json(
        { error: { message: "Arabic audio is not available right now." } },
        { status: response.status },
      );
    }

    const data = QuranAudioResponseSchema.parse(await response.json());
    if (query.format === "audio") {
      const audioResponse = await fetch(data.data.audio, {
        cache: "force-cache",
        next: { revalidate: 60 * 60 * 24 * 30 },
      });
      if (!audioResponse.ok) {
        return Response.json(
          { error: { message: "Arabic audio is not available right now." } },
          { status: audioResponse.status },
        );
      }
      return new Response(audioResponse.body, {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=31536000, immutable",
          "Content-Type": audioResponse.headers.get("content-type") ?? "audio/mpeg",
        },
      });
    }

    return Response.json({
      audioUrl: data.data.audio,
      reciter: data.data.edition?.englishName ?? "Alafasy",
    });
  } catch (error) {
    return Response.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Arabic audio could not load.",
        },
      },
      { status: 400 },
    );
  }
}
