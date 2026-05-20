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
  loadingLabel: string;
  kind: "arabic" | "tts";
  text?: string;
  translate?: boolean;
  source?: "verified" | "generated" | "recitation";
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
  const verifiedTranslation =
    language === "en"
      ? verse.translation
      : verse.localizedTranslations?.[language] ??
        findLocalization(localizations, language, ["translation"]);
  const translation = verifiedTranslation ?? verse.translation;
  const tafsir =
    findLocalization(localizations, language, ["tafsir", "explanation"]) ??
    verse.tafsirSummary;

  const items: AudioItem[] = [
    {
      id: "arabic",
      label: "Arabic recitation",
      loadingLabel: "Preparing Arabic recitation...",
      kind: "arabic",
      source: "recitation",
    },
    {
      id: "translation",
      label: `${audioLanguageLabels[language]} translation`,
      loadingLabel: `Preparing ${audioLanguageLabels[language]} translation...`,
      kind: "tts",
      text: translation,
      translate: language !== "en" && !verifiedTranslation,
      source: verifiedTranslation ? "verified" : "generated",
    },
    {
      id: "transliteration",
      label: "Transliteration",
      loadingLabel: "Preparing Arabic recitation...",
      kind: "arabic",
      text: verse.transliteration,
      source: "recitation",
    },
  ];

  if (tafsir) {
    items.push({
      id: "tafsir",
      label: "Tafsir summary",
      loadingLabel: `Preparing ${audioLanguageLabels[language]} tafsir audio...`,
      kind: "tts",
      text: tafsir,
      translate: language !== "en",
      source: "verified",
    });
  }
  if (verse.lesson) {
    items.push({
      id: "lesson",
      label: "Key lesson",
      loadingLabel: `Preparing ${audioLanguageLabels[language]} key lesson...`,
      kind: "tts",
      text: verse.lesson,
      translate: language !== "en",
      source: "generated",
    });
  }
  if (verse.takeaway) {
    items.push({
      id: "takeaway",
      label: "Action step",
      loadingLabel: `Preparing ${audioLanguageLabels[language]} action step...`,
      kind: "tts",
      text: verse.takeaway,
      translate: language !== "en",
      source: "generated",
    });
  }
  if (verse.relatedDua) {
    items.push({
      id: "dua",
      label: "Related dua",
      loadingLabel: `Preparing ${audioLanguageLabels[language]} dua audio...`,
      kind: "tts",
      text: verse.relatedDua,
      translate: language !== "en",
      source: "generated",
    });
  }

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
  const [statusText, setStatusText] = useState<string | null>(null);
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
      setStatusText(item.loadingLabel);
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
        setStatusText(null);
        setIsPlaying(false);
        setActiveId(null);
        cleanupObjectUrl();
      };
      audio.onerror = () => {
        setLoadingId(null);
        setStatusText(null);
        setIsPlaying(false);
        setActiveId(null);
        cleanupObjectUrl();
        toast.error("Couldn't prepare this audio. Try English for now.");
      };
      await audio.play();
      setLoadingId(null);
      setStatusText(`Playing ${item.label.toLowerCase()}.`);
      setIsPlaying(true);
    } catch (error) {
      setLoadingId(null);
      setStatusText(null);
      setIsPlaying(false);
      setActiveId(null);
      cleanupObjectUrl();
      toast.error(error instanceof Error ? error.message : "Couldn't prepare this audio. Try English for now.");
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
              {loading ? item.loadingLabel : item.label}
            </Button>
          );
        })}
      </div>
      {statusText ? (
        <p className="text-xs leading-relaxed text-muted-foreground" aria-live="polite">
          {statusText}
        </p>
      ) : null}
      <p className="text-xs leading-relaxed text-muted-foreground">
        Yoruba and Hausa verse translations use Quran translation resources when available. Igbo and notes are prepared in {label}. Arabic and transliteration use Mishary Alafasy recitation.
      </p>
    </Card>
  );
}
