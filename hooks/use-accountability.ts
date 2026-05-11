"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptPartner,
  createCheckin,
  endPartner,
  listCheckins,
  listPartners,
  requestPartner,
  respondToCheckin,
} from "@/lib/services/accountability.service";

export function usePartners() {
  return useQuery({ queryKey: ["partners"], queryFn: listPartners });
}

export function useCheckins(partnershipId?: string) {
  return useQuery({
    queryKey: ["checkins", partnershipId],
    queryFn: () => listCheckins(partnershipId ?? ""),
    enabled: Boolean(partnershipId),
  });
}

export function useRequestPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestPartner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useAcceptPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptPartner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useEndPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: endPartner,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useCreateCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCheckin,
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ["checkins", variables.partnershipId] }),
  });
}

export function useRespondToCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: respondToCheckin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["checkins"] }),
  });
}
