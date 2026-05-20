"use client";

import { useRef, useState } from "react";
import { Loader2, Pause, Play, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Verse, VerseLocalization } from "@/lib/services/reading.service";
import {
  audioLanguageLabels,
  type AudioLanguage,
  useAudioLanguage,
} from "@/lib/audio/preferences";
import {
  getArabicVerseAudioUrl,
  getYarnTtsAudioUrl,
} from "@/lib/audio/playback";
import { cn } from "@/lib/utils";

type AudioItem = {
  id: string;
  label: string;
  kind: "arabic" | "tts";
  text?: string;
  translate?: boolean;
};

function findLocalization(
  localizations: VerseLocalization[] | undefined,
  language: AudioLanguage,
  matchers: string[],
) {
  return localizations?.find((item) => {
    const kind = item.kind.toLowerCase();
    return (
      item.language.toLowerCase() === language &&
      matchers.some((matcher) => kind.includes(matcher))
    );
  })?.content;
}

function buildItems(
  verse: Verse,
  language: AudioLanguage,
  localizations?: VerseLocalization[],
) {
  const translation =
    language === "en"
      ? verse.translation
      : findLocalization(localizations, language, ["translation"]) ??
        findLocalization(localizations, language, ["explanation", "tafsir"]) ??
        verse.translation;
  const tafsir =
    findLocalization(localizations, language, ["tafsir", "explanation"]) ??
    verse.lesson;

  const items: AudioItem[] = [
    { id: "arabic", label: "Arabic recitation", kind: "arabic" },
    {
      id: "translation",
      label: `${audioLanguageLabels[language]} translation`,
      kind: "tts",
      text: translation,
      translate: language !== "en",
    },
    {
      id: "transliteration",
      label: "Transliteration",
      kind: "arabic",
      text: verse.transliteration,
    },
  ];

  if (tafsir) items.push({ id: "tafsir", label: "Tafsir summary", kind: "tts", text: tafsir, translate: language !== "en" });
  if (verse.lesson) items.push({ id: "lesson", label: "Key lesson", kind: "tts", text: verse.lesson, translate: language !== "en" });
  if (verse.takeaway) items.push({ id: "takeaway", label: "Action step", kind: "tts", text: verse.takeaway, translate: language !== "en" });
  if (verse.relatedDua) items.push({ id: "dua", label: "Related dua", kind: "tts", text: verse.relatedDua, translate: language !== "en" });

  return items.filter((item) => item.kind === "arabic" || item.text?.trim());
}

export function AudioControls({
  verse,
  localizations,
  className,
}: {
  verse: Verse;
  localizations?: VerseLocalization[];
  className?: string;
}) {
  const { language, label, setLanguage } = useAudioLanguage();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const items = buildItems(verse, language, localizations);

  function cleanupObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }

  async function playItem(item: AudioItem) {
    try {
      if (activeId === item.id && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      cleanupObjectUrl();

      setActiveId(item.id);
      setLoadingId(item.id);
      setIsPlaying(false);
      const audioUrl =
        item.kind === "arabic"
          ? await getArabicVerseAudioUrl({ surah: verse.surah, ayah: verse.ayah })
          : await getYarnTtsAudioUrl({
              text: item.text ?? "",
              language,
              translate: item.translate,
            });

      if (item.kind === "tts") objectUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setLoadingId(null);
        setIsPlaying(false);
        setActiveId(null);
        cleanupObjectUrl();
      };
      audio.onerror = () => {
        setLoadingId(null);
        setIsPlaying(false);
        setActiveId(null);
        cleanupObjectUrl();
        toast.error("Audio isn't available right now.");
      };
      await audio.play();
      setLoadingId(null);
      setIsPlaying(true);
    } catch (error) {
      setLoadingId(null);
      setIsPlaying(false);
      setActiveId(null);
      cleanupObjectUrl();
      toast.error(error instanceof Error ? error.message : "Audio isn't available right now.");
    }
  }

  return (
    <Card className={cn("space-y-4 p-4 sm:p-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="size-4 text-accent" aria-hidden />
          <p className="font-medium leading-tight">Listen</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Language
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as AudioLanguage)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {Object.entries(audioLanguageLabels).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const playing = activeId === item.id && isPlaying;
          const loading = loadingId === item.id;
          return (
            <Button
              key={item.id}
              type="button"
              variant={playing ? "default" : "secondary"}
              className="justify-start"
              disabled={Boolean(loadingId) && !loading}
              onClick={() => playItem(item)}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : playing ? (
                <Pause className="size-4" aria-hidden />
              ) : (
                <Play className="size-4" aria-hidden />
              )}
              {loading ? "Preparing..." : item.label}
            </Button>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Translation and notes use {label}. Arabic and transliteration use Mishary Alafasy recitation.
      </p>
    </Card>
  );
}
