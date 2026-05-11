"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFamily,
  getFamilyDashboard,
  getFamilyMembers,
  inviteFamilyMember,
  listFamilies,
} from "@/lib/services/family.service";

export function useFamilies() {
  return useQuery({ queryKey: ["families"], queryFn: listFamilies });
}

export function useFamilyDashboard(familyId?: string) {
  return useQuery({
    queryKey: ["family-dashboard", familyId],
    queryFn: () => getFamilyDashboard(familyId),
    enabled: Boolean(familyId),
  });
}

export function useFamilyMembers(familyId?: string) {
  return useQuery({
    queryKey: ["family-members", familyId],
    queryFn: () => getFamilyMembers(familyId),
    enabled: Boolean(familyId),
  });
}

export function useCreateFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFamily,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["families"] }),
  });
}

export function useInviteFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inviteFamilyMember,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["family-members", variables.familyId] });
      queryClient.invalidateQueries({ queryKey: ["family-dashboard", variables.familyId] });
    },
  });
}
