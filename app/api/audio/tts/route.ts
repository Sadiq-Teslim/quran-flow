import { z } from "zod";

const YarnTtsRequestSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  language: z.enum(["en", "yo", "ig", "ha"]).default("en"),
  voice: z.string().trim().min(1).default("Idera"),
  responseFormat: z.enum(["mp3", "wav", "opus", "flac"]).default("mp3"),
});

const voiceByLanguage: Record<string, string> = {
  en: "Idera",
  yo: "Idera",
  ig: "Adaora",
  ha: "Umar",
};

export async function POST(request: Request) {
  const apiKey = process.env.YARNGPT_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: { message: "Audio is not configured yet." } },
      { status: 503 },
    );
  }

  try {
    const payload = YarnTtsRequestSchema.parse(await request.json());
    const response = await fetch("https://yarngpt.ai/api/v1/tts", {
      method: "POST",
      headers: {
        Accept: `audio/${payload.responseFormat}, application/json`,
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: payload.text,
        voice: payload.voice || voiceByLanguage[payload.language],
        response_format: payload.responseFormat,
      }),
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";

    if (!response.ok) {
      const message = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
      return Response.json(
        {
          error: {
            message:
              typeof message === "string"
                ? message
                : "Audio could not be generated.",
          },
        },
        { status: response.status },
      );
    }

    if (contentType.includes("application/json")) {
      const data = await response.json();
      const audioUrl =
        typeof data.audio_url === "string"
          ? data.audio_url
          : typeof data.url === "string"
            ? data.url
            : null;
      const base64Audio =
        typeof data.audio === "string"
          ? data.audio
          : typeof data.audio_base64 === "string"
            ? data.audio_base64
            : null;

      if (audioUrl) {
        const audioResponse = await fetch(audioUrl, { cache: "no-store" });
        if (!audioResponse.ok) throw new Error("Generated audio URL failed.");
        return new Response(audioResponse.body, {
          status: 200,
          headers: {
            "Cache-Control": "private, max-age=31536000, immutable",
            "Content-Type": audioResponse.headers.get("content-type") ?? "audio/mpeg",
          },
        });
      }

      if (base64Audio) {
        const bytes = Uint8Array.from(atob(base64Audio), (char) =>
          char.charCodeAt(0),
        );
        return new Response(bytes, {
          status: 200,
          headers: {
            "Cache-Control": "private, max-age=31536000, immutable",
            "Content-Type": `audio/${payload.responseFormat}`,
          },
        });
      }

      throw new Error("YarnGPT did not return playable audio.");
    }

    return new Response(response.body, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Type": contentType || `audio/${payload.responseFormat}`,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Audio could not be generated.",
        },
      },
      { status: 400 },
    );
  }
}
