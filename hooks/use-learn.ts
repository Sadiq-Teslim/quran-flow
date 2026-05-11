"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLearnPath,
  getLesson,
  getEducationStages,
  markLessonComplete,
} from "@/lib/services/learn.service";

export function useLearnPath() {
  return useQuery({ queryKey: ["learn-path"], queryFn: getLearnPath });
}

export function useEducationStages() {
  return useQuery({ queryKey: ["education-stages"], queryFn: getEducationStages });
}

export function useLesson(id: string) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: () => getLesson(id),
    enabled: Boolean(id),
  });
}

export function useMarkLessonComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markLessonComplete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learn-path"] });
      qc.invalidateQueries({ queryKey: ["lesson"] });
      qc.invalidateQueries({ queryKey: ["progress-summary"] });
    },
  });
}
