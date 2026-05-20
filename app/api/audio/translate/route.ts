import { z } from "zod";

const TranslateRequestSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  targetLanguage: z.enum(["yo", "ig", "ha"]),
  sourceLanguage: z.string().trim().min(2).max(8).default("en"),
});

const languageNames: Record<string, string> = {
  yo: "Yoruba",
  ig: "Igbo",
  ha: "Hausa",
};

export async function POST(request: Request) {
  try {
    const payload = TranslateRequestSchema.parse(await request.json());
    const translatedText = await translateText(payload);
    return Response.json(
      {
        translatedText,
        language: payload.targetLanguage,
        languageName: languageNames[payload.targetLanguage],
      },
      {
        headers: {
          "Cache-Control": "private, max-age=86400",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        error: {
          message:
            error instanceof Error ? error.message : "Translation is not available right now.",
        },
      },
      { status: 400 },
    );
  }
}

async function translateText(input: z.infer<typeof TranslateRequestSchema>) {
  const searchParams = new URLSearchParams({
    client: "gtx",
    sl: input.sourceLanguage,
    tl: input.targetLanguage,
    dt: "t",
    q: input.text,
  });
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?${searchParams.toString()}`,
    { cache: "force-cache", next: { revalidate: 60 * 60 * 24 } },
  );

  if (!response.ok) {
    throw new Error("Translation is not available right now.");
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Translation response was not readable.");
  }

  const translated = data[0]
    .map((entry) => (Array.isArray(entry) && typeof entry[0] === "string" ? entry[0] : ""))
    .join("")
    .trim();

  if (!translated) throw new Error("Translation is not available right now.");
  return translated;
}
