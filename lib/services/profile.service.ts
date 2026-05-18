import { z } from "zod";
import {
  ProfileAnswersSchema,
  ProfileCategorySchema,
  type ProfileAnswers,
} from "@/lib/profile/determine-profile";

export const ProfileDeterminationSchema = z.object({
  category: ProfileCategorySchema,
  title: z.string(),
  tagline: z.string(),
  confidence: z.number(),
  confidenceLabel: z.string(),
  reasons: z.array(z.string()),
  plan: z.object({
    dailyMinutes: z.number(),
    noZeroDayVerses: z.number(),
    anchor: z.string(),
    educationFrequencyPerWeek: z.number(),
    primaryNudge: z.string(),
    startingFocus: z.string(),
  }),
  scores: z.record(ProfileCategorySchema, z.number()),
});

export type ProfileDetermination = z.infer<typeof ProfileDeterminationSchema>;

export async function determineProfile(
  input: ProfileAnswers,
): Promise<ProfileDetermination> {
  const payload = ProfileAnswersSchema.parse(input);

  const response = await fetch("/api/profile/determine", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Profile API failed with ${response.status}`);
  return ProfileDeterminationSchema.parse(await response.json());
}
