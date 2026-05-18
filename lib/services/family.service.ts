import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";

export const FamilySchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerUserId: z.string(),
  sharedDailyVerseTarget: z.number(),
});
export type Family = z.infer<typeof FamilySchema>;

export const FamilyMemberSchema = z.object({
  id: z.string(),
  userId: z.string(),
  role: z.string(),
  displayName: z.string().nullable(),
  email: z.string().nullable(),
});
export type FamilyMember = z.infer<typeof FamilyMemberSchema>;

export const FamilyDashboardSchema = z.object({
  familyId: z.string(),
  name: z.string(),
  sharedDailyVerseTarget: z.number(),
  memberCount: z.number(),
  totals: z.record(z.string(), z.unknown()),
});
export type FamilyDashboard = z.infer<typeof FamilyDashboardSchema>;

const ApiFamilySchema = z.object({
  id: z.string(),
  name: z.string(),
  owner_user_id: z.string().optional(),
  shared_daily_verse_target: z.number().optional(),
});

const ApiMemberSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  role: z.string(),
  display_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});

const ApiMembersSchema = z.object({
  members: z.array(ApiMemberSchema),
});

const ApiDashboardSchema = z.object({
  family_id: z.string().optional(),
  id: z.string().optional(),
  name: z.string().optional(),
  shared_daily_verse_target: z.number().optional(),
  member_count: z.number().optional(),
  totals: z.record(z.string(), z.unknown()).optional(),
});

function mapFamily(family: z.infer<typeof ApiFamilySchema>): Family {
  return FamilySchema.parse({
    id: family.id,
    name: family.name,
    ownerUserId: family.owner_user_id ?? "",
    sharedDailyVerseTarget: family.shared_daily_verse_target ?? 3,
  });
}

function mapMember(member: z.infer<typeof ApiMemberSchema>): FamilyMember {
  return FamilyMemberSchema.parse({
    id: member.id,
    userId: member.user_id ?? "",
    role: member.role,
    displayName: member.display_name ?? null,
    email: member.email ?? null,
  });
}

export async function listFamilies(): Promise<Family[]> {
  if (!hasAccessToken()) return [];
  try {
    const families = z
      .object({
        families: z.array(ApiFamilySchema).optional(),
        items: z.array(ApiFamilySchema).optional(),
      })
      .parse(await apiFetch<unknown>("/api/v1/families", { auth: true }));
    return (families.families ?? families.items ?? []).map(mapFamily);
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return [];
  }
}

export async function createFamily(input: { name: string; target: number }) {
  const family = ApiFamilySchema.parse(
    await apiFetch<unknown>("/api/v1/families", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        name: input.name,
      }),
    }),
  );
  return mapFamily(family);
}

export async function getFamilyMembers(familyId?: string) {
  if (!familyId) return [];
  const response = ApiMembersSchema.parse(
    await apiFetch<unknown>(`/api/v1/families/${familyId}/members`, {
      auth: true,
    }),
  );
  return response.members.map(mapMember);
}

export async function getFamilyDashboard(familyId?: string) {
  if (!familyId) return null;
  const dashboard = ApiDashboardSchema.parse(
    await apiFetch<unknown>(`/api/v1/families/${familyId}/progress`, {
      auth: true,
    }),
  );
  return FamilyDashboardSchema.parse({
    familyId: dashboard.family_id ?? dashboard.id ?? familyId,
    name: dashboard.name ?? "Family",
    sharedDailyVerseTarget: dashboard.shared_daily_verse_target ?? 3,
    memberCount: dashboard.member_count ?? 0,
    totals: dashboard.totals ?? {},
  });
}

export async function inviteFamilyMember(input: {
  familyId: string;
  email: string;
  role: string;
  displayName?: string;
}) {
  const member = ApiMemberSchema.parse(
    await apiFetch<unknown>(`/api/v1/families/${input.familyId}/members`, {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        role: input.role,
        display_name: input.displayName || input.email,
      }),
    }),
  );
  return mapMember(member);
}
