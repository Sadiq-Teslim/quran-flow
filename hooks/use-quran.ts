"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getReadingHistory,
  getVerseLocalizations,
  listChapters,
  searchVerses,
} from "@/lib/services/reading.service";

export function useChapters() {
  return useQuery({
    queryKey: ["chapters"],
    queryFn: listChapters,
    staleTime: 1000 * 60 * 60,
  });
}

export function useVerseSearch(query: string) {
  return useQuery({
    queryKey: ["verse-search", query],
    queryFn: () => searchVerses(query),
    enabled: query.trim().length >= 2,
  });
}

export function useVerseLocalizations(verseId?: number) {
  return useQuery({
    queryKey: ["verse-localizations", verseId],
    queryFn: () => getVerseLocalizations(verseId),
    enabled: Boolean(verseId),
  });
}

export function useReadingHistory() {
  return useQuery({
    queryKey: ["reading-history"],
    queryFn: getReadingHistory,
  });
}
