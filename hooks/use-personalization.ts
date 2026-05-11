"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  generatePlan,
  getFallbackCheckin,
  getRecommendations,
  personalize,
} from "@/lib/services/personalization.service";

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => getRecommendations(3),
  });
}

export function useFallbackCheckin() {
  return useQuery({
    queryKey: ["fallback-checkin"],
    queryFn: getFallbackCheckin,
  });
}

export function useGeneratePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generatePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-plan"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function usePersonalize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: personalize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-plan"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["fallback-checkin"] });
    },
  });
}
