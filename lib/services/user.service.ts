import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";
import { mockDb, persistDb } from "@/lib/mocks/db";
import { simulateNetwork } from "@/lib/mocks/delay";
import {
  determineProfile,
  ProfileDeterminationSchema,
  type ProfileDetermination,
} from "@/lib/services/profile.service";

const PROFILE_OVERRIDE_KEY = "quranflow.profile_override";

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
  isAnonymous: z.boolean().default(false),
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
  user_type: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  preferred_language: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  preferred_reading_time: z.string().nullable().optional(),
  reading_time: z.string().nullable().optional(),
  onboarding_completed: z.boolean().nullable().optional(),
  onboarded: z.boolean().nullable().optional(),
  anonymous_mode: z.boolean().optional(),
});

const ApiOnboardingStatusSchema = z.object({
  completed: z.boolean().optional(),
  onboarding_completed: z.boolean().optional(),
  onboarded: z.boolean().optional(),
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

function getProfileOverride(): ProfileDetermination | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(PROFILE_OVERRIDE_KEY);
    if (!raw) return null;
    return ProfileDeterminationSchema.parse(JSON.parse(raw));
  } catch {
    localStorage.removeItem(PROFILE_OVERRIDE_KEY);
    return null;
  }
}

function saveProfileOverride(profile: ProfileDetermination) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_OVERRIDE_KEY, JSON.stringify(profile));
}

export function clearProfileOverride() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_OVERRIDE_KEY);
}

function displayNameFromUser(
  user: z.infer<typeof ApiUserSchema>,
  profile: ProfileDetermination | null,
) {
  if (user.first_name) return user.first_name;
  if (user.username) return user.username;
  if (user.anonymous_mode) return profile?.title ?? "Quran Companion";

  const emailName = user.email.split("@")[0];
  if (/^(guest|anonymous|anon)[-_]?\w*/i.test(emailName)) {
    return profile?.title ?? "Quran Companion";
  }

  return emailName || profile?.title || "Quran Companion";
}

function mapApiUser(
  user: z.infer<typeof ApiUserSchema>,
  onboarded: boolean,
): User {
  const profileOverride = getProfileOverride();
  const rawCategory = user.category ?? user.user_type ?? "beginner";
  const category = profileOverride?.category
    ? profileOverride.category
    : UserSchema.shape.category.safeParse(rawCategory).success
      ? rawCategory
      : "beginner";
  const identity = profileOverride?.title
    ? profileOverride.title
    : identityFromUserType(category);
  const name = displayNameFromUser(user, profileOverride);
  const preferredTime = mapApiPreferredTime(
    user.preferred_reading_time ?? user.reading_time ?? "fajr",
  );

  return UserSchema.parse({
    id: user.id,
    name,
    email: user.anonymous_mode ? "Private session" : user.email,
    identity,
    identityEarnedAt: new Date().toISOString().slice(0, 10),
    language: user.preferred_language ?? user.language ?? "en",
    preferredTime,
    category,
    onboarded,
    isAnonymous: Boolean(user.anonymous_mode),
  });
}

export async function getUser(): Promise<User> {
  if (hasAccessToken()) {
    try {
      const [authUser, profile] = await Promise.all([
        apiFetch<unknown>("/api/v1/auth/me", { auth: true }),
        apiFetch<unknown>("/api/v1/me/profile", { auth: true }).catch(() => null),
      ]);
      const user = ApiUserSchema.parse({
        ...(typeof authUser === "object" && authUser ? authUser : {}),
        ...(typeof profile === "object" && profile ? profile : {}),
      });
      const onboarding = ApiOnboardingStatusSchema.parse(profile ?? {});
      return mapApiUser(
        user,
        Boolean(
          onboarding.completed ??
            onboarding.onboarding_completed ??
            onboarding.onboarded ??
            user.onboarding_completed ??
            user.onboarded,
        ),
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
  saveProfileOverride(profile);

  if (hasAccessToken()) {
    try {
      await apiFetch("/api/v1/onboarding/profile", {
        auth: true,
        method: "POST",
        body: JSON.stringify({
          user_type: profile.category,
          reading_frequency: mapBackendReadingFrequency(payload.frequency),
          preferred_reading_time: mapToBackendPreferredTime(payload.preferredTime),
          motivation_type: mapBackendMotivation(payload.motivation),
          struggles: payload.struggles,
          locale: "en",
          goals: [profile.title],
        }),
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

function mapToBackendPreferredTime(t: string) {
  const values: Record<string, "fajr" | "midday" | "evening" | "night" | "flexible"> = {
    fajr: "fajr",
    morning: "fajr",
    afternoon: "midday",
    maghrib: "evening",
    night: "night",
    flexible: "flexible",
  };
  return values[t] ?? "flexible";
}

function mapApiPreferredTime(t: string): User["preferredTime"] {
  const values: Record<string, User["preferredTime"]> = {
    fajr: "fajr",
    midday: "afternoon",
    evening: "maghrib",
    night: "night",
    flexible: "fajr",
    morning: "morning",
    afternoon: "afternoon",
    maghrib: "maghrib",
  };
  return values[t] ?? "fajr";
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
