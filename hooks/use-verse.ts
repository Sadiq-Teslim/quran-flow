"use client";
import { useQuery } from "@tanstack/react-query";
import { getVerse, getNextVerse, getPrevVerse } from "@/lib/services/reading.service";

export function useVerse(surah: number, ayah: number) {
  return useQuery({
    queryKey: ["verse", surah, ayah],
    queryFn: () => getVerse(surah, ayah),
    staleTime: 1000 * 60 * 60,
  });
}

export function useNextVerse(surah: number, ayah: number) {
  return useQuery({
    queryKey: ["verse", surah, ayah, "next"],
    queryFn: () => getNextVerse(surah, ayah),
  });
}

export function usePrevVerse(surah: number, ayah: number) {
  return useQuery({
    queryKey: ["verse", surah, ayah, "prev"],
    queryFn: () => getPrevVerse(surah, ayah),
  });
}
