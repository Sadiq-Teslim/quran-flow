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
import { determineProfileFromAnswers } from "@/lib/profile/determine-profile";
import {
  determineProfile,
  type ProfileDetermination,
} from "@/lib/services/profile.service";

export default function ProfileStep() {
  const router = useRouter();
  const draft = useOnboardingDraft();
  const mutation = useCompleteOnboarding();
  const [isFinishing, setIsFinishing] = useState(false);

  const answers = useMemo(() => {
    if (
      !draft.frequency ||
      !draft.struggles?.length ||
      !draft.preferredTime ||
      !draft.motivation
    ) {
      return null;
    }

    return {
      frequency: draft.frequency,
      struggles: draft.struggles,
      preferredTime: draft.preferredTime,
      motivation: draft.motivation,
      category: draft.category,
    };
  }, [
    draft.category,
    draft.frequency,
    draft.motivation,
    draft.preferredTime,
    draft.struggles,
  ]);

  const localProfile = useMemo(
    () => (answers ? determineProfileFromAnswers(answers) : null),
    [answers],
  );
  const answersKey = useMemo(() => JSON.stringify(answers), [answers]);
  const [remoteProfile, setRemoteProfile] = useState<{
    key: string;
    profile: ProfileDetermination;
  } | null>(null);
  const visibleProfile =
    remoteProfile?.key === answersKey ? remoteProfile.profile : localProfile;

  useEffect(() => {
    if (!answers) return;
    let alive = true;

    determineProfile(answers).then((nextProfile) => {
      if (alive) setRemoteProfile({ key: answersKey, profile: nextProfile });
    });

    return () => {
      alive = false;
    };
  }, [answers, answersKey]);

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
        category: visibleProfile?.category,
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
              {visibleProfile?.title ?? "Personalized Reader"}
            </p>
            <p className="mt-3 font-serif text-base leading-relaxed text-muted-foreground">
              {visibleProfile?.tagline ??
                "We'll shape your path from your answers."}
            </p>
            {visibleProfile ? (
              <div className="mt-5 space-y-3 rounded-lg border border-border/70 bg-background/60 p-4">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider">
                  <span className="text-muted-foreground">Profile match</span>
                  <span className="text-foreground">
                    {visibleProfile.confidence}% {visibleProfile.confidenceLabel}
                  </span>
                </div>
                <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {visibleProfile.reasons.slice(0, 3).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This isn&apos;t a label - it&apos;s a starting shape. Your path will
            adapt as you read, reflect, and return.
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
