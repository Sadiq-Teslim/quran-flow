import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";
import { mockDb, persistDb } from "@/lib/mocks/db";
import { simulateNetwork } from "@/lib/mocks/delay";
import { determineProfile } from "@/lib/services/profile.service";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  identity: z.string(),
  identityEarnedAt: z.string(),
  language: z.string(),
  preferredTime: z.enum(["fajr", "morning", "afternoon", "maghrib", "night"]),
  category: z.enum([
    "busy_professional",
    "inconsistent_reader",
    "beginner",
    "deep_learner",
    "new_muslim",
  ]),
  onboarded: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

export const OnboardingPayloadSchema = z.object({
  frequency: z.string(),
  struggles: z.array(z.string()),
  preferredTime: z.string(),
  motivation: z.string(),
  category: z.string().optional(),
});
export type OnboardingPayload = z.infer<typeof OnboardingPayloadSchema>;

const ApiUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  user_type: z.string(),
  preferred_language: z.string(),
  preferred_reading_time: z.string(),
});

const ApiOnboardingStatusSchema = z.object({
  completed: z.boolean(),
});

function identityFromUserType(userType: string) {
  const labels: Record<string, string> = {
    busy_professional: "Steady Reader",
    inconsistent_reader: "Returning Reader",
    beginner: "Growing Reader",
    deep_learner: "Deep Learner",
    new_muslim: "Guided Reader",
  };
  return labels[userType] ?? "Quran Companion";
}

function mapApiUser(
  user: z.infer<typeof ApiUserSchema>,
  onboarded: boolean,
): User {
  const category = UserSchema.shape.category.safeParse(user.user_type).success
    ? user.user_type
    : "beginner";
  const preferredTime = mapBackendPreferredTime(user.preferred_reading_time);
  const name =
    user.first_name ??
    user.username ??
    user.email.split("@")[0] ??
    "there";

  return UserSchema.parse({
    id: user.id,
    name,
    email: user.email,
    identity: identityFromUserType(category),
    identityEarnedAt: new Date().toISOString().slice(0, 10),
    language: user.preferred_language,
    preferredTime,
    category,
    onboarded,
  });
}

export async function getUser(): Promise<User> {
  if (hasAccessToken()) {
    try {
      const [user, onboarding] = await Promise.all([
        apiFetch<unknown>("/api/v1/users/me", { auth: true }),
        apiFetch<unknown>("/api/v1/users/me/onboarding", { auth: true }),
      ]);
      return mapApiUser(
        ApiUserSchema.parse(user),
        ApiOnboardingStatusSchema.parse(onboarding).completed,
      );
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(100, 250);
  return UserSchema.parse(mockDb.user);
}

export async function completeOnboarding(payload: OnboardingPayload): Promise<User> {
  OnboardingPayloadSchema.parse(payload);
  const profile = await determineProfile(payload);

  if (hasAccessToken()) {
    try {
      await apiFetch("/api/v1/users/me/onboarding", {
        auth: true,
        method: "PATCH",
        body: JSON.stringify({
          step: 5,
          user_type: profile.category,
          reading_frequency: mapBackendReadingFrequency(payload.frequency),
          preferred_reading_time: mapBackendPreferredTime(payload.preferredTime),
          motivation_type: mapBackendMotivation(payload.motivation),
          personal_struggles: payload.struggles,
          daily_verse_target: profile.plan.noZeroDayVerses,
        }),
      });
      await apiFetch("/api/v1/users/me/onboarding/complete", {
        auth: true,
        method: "POST",
      });
      return getUser();
    } catch (error) {
      if (!shouldUseMockFallback(error)) throw error;
    }
  }

  await simulateNetwork(250, 550);
  mockDb.user = {
    ...mockDb.user,
    onboarded: true,
    category: profile.category,
    identity: profile.title,
    preferredTime: derivePreferredTime(payload.preferredTime),
  };
  persistDb();
  return UserSchema.parse(mockDb.user);
}

function derivePreferredTime(t: string): User["preferredTime"] {
  const allowed: User["preferredTime"][] = ["fajr", "morning", "afternoon", "maghrib", "night"];
  return (allowed.includes(t as User["preferredTime"]) ? t : "fajr") as User["preferredTime"];
}

function mapBackendPreferredTime(t: string) {
  const values: Record<string, string> = {
    fajr: "fajr",
    morning: "fajr",
    afternoon: "midday",
    midday: "afternoon",
    maghrib: "evening",
    evening: "maghrib",
    night: "night",
    flexible: "fajr",
  };
  return values[t] ?? "flexible";
}

function mapBackendReadingFrequency(frequency: string) {
  const values: Record<string, string> = {
    daily: "daily",
    weekly: "weekly",
    ramadan_only: "rarely",
    starting: "rarely",
  };
  return values[frequency] ?? "weekly";
}

function mapBackendMotivation(motivation: string) {
  const values: Record<string, string> = {
    closeness: "spiritual",
    knowledge: "educational",
    discipline: "habit",
    guidance: "mixed",
  };
  return values[motivation] ?? "mixed";
}
