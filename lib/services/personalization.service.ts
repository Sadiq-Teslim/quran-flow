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
  id: z.string(),
  name: z.string(),
  plan_type: z.string(),
  verses_per_day: z.number(),
  difficulty_level: z.string(),
  reading_time: z.string(),
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

const ApiPersonalizeSchema = z.object({
  plan: ApiGeneratedPlanSchema,
  recommendations: z.array(ApiModuleSchema),
  checkin_message: z.string(),
});

function mapPlan(plan: z.infer<typeof ApiGeneratedPlanSchema>) {
  return GeneratedPlanSchema.parse({
    id: plan.id,
    name: plan.name,
    planType: plan.plan_type,
    versesPerDay: plan.verses_per_day,
    difficultyLevel: plan.difficulty_level,
    readingTime: plan.reading_time,
  });
}

export async function generatePlan(planName?: string) {
  const plan = ApiGeneratedPlanSchema.parse(
    await apiFetch<unknown>("/api/v1/personalization/generate-plan", {
      auth: true,
      method: "POST",
      body: JSON.stringify({ plan_name: planName || null }),
    }),
  );
  return mapPlan(plan);
}

export async function getRecommendations(limit = 3): Promise<Recommendation[]> {
  if (!hasAccessToken()) return [];
  try {
    const modules = z.array(ApiModuleSchema).parse(
      await apiFetch<unknown>(
        `/api/v1/personalization/recommend-content?limit=${limit}`,
        { auth: true },
      ),
    );
    return modules.map((module) =>
      RecommendationSchema.parse({
        id: module.id,
        title: module.title,
        description: module.description ?? null,
        stage: module.stage,
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
    return "Connect your account to receive AI check-ins.";
  }
  try {
    const response = ApiFallbackCheckinSchema.parse(
      await apiFetch<unknown>("/api/v1/personalization/fallback-checkin", {
        auth: true,
      }),
    );
    return response.message;
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return "No guilt. Take the smallest next step: three verses today.";
  }
}

export async function personalize(input?: { planName?: string; recommendationLimit?: number }) {
  const response = ApiPersonalizeSchema.parse(
    await apiFetch<unknown>("/api/v1/personalization/personalize", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        plan_name: input?.planName ?? "QuranFlow Daily Plan",
        recommendation_limit: input?.recommendationLimit ?? 3,
      }),
    }),
  );
  return PersonalizedBundleSchema.parse({
    plan: mapPlan(response.plan),
    recommendations: response.recommendations.map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description ?? null,
      stage: module.stage,
      minutes: module.duration_minutes ?? null,
    })),
    checkinMessage: response.checkin_message,
  });
}
