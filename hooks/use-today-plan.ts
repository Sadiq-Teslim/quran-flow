"use client";
import { useQuery } from "@tanstack/react-query";
import { getTodayPlan } from "@/lib/services/reading.service";

export function useTodayPlan() {
  return useQuery({ queryKey: ["today-plan"], queryFn: getTodayPlan });
}
