"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { personalize } from "@/lib/services/personalization.service";
import { completeOnboarding } from "@/lib/services/user.service";

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Parameters<typeof completeOnboarding>[0]) => {
      const user = await completeOnboarding(payload);
      const personalization = await personalize({
        planName: "QuranFlow Personalized Plan",
        recommendationLimit: 3,
      });
      return { personalization, user };
    },
    onSuccess: ({ personalization, user }) => {
      qc.setQueryData(["user"], user);
      qc.setQueryData(["recommendations"], personalization.recommendations);
      qc.setQueryData(["fallback-checkin"], personalization.checkinMessage);
      qc.invalidateQueries({ queryKey: ["today-plan"] });
    },
  });
}
