"use client";

import { useQuery } from "@tanstack/react-query";
import { getGuidedContent } from "@/lib/services/new-muslim.service";

export function useGuidedContent() {
  return useQuery({
    queryKey: ["new-muslim-guided-content"],
    queryFn: getGuidedContent,
  });
}
