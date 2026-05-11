"use client";
import { useQuery } from "@tanstack/react-query";
import {
  getAnalytics,
  getProgressSummary,
  getInsights,
} from "@/lib/services/progress.service";

export function useProgressSummary() {
  return useQuery({ queryKey: ["progress-summary"], queryFn: getProgressSummary });
}

export function useInsights() {
  return useQuery({ queryKey: ["insights"], queryFn: getInsights });
}

export function useAnalytics() {
  return useQuery({ queryKey: ["analytics"], queryFn: getAnalytics });
}
