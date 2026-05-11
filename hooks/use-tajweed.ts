"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTajweedFeedback,
  listTajweedLessons,
  submitTajweedFeedback,
} from "@/lib/services/tajweed.service";

export function useTajweedLessons() {
  return useQuery({ queryKey: ["tajweed-lessons"], queryFn: listTajweedLessons });
}

export function useTajweedFeedback() {
  return useQuery({ queryKey: ["tajweed-feedback"], queryFn: listTajweedFeedback });
}

export function useSubmitTajweedFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitTajweedFeedback,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tajweed-feedback"] }),
  });
}
