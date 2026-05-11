"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeOnboarding } from "@/lib/services/user.service";

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user"] }),
  });
}
