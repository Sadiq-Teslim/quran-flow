import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";

export const GeneratedPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  planType: z.string(),
  versesPerDay: z.number(),
  difficultyLevel: z.string(),
  readingTime: z.string(),
});
export type GeneratedPlan = z.infer<typeof GeneratedPlanSchema>;

export const RecommendationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  stage: z.string(),
  minutes: z.number().nullable(),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const PersonalizedBundleSchema = z.object({
  plan: GeneratedPlanSchema,
  recommendations: z.array(RecommendationSchema),
  checkinMessage: z.string(),
});
export type PersonalizedBundle = z.infer<typeof PersonalizedBundleSchema>;

const ApiGeneratedPlanSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  plan_type: z.string().optional(),
  verses_per_day: z.number().optional(),
  difficulty_level: z.string().optional(),
  reading_time: z.string().optional(),
});

const ApiModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  stage: z.string(),
  duration_minutes: z.number().nullable().optional(),
});

const ApiFallbackCheckinSchema = z.object({
  message: z.string(),
});

function mapPlan(plan: z.infer<typeof ApiGeneratedPlanSchema>) {
  return GeneratedPlanSchema.parse({
    id: plan.id ?? `plan_${Date.now()}`,
    name: plan.name ?? "QuranFlow Daily Plan",
    planType: plan.plan_type ?? "daily",
    versesPerDay: plan.verses_per_day ?? 3,
    difficultyLevel: plan.difficulty_level ?? "gentle",
    readingTime: plan.reading_time ?? "fajr",
  });
}

export async function generatePlan(planName?: string) {
  void planName;
  const plan = ApiGeneratedPlanSchema.parse(
    await apiFetch<unknown>("/api/v1/ai/personalized-plan", {
      auth: true,
      method: "POST",
    }),
  );
  return mapPlan(plan);
}

export async function getRecommendations(limit = 3): Promise<Recommendation[]> {
  if (!hasAccessToken()) return [];
  try {
    const feed = z.object({
      lessons: z.array(ApiModuleSchema).optional(),
      modules: z.array(ApiModuleSchema).optional(),
      items: z.array(ApiModuleSchema).optional(),
    }).parse(
      await apiFetch<unknown>("/api/v1/education/feed", { auth: true }),
    );
    return (feed.lessons ?? feed.modules ?? feed.items ?? []).slice(0, limit).map((module) =>
      RecommendationSchema.parse({
        id: module.id,
        title: module.title,
        description: module.description ?? null,
        stage: String(module.stage),
        minutes: module.duration_minutes ?? null,
      }),
    );
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return [];
  }
}

export async function getFallbackCheckin() {
  if (!hasAccessToken()) {
    return "Sign in to receive personalized check-ins.";
  }
  try {
    const response = ApiFallbackCheckinSchema.parse(
      await apiFetch<unknown>("/api/v1/ai/check-in", {
        auth: true,
        method: "POST",
        body: JSON.stringify({ completed_today: false }),
      }),
    );
    return response.message;
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return "No guilt. Take the smallest next step: three verses today.";
  }
}

export async function personalize(input?: { planName?: string; recommendationLimit?: number }) {
  const plan = mapPlan(
    ApiGeneratedPlanSchema.parse(
      await apiFetch<unknown>("/api/v1/ai/personalized-plan", {
      auth: true,
      method: "POST",
    }),
    ),
  );
  const recommendations = await getRecommendations(input?.recommendationLimit ?? 3);
  const checkinMessage = await getFallbackCheckin();
  return PersonalizedBundleSchema.parse({
    plan,
    recommendations,
    checkinMessage,
  });
}
