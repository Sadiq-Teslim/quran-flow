"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StepShell } from "@/components/onboarding/step-shell";
import { OptionRow } from "@/components/onboarding/option-row";
import { Button } from "@/components/ui/button";
import { useOnboardingDraft } from "@/hooks/use-onboarding-draft";
import { useOnboardingAccountGate } from "@/hooks/use-onboarding-account-gate";

const options = [
  { value: "fajr", label: "After Fajr", description: "Quiet morning, before the day asks for you." },
  { value: "morning", label: "Mid-morning", description: "After settling into the day." },
  { value: "afternoon", label: "Afternoon pause", description: "A breath in the middle of the day." },
  { value: "maghrib", label: "After Maghrib", description: "As the day softens into night." },
  { value: "night", label: "Before sleep", description: "A closing act before rest." },
];

export default function TimeStep() {
  const router = useRouter();
  const { preferredTime, set } = useOnboardingDraft();
  const gate = useOnboardingAccountGate();

  return (
    <StepShell step={5} total={7}>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Step 5 of 7
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight">
              When do you want to read?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Anchoring to a time builds the habit faster than willpower can.
            </p>
          </div>
          <div className="space-y-3">
            {options.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                description={o.description}
                selected={preferredTime === o.value}
                onSelect={() => set({ preferredTime: o.value })}
              />
            ))}
          </div>
        </div>
        <Button
          size="xl"
          className="w-full"
          disabled={!preferredTime || !gate.canContinue}
          onClick={() => router.push("/onboarding/motivation")}
        >
          Continue
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </StepShell>
  );
}
