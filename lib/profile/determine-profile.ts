import { z } from "zod";

export const ProfileCategorySchema = z.enum([
  "busy_professional",
  "inconsistent_reader",
  "beginner",
  "deep_learner",
  "new_muslim",
]);

export type ProfileCategory = z.infer<typeof ProfileCategorySchema>;

export const ProfileAnswersSchema = z.object({
  frequency: z.string(),
  struggles: z.array(z.string()).default([]),
  preferredTime: z.string(),
  motivation: z.string(),
  category: z.string().optional(),
});

export type ProfileAnswers = z.infer<typeof ProfileAnswersSchema>;

const profileCopy: Record<
  ProfileCategory,
  {
    title: string;
    tagline: string;
    primaryNudge: string;
    startingFocus: string;
  }
> = {
  busy_professional: {
    title: "Busy Professional",
    tagline: "A compact path anchored to one reliable moment in your day.",
    primaryNudge: "Keep it short enough to protect, even on crowded days.",
    startingFocus: "5-minute sessions with a fixed daily anchor.",
  },
  inconsistent_reader: {
    title: "Inconsistent Reader",
    tagline: "A gentle re-entry path for the days motivation gets quiet.",
    primaryNudge: "Protect the return, not the streak.",
    startingFocus: "No-zero-day reading and forgiving weekly rhythm.",
  },
  beginner: {
    title: "Beginner",
    tagline: "Step by step. The first verses are the foundation of a lifetime.",
    primaryNudge: "Build confidence before increasing volume.",
    startingFocus: "Short guided readings with simple explanations.",
  },
  deep_learner: {
    title: "Deep Learner",
    tagline: "A meaning-first path that pairs reading with context and reflection.",
    primaryNudge: "Turn understanding into one lived action.",
    startingFocus: "Tafsir, reflection, and application prompts.",
  },
  new_muslim: {
    title: "New Muslim",
    tagline: "A simplified path with reassurance, context, and steady progression.",
    primaryNudge: "Start with clarity and confidence, not pressure.",
    startingFocus: "Foundational verses and step-by-step guidance.",
  },
};

const baseScores = (): Record<ProfileCategory, number> => ({
  busy_professional: 0,
  inconsistent_reader: 0,
  beginner: 0,
  deep_learner: 0,
  new_muslim: 0,
});

function addEvidence(
  scores: Record<ProfileCategory, number>,
  reasons: string[],
  category: ProfileCategory,
  points: number,
  reason: string,
) {
  scores[category] += points;
  if (!reasons.includes(reason)) reasons.push(reason);
}

function applyFrequency(
  answers: ProfileAnswers,
  scores: Record<ProfileCategory, number>,
  reasons: string[],
) {
  if (answers.frequency === "daily") {
    addEvidence(scores, reasons, "deep_learner", 3, "Daily reading shows an existing rhythm to deepen.");
  }
  if (answers.frequency === "weekly") {
    addEvidence(scores, reasons, "inconsistent_reader", 2, "A few readings per week suggests the habit exists but needs structure.");
    addEvidence(scores, reasons, "busy_professional", 1, "Irregular reading can come from schedule pressure.");
  }
  if (answers.frequency === "ramadan_only") {
    addEvidence(scores, reasons, "inconsistent_reader", 5, "Ramadan-only engagement points to a re-entry and consistency need.");
    addEvidence(scores, reasons, "beginner", 1, "Seasonal reading benefits from a simpler starting plan.");
  }
  if (answers.frequency === "starting") {
    addEvidence(scores, reasons, "beginner", 5, "Starting or returning after a long pause needs a confidence-first path.");
    addEvidence(scores, reasons, "new_muslim", 1, "New starts need more guided context.");
  }
}

function applyStruggles(
  answers: ProfileAnswers,
  scores: Record<ProfileCategory, number>,
  reasons: string[],
) {
  const struggles = new Set(answers.struggles);

  if (struggles.has("time")) {
    addEvidence(scores, reasons, "busy_professional", 5, "Finding time is the strongest signal for a compact daily plan.");
  }
  if (struggles.has("consistency")) {
    addEvidence(scores, reasons, "inconsistent_reader", 5, "Consistency struggles need a forgiving behavior system.");
  }
  if (struggles.has("understanding")) {
    addEvidence(scores, reasons, "deep_learner", 4, "Wanting better understanding calls for tafsir and reflection.");
    addEvidence(scores, reasons, "beginner", 1, "Comprehension friction also benefits from simplified guidance.");
  }
  if (struggles.has("motivation")) {
    addEvidence(scores, reasons, "inconsistent_reader", 3, "Motivation dips need identity-based nudges and re-entry.");
    addEvidence(scores, reasons, "beginner", 1, "Low motivation is easier to rebuild with smaller starts.");
  }
}

function applyMotivation(
  answers: ProfileAnswers,
  scores: Record<ProfileCategory, number>,
  reasons: string[],
) {
  if (answers.motivation === "knowledge") {
    addEvidence(scores, reasons, "deep_learner", 4, "Choosing knowledge makes meaning the center of the journey.");
  }
  if (answers.motivation === "guidance") {
    addEvidence(scores, reasons, "deep_learner", 3, "Daily-life guidance points toward applied reflection.");
    addEvidence(scores, reasons, "new_muslim", 1, "Guidance-seeking benefits from clear foundations.");
  }
  if (answers.motivation === "discipline") {
    addEvidence(scores, reasons, "inconsistent_reader", 3, "Discipline goals need repeatable systems over willpower.");
    addEvidence(scores, reasons, "busy_professional", 1, "Discipline is easier when the routine is time-boxed.");
  }
  if (answers.motivation === "closeness") {
    addEvidence(scores, reasons, "beginner", 1, "Closeness is best protected by a gentle starting rhythm.");
    addEvidence(scores, reasons, "inconsistent_reader", 1, "Spiritual motivation still needs reinforcement after hard days.");
  }
}

