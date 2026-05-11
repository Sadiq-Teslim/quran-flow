"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getStreak,
  getWeekActivity,
  getStreakHistory,
  startReEntry,
} from "@/lib/services/streak.service";

export function useStreak() {
  return useQuery({ queryKey: ["streak"], queryFn: getStreak });
}

export function useWeekActivity() {
  return useQuery({ queryKey: ["week-activity"], queryFn: getWeekActivity });
}

export function useStreakHistory() {
  return useQuery({ queryKey: ["streak-history"], queryFn: getStreakHistory });
}

export function useStartReEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startReEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-plan"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
    },
  });
}
