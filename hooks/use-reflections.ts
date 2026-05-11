"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listReflections,
  getReflection,
  createReflection,
  deleteReflection,
} from "@/lib/services/reflection.service";

export function useReflections() {
  return useQuery({ queryKey: ["reflections"], queryFn: listReflections });
}

export function useReflection(id: string) {
  return useQuery({
    queryKey: ["reflection", id],
    queryFn: () => getReflection(id),
    enabled: Boolean(id),
  });
}

export function useCreateReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReflection,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reflections"] });
      qc.invalidateQueries({ queryKey: ["progress-summary"] });
    },
  });
}

export function useDeleteReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteReflection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reflections"] }),
  });
}