function applySchedule(
  answers: ProfileAnswers,
  scores: Record<ProfileCategory, number>,
  reasons: string[],
) {
  if (["fajr", "morning"].includes(answers.preferredTime)) {
    addEvidence(scores, reasons, "busy_professional", 1, "A morning anchor can protect the habit before the day gets crowded.");
  }
  if (["maghrib", "night"].includes(answers.preferredTime)) {
    addEvidence(scores, reasons, "inconsistent_reader", 1, "An evening anchor pairs well with reflection and reset.");
  }
}

function applyCombinations(
  answers: ProfileAnswers,
  scores: Record<ProfileCategory, number>,
  reasons: string[],
) {
  const struggles = new Set(answers.struggles);

  if (struggles.has("understanding") && answers.motivation === "knowledge") {
    addEvidence(scores, reasons, "deep_learner", 3, "Understanding plus knowledge is a strong learning-path signal.");
  }
  if (struggles.has("time") && answers.motivation === "discipline") {
    addEvidence(scores, reasons, "busy_professional", 2, "Time pressure plus discipline needs a tightly scoped routine.");
  }
  if (
    struggles.has("consistency") &&
    ["ramadan_only", "weekly"].includes(answers.frequency)
  ) {
    addEvidence(scores, reasons, "inconsistent_reader", 3, "Infrequent reading plus consistency friction needs re-entry support.");
  }
  if (answers.frequency === "starting" && answers.motivation !== "knowledge") {
    addEvidence(scores, reasons, "beginner", 2, "A new start should begin with reassurance before depth.");
  }
  if (answers.category === "new_muslim") {
    addEvidence(scores, reasons, "new_muslim", 8, "The user explicitly needs the New Muslim journey.");
  }
}

function resolveCategory(
  answers: ProfileAnswers,
  scores: Record<ProfileCategory, number>,
): ProfileCategory {
  const priority: ProfileCategory[] = [
    "new_muslim",
    "busy_professional",
    "inconsistent_reader",
    "beginner",
    "deep_learner",
  ];
  const topScore = Math.max(...Object.values(scores));
  const tied = priority.filter((category) => scores[category] === topScore);
  const struggles = new Set(answers.struggles);

  if (answers.category === "new_muslim" && tied.includes("new_muslim")) return "new_muslim";
  if (struggles.has("time") && tied.includes("busy_professional")) return "busy_professional";
  if (
    (struggles.has("consistency") || answers.frequency === "ramadan_only") &&
    tied.includes("inconsistent_reader")
  ) {
    return "inconsistent_reader";
  }
  if (answers.frequency === "starting" && tied.includes("beginner")) return "beginner";
  if (
    (struggles.has("understanding") || answers.motivation === "knowledge") &&
    tied.includes("deep_learner")
  ) {
    return "deep_learner";
  }

  return tied[0] ?? "beginner";
}

function confidenceFromScores(scores: Record<ProfileCategory, number>, category: ProfileCategory) {
  const sorted = Object.values(scores).sort((a, b) => b - a);
  const top = scores[category];
  const margin = top - (sorted[1] ?? 0);
  const confidence = Math.min(95, Math.max(58, 56 + top * 3 + margin * 5));

  return {
    confidence,
    confidenceLabel: margin >= 4 ? "high" : margin >= 2 ? "medium" : "emerging",
  };
}

function planForCategory(category: ProfileCategory, answers: ProfileAnswers) {
  const struggles = new Set(answers.struggles);
  const dailyMinutes =
    category === "busy_professional" || struggles.has("time")
      ? 5
      : category === "deep_learner"
        ? 10
        : 7;

  return {
    dailyMinutes,
    noZeroDayVerses:
      category === "inconsistent_reader" || struggles.has("consistency") ? 3 : 5,
    anchor: answers.preferredTime,
    educationFrequencyPerWeek:
      category === "deep_learner" || struggles.has("understanding") ? 3 : 2,
  };
}

export function determineProfileFromAnswers(input: ProfileAnswers) {
  const answers = ProfileAnswersSchema.parse(input);
  const scores = baseScores();
  const reasons: string[] = [];

  applyFrequency(answers, scores, reasons);
  applyStruggles(answers, scores, reasons);
  applyMotivation(answers, scores, reasons);
  applySchedule(answers, scores, reasons);
  applyCombinations(answers, scores, reasons);

  const category = resolveCategory(answers, scores);
  const copy = profileCopy[category];
  const confidence = confidenceFromScores(scores, category);

  return {
    category,
    title: copy.title,
    tagline: copy.tagline,
    confidence: confidence.confidence,
    confidenceLabel: confidence.confidenceLabel,
    reasons: reasons.slice(0, 4),
    plan: {
      ...planForCategory(category, answers),
      primaryNudge: copy.primaryNudge,
      startingFocus: copy.startingFocus,
    },
    scores,
  };
}
