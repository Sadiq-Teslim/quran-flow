import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";

export const PartnerSchema = z.object({
  id: z.string(),
  partnerId: z.string(),
  phase: z.string(),
  status: z.string(),
  criteria: z.array(z.string()),
  createdAt: z.string(),
});
export type Partner = z.infer<typeof PartnerSchema>;

export const CheckinSchema = z.object({
  id: z.string(),
  partnershipId: z.string(),
  type: z.string(),
  message: z.string().nullable(),
  responseMessage: z.string().nullable(),
  createdAt: z.string(),
});
export type Checkin = z.infer<typeof CheckinSchema>;

export async function listPartners(): Promise<Partner[]> {
  if (!hasAccessToken()) return [];
  try {
    await apiFetch<unknown>("/api/v1/accountability/match-preferences", { auth: true });
    return [];
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return [];
  }
}

export async function requestPartner(criteria: string[]) {
  await apiFetch<unknown>("/api/v1/accountability/match-preferences", {
    auth: true,
    method: "PATCH",
    body: JSON.stringify({
      goals: criteria,
      available_times: [],
      matching_enabled: true,
    }),
  });
  await apiFetch<unknown>("/api/v1/accountability/matches", {
      auth: true,
      method: "POST",
  });
  return PartnerSchema.parse({
    id: "matching",
    partnerId: "pending",
    phase: "AI accountability",
    status: "requested",
    criteria,
    createdAt: new Date().toISOString(),
  });
}

export async function acceptPartner(id: string) {
  void id;
  throw new Error("Partner responses are not ready yet.");
}

export async function endPartner(id: string) {
  void id;
  return PartnerSchema.parse({
    id: "matching",
    partnerId: "pending",
    phase: "AI accountability",
    status: "ended",
    criteria: [],
    createdAt: new Date().toISOString(),
  });
}

export async function listCheckins(partnershipId: string): Promise<Checkin[]> {
  if (!hasAccessToken() || !partnershipId) return [];
  return [];
}

export async function createCheckin(input: { partnershipId: string; message: string }) {
  await apiFetch<unknown>("/api/v1/accountability/check-ins", {
    auth: true,
    method: "POST",
    body: JSON.stringify({
      completed_today: true,
      note: input.message,
    }),
  });
  return CheckinSchema.parse({
    id: `checkin_${Date.now()}`,
    partnershipId: input.partnershipId,
    type: "daily_status",
    message: input.message,
    responseMessage: null,
    createdAt: new Date().toISOString(),
  });
}

export async function respondToCheckin(input: { id: string; response: string }) {
  return CheckinSchema.parse({
    id: input.id,
    partnershipId: "",
    type: "daily_status",
    message: null,
    responseMessage: input.response,
    createdAt: new Date().toISOString(),
  });
}
