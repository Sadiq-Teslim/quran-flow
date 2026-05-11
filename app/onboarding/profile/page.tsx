"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOnboardingDraft } from "@/hooks/use-onboarding-draft";
import { useCompleteOnboarding } from "@/hooks/use-complete-onboarding";

function deriveLabel(draft: ReturnType<typeof useOnboardingDraft.getState>) {
  const struggles = draft.struggles ?? [];
  if (draft.frequency === "starting") {
    return {
      title: "Beginner",
      tagline: "Step by step. The first verses are the foundation of a lifetime.",
    };
  }
  if (draft.frequency === "ramadan_only" || struggles.includes("consistency")) {
    return {
      title: "Inconsistent Reader",
      tagline: "We'll build a path that meets you on the days motivation is quiet.",
    };
  }
  if (struggles.includes("time")) {
    return {
      title: "Busy Reader",
      tagline: "Five minutes, anchored to one moment of your day.",
    };
  }
  if (draft.motivation === "knowledge") {
    return {
      title: "Deep Learner",
      tagline: "We'll pair each verse with context and reflection.",
    };
  }
  return {
    title: "Consistent Reader",
    tagline: "You're already walking. We'll keep the rhythm steady.",
  };
}

export default function ProfileStep() {
  const router = useRouter();
  const draft = useOnboardingDraft();
  const mutation = useCompleteOnboarding();
  const [isFinishing, setIsFinishing] = useState(false);

  const profile = useMemo(() => deriveLabel(draft), [draft]);

  useEffect(() => {
    if (isFinishing) return;
    if (!draft.hasHydrated) return;
    if (!draft.frequency) router.replace("/onboarding/frequency");
    else if (!draft.struggles?.length) router.replace("/onboarding/struggles");
    else if (!draft.preferredTime) router.replace("/onboarding/time");
    else if (!draft.motivation) router.replace("/onboarding/motivation");
  }, [
    draft.frequency,
    draft.hasHydrated,
    draft.motivation,
    draft.preferredTime,
    draft.struggles?.length,
    isFinishing,
    router,
  ]);

  async function handleStart() {
    if (!draft.hasHydrated) return;
    if (!draft.frequency) {
      router.replace("/onboarding/frequency");
      return;
    }
    if (!draft.struggles?.length) {
      router.replace("/onboarding/struggles");
      return;
    }
    if (!draft.preferredTime) {
      router.replace("/onboarding/time");
      return;
    }
    if (!draft.motivation) {
      router.replace("/onboarding/motivation");
      return;
    }
    setIsFinishing(true);
    try {
      await mutation.mutateAsync({
        frequency: draft.frequency,
        struggles: draft.struggles ?? [],
        preferredTime: draft.preferredTime,
        motivation: draft.motivation,
        category: profile.title.toLowerCase().replace(/\s+/g, "_"),
      });
      router.replace("/home");
      draft.reset();
    } catch {
      setIsFinishing(false);
      toast.error("Something didn't save. Try again.");
    }
  }

  return (
    <StepShell step={6} total={6}>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your path
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight">
              We&apos;ll walk with you as a
            </h1>
          </div>
          <Card className="bg-gradient-to-b from-accent/[0.08] to-transparent p-6">
            <div className="flex items-center gap-2 text-accent">
              <Sparkles className="size-4" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Your identity
              </span>
            </div>
            <p className="mt-3 font-serif text-3xl leading-tight">
              {profile.title}
            </p>
            <p className="mt-3 font-serif text-base leading-relaxed text-muted-foreground">
              {profile.tagline}
            </p>
          </Card>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This isn&apos;t a label — it&apos;s a starting shape. Your path will adapt
            as you read, reflect, and return.
          </p>
        </div>
        <Button
          size="xl"
          className="w-full"
          disabled={mutation.isPending || isFinishing}
          onClick={handleStart}
        >
          {mutation.isPending || isFinishing ? "Setting up..." : "Begin my journey"}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </StepShell>
  );
}
