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

const ApiPartnerSchema = z.object({
  id: z.string(),
  partner_id: z.string(),
  matching_phase: z.string(),
  match_criteria_met: z.array(z.string()),
  status: z.string(),
  created_at: z.string(),
});

const ApiCheckinSchema = z.object({
  id: z.string(),
  partnership_id: z.string(),
  check_in_type: z.string(),
  message: z.string().nullable().optional(),
  response_message: z.string().nullable().optional(),
  created_at: z.string(),
});

function mapPartner(partner: z.infer<typeof ApiPartnerSchema>): Partner {
  return PartnerSchema.parse({
    id: partner.id,
    partnerId: partner.partner_id,
    phase: partner.matching_phase,
    status: partner.status,
    criteria: partner.match_criteria_met,
    createdAt: partner.created_at,
  });
}

function mapCheckin(checkin: z.infer<typeof ApiCheckinSchema>): Checkin {
  return CheckinSchema.parse({
    id: checkin.id,
    partnershipId: checkin.partnership_id,
    type: checkin.check_in_type,
    message: checkin.message ?? null,
    responseMessage: checkin.response_message ?? null,
    createdAt: checkin.created_at,
  });
}

export async function listPartners(): Promise<Partner[]> {
  if (!hasAccessToken()) return [];
  try {
    const response = z
      .array(ApiPartnerSchema)
      .parse(await apiFetch<unknown>("/api/v1/accountability/partners", { auth: true }));
    return response.map(mapPartner);
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return [];
  }
}

export async function requestPartner(criteria: string[]) {
  const partner = ApiPartnerSchema.parse(
    await apiFetch<unknown>("/api/v1/accountability/request-partner", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        matching_phase: "phase_1_ai",
        preferred_criteria: criteria,
      }),
    }),
  );
  return mapPartner(partner);
}

export async function acceptPartner(id: string) {
  const partner = ApiPartnerSchema.parse(
    await apiFetch<unknown>(`/api/v1/accountability/partners/${id}/accept`, {
      auth: true,
      method: "POST",
    }),
  );
  return mapPartner(partner);
}

export async function endPartner(id: string) {
  const partner = ApiPartnerSchema.parse(
    await apiFetch<unknown>(`/api/v1/accountability/partners/${id}/end`, {
      auth: true,
      method: "POST",
    }),
  );
  return mapPartner(partner);
}

export async function listCheckins(partnershipId: string): Promise<Checkin[]> {
  if (!hasAccessToken() || !partnershipId) return [];
  const response = z.array(ApiCheckinSchema).parse(
    await apiFetch<unknown>(
      `/api/v1/accountability/partners/${partnershipId}/checkins`,
      { auth: true },
    ),
  );
  return response.map(mapCheckin);
}

export async function createCheckin(input: { partnershipId: string; message: string }) {
  const checkin = ApiCheckinSchema.parse(
    await apiFetch<unknown>("/api/v1/accountability/checkins", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        partnership_id: input.partnershipId,
        check_in_type: "daily_status",
        message: input.message,
      }),
    }),
  );
  return mapCheckin(checkin);
}

export async function respondToCheckin(input: { id: string; response: string }) {
  const checkin = ApiCheckinSchema.parse(
    await apiFetch<unknown>(`/api/v1/accountability/checkins/${input.id}/respond`, {
      auth: true,
      method: "POST",
      body: JSON.stringify({ response_message: input.response }),
    }),
  );
  return mapCheckin(checkin);
}
