"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StepShell } from "@/components/onboarding/step-shell";
import { OptionRow } from "@/components/onboarding/option-row";
import { Button } from "@/components/ui/button";
import { useOnboardingDraft } from "@/hooks/use-onboarding-draft";

const options = [
  { value: "closeness", label: "Nearness to Allah", description: "I want to feel closer in my daily life." },
  { value: "knowledge", label: "Understanding the Book", description: "I want meaning, not just recitation." },
  { value: "discipline", label: "Building discipline", description: "I want a steady spiritual practice." },
  { value: "guidance", label: "Guidance for daily life", description: "I want the Quran to shape my decisions." },
];

export default function MotivationStep() {
  const router = useRouter();
  const { motivation, set } = useOnboardingDraft();

  return (
    <StepShell step={5} total={6}>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Step 5 of 6
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight">
              What pulls you here?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose the one that feels closest to your intention.
            </p>
          </div>
          <div className="space-y-3">
            {options.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                description={o.description}
                selected={motivation === o.value}
                onSelect={() => set({ motivation: o.value })}
              />
            ))}
          </div>
        </div>
        <Button
          size="xl"
          className="w-full"
          disabled={!motivation}
          onClick={() => router.push("/onboarding/profile")}
        >
          Continue
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </StepShell>
  );
}
