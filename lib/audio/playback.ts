"use client";

import type { AudioLanguage } from "@/lib/audio/preferences";
import { yarnVoiceByLanguage } from "@/lib/audio/preferences";

const AUDIO_CACHE_NAME = "quranflow-tts-v1";
const TRANSLATION_CACHE_NAME = "quranflow-audio-translations-v1";

async function sha256(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function responseToObjectUrl(response: Response) {
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function getYarnTtsAudioUrl(input: {
  text: string;
  language: AudioLanguage;
  translate?: boolean;
}) {
  const cleanText =
    input.translate && input.language !== "en"
      ? await translateForAudio(input.text, input.language)
      : input.text.trim().slice(0, 2000);
  if (!cleanText) throw new Error("There is nothing to play.");

  const voice = yarnVoiceByLanguage[input.language];
  const key = await sha256(`${input.language}:${voice}:${cleanText}`);
  const cacheUrl = `${location.origin}/quranflow-audio-cache/${key}.mp3`;

  if ("caches" in window) {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const cached = await cache.match(cacheUrl);
    if (cached) return responseToObjectUrl(cached);

    const response = await fetch("/api/audio/tts", {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: cleanText,
        language: input.language,
        voice,
        responseFormat: "mp3",
      }),
    });

    if (!response.ok) throw new Error("Audio is not available right now.");
    await cache.put(cacheUrl, response.clone());
    return responseToObjectUrl(response);
  }

  const response = await fetch("/api/audio/tts", {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: cleanText,
      language: input.language,
      voice,
      responseFormat: "mp3",
    }),
  });

  if (!response.ok) throw new Error("Audio is not available right now.");
  return responseToObjectUrl(response);
}

async function translateForAudio(text: string, language: Exclude<AudioLanguage, "en">) {
  const cleanText = text.trim().slice(0, 2000);
  if (!cleanText) return "";

  const key = await sha256(`en:${language}:${cleanText}`);
  const cacheUrl = `${location.origin}/quranflow-translation-cache/${key}.json`;

  if ("caches" in window) {
    const cache = await caches.open(TRANSLATION_CACHE_NAME);
    const cached = await cache.match(cacheUrl);
    if (cached) {
      const data = (await cached.json()) as { translatedText?: string };
      if (data.translatedText) return data.translatedText;
    }

    const response = await requestTranslation(cleanText, language);
    await cache.put(cacheUrl, response.clone());
    const data = (await response.json()) as { translatedText?: string };
    if (data.translatedText) return data.translatedText;
    throw new Error("Translation is not available right now.");
  }

  const response = await requestTranslation(cleanText, language);
  const data = (await response.json()) as { translatedText?: string };
  if (data.translatedText) return data.translatedText;
  throw new Error("Translation is not available right now.");
}

async function requestTranslation(text: string, language: Exclude<AudioLanguage, "en">) {
  const response = await fetch("/api/audio/translate", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      targetLanguage: language,
      sourceLanguage: "en",
    }),
  });
  if (!response.ok) throw new Error("Translation is not available right now.");
  return response;
}

export async function getArabicVerseAudioUrl(input: {
  surah: number;
  ayah: number;
}) {
  const response = await fetch(
    `/api/audio/quran?surah=${input.surah}&ayah=${input.ayah}&reciter=ar.alafasy`,
  );
  if (!response.ok) throw new Error("Arabic recitation is not available right now.");
  const data = (await response.json()) as { audioUrl?: string };
  if (!data.audioUrl) throw new Error("Arabic recitation is not available right now.");
  return data.audioUrl;
}
