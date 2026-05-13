"use client";

import { useEffect, useSyncExternalStore } from "react";

export type AudioLanguage = "en" | "yo" | "ig" | "ha";

const AUDIO_LANGUAGE_KEY = "quranflow.audio_language";
const AUDIO_LANGUAGE_EVENT = "quranflow.audio_language_changed";
const supportedLanguages: AudioLanguage[] = ["en", "yo", "ig", "ha"];

export const audioLanguageLabels: Record<AudioLanguage, string> = {
  en: "English",
  yo: "Yoruba",
  ig: "Igbo",
  ha: "Hausa",
};

export const yarnVoiceByLanguage: Record<AudioLanguage, string> = {
  en: "Idera",
  yo: "Idera",
  ig: "Adaora",
  ha: "Umar",
};

export function getAudioLanguage(): AudioLanguage {
  if (typeof window === "undefined") return "en";
  const value = localStorage.getItem(AUDIO_LANGUAGE_KEY);
  return supportedLanguages.includes(value as AudioLanguage)
    ? (value as AudioLanguage)
    : "en";
}

export function setAudioLanguage(language: AudioLanguage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUDIO_LANGUAGE_KEY, language);
  window.dispatchEvent(new Event(AUDIO_LANGUAGE_EVENT));
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === AUDIO_LANGUAGE_KEY) callback();
  };

  window.addEventListener(AUDIO_LANGUAGE_EVENT, callback);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(AUDIO_LANGUAGE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useAudioLanguage() {
  const language = useSyncExternalStore(
    subscribe,
    getAudioLanguage,
    () => "en" as AudioLanguage,
  );

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(AUDIO_LANGUAGE_KEY)) {
      setAudioLanguage("en");
    }
  }, []);

  return {
    language,
    label: audioLanguageLabels[language],
    setLanguage: setAudioLanguage,
    voice: yarnVoiceByLanguage[language],
  };
}
