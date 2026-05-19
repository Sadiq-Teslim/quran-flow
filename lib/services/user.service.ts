import { z } from "zod";
import { apiFetch, hasAccessToken } from "@/lib/api/client";

const UserCategorySchema = z.enum([
    "busy_professional",
    "inconsistent_reader",
    "beginner",
    "deep_learner",
    "new_muslim",
]);
type UserCategory = z.infer<typeof UserCategorySchema>;

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  identity: z.string(),
  identityEarnedAt: z.string(),
  language: z.string(),
  preferredTime: z.enum(["fajr", "morning", "afternoon", "maghrib", "night"]),
  category: UserCategorySchema,
  onboarded: z.boolean(),
  isAnonymous: z.boolean().default(false),
});
export type User = z.infer<typeof UserSchema>;

export const OnboardingPayloadSchema = z.object({
  frequency: z.string(),
  struggles: z.array(z.string()),
  preferredTime: z.string(),
  motivation: z.string(),
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

const ApiProfileSchema = z.object({
  category: z.string().nullable().optional(),
  reading_frequency: z.string().nullable().optional(),
  struggles: z.array(z.string()).nullable().optional(),
  preferred_reading_time: z.string().nullable().optional(),
  motivation_type: z.string().nullable().optional(),
  user_type: z.string().nullable().optional(),
  locale: z.string().nullable().optional(),
  goals: z.array(z.string()).nullable().optional(),
});

const ApiProfileResponseSchema = z.object({
  profile: ApiProfileSchema.nullable().optional(),
});

const ApiOnboardingResponseSchema = z.object({
  profile: ApiProfileSchema,
});

function identityFromUserType(userType: UserCategory) {
  const labels: Record<UserCategory, string> = {
    busy_professional: "Steady Reader",
    inconsistent_reader: "Returning Reader",
    beginner: "Growing Reader",
    deep_learner: "Deep Learner",
    new_muslim: "Guided Reader",
  };
  return labels[userType] ?? "Quran Companion";
}

export function clearProfileOverride() {
  // Clear legacy local profile determinations from older frontend builds.
  if (typeof window !== "undefined") {
    localStorage.removeItem("quranflow.profile_override");
  }
}

function displayNameFromUser(user: z.infer<typeof ApiUserSchema>) {
  if (user.first_name) return user.first_name;
  if (user.username) return user.username;
  if (user.anonymous_mode) return "Quran Companion";

  const emailName = user.email.split("@")[0];
  if (/^(guest|anonymous|anon)[-_]?\w*/i.test(emailName)) {
    return "Quran Companion";
  }

  return emailName || "Quran Companion";
}

function normalizeCategory(value: string | null | undefined): UserCategory {
  const parsed = UserCategorySchema.safeParse(value);
  return parsed.success ? parsed.data : "inconsistent_reader";
}

function profileIsOnboarded(
  profile: z.infer<typeof ApiProfileSchema> | null | undefined,
) {
  if (!profile) return false;
  return Boolean(
    profile.reading_frequency ||
      profile.preferred_reading_time ||
      profile.motivation_type ||
      profile.user_type ||
      profile.category,
  );
}

function mapApiUser(
  user: z.infer<typeof ApiUserSchema>,
  onboarded: boolean,
  profile: z.infer<typeof ApiProfileSchema> | null | undefined,
): User {
  const category = normalizeCategory(
    profile?.category ?? user.category ?? user.user_type,
  );
  const identity = identityFromUserType(category);
  const name = displayNameFromUser(user);
  const preferredTime = mapApiPreferredTime(
    profile?.preferred_reading_time ??
      user.preferred_reading_time ??
      user.reading_time ??
      "fajr",
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

export async function getUser(): Promise<User | null> {
  if (!hasAccessToken()) return null;

  const [authUser, profile] = await Promise.all([
    apiFetch<unknown>("/api/v1/auth/me", { auth: true }),
    apiFetch<unknown>("/api/v1/me/profile", { auth: true }).catch(() => null),
  ]);
  const profileData = ApiProfileResponseSchema.safeParse(profile).success
    ? ApiProfileResponseSchema.parse(profile).profile
    : ApiProfileSchema.safeParse(profile).success
      ? ApiProfileSchema.parse(profile)
      : null;
  const user = ApiUserSchema.parse({
    ...(typeof authUser === "object" && authUser ? authUser : {}),
    ...(profileData ?? {}),
  });
  const onboarding = ApiOnboardingStatusSchema.parse(profile ?? {});
  return mapApiUser(
    user,
    Boolean(
      onboarding.completed ??
        onboarding.onboarding_completed ??
        onboarding.onboarded ??
        user.onboarding_completed ??
        user.onboarded ??
        profileIsOnboarded(profileData),
    ),
    profileData,
  );
}

export async function completeOnboarding(payload: OnboardingPayload): Promise<User> {
  OnboardingPayloadSchema.parse(payload);
  if (!hasAccessToken()) {
    throw new Error("Create or sign in to your QuranFlow account before continuing.");
  }

  const response = ApiOnboardingResponseSchema.parse(await apiFetch("/api/v1/onboarding/profile", {
    auth: true,
    method: "POST",
    body: JSON.stringify({
      reading_frequency: mapBackendReadingFrequency(payload.frequency),
      preferred_reading_time: mapToBackendPreferredTime(payload.preferredTime),
      motivation_type: mapBackendMotivation(payload.motivation),
      struggles: payload.struggles,
      locale: "en",
      goals: [],
    }),
  }));

  const user = await getUser();
  if (!user) {
    throw new Error("Your account could not be loaded after onboarding.");
  }

  return UserSchema.parse({
    ...user,
    category: normalizeCategory(response.profile.category),
    identity: identityFromUserType(normalizeCategory(response.profile.category)),
    onboarded: true,
  });
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
