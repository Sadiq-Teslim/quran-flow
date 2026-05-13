"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StepShell } from "@/components/onboarding/step-shell";
import { OptionRow } from "@/components/onboarding/option-row";
import { Button } from "@/components/ui/button";
import { useOnboardingDraft } from "@/hooks/use-onboarding-draft";
import { useOnboardingAccountGate } from "@/hooks/use-onboarding-account-gate";

const options = [
  { value: "daily", label: "Daily", description: "I read at least a little every day." },
  { value: "weekly", label: "A few times a week", description: "Some days I read, some I miss." },
  { value: "ramadan_only", label: "Mostly during Ramadan", description: "I want to change that." },
  { value: "starting", label: "I'm just starting", description: "Brand new, or returning after a long pause." },
];

export default function FrequencyStep() {
  const router = useRouter();
  const { frequency, set } = useOnboardingDraft();
  const gate = useOnboardingAccountGate();

  return (
    <StepShell step={3} total={7}>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Step 3 of 7
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight">
              How often do you read the Quran today?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No right answer. We&apos;re just listening.
            </p>
          </div>
          <div className="space-y-3">
            {options.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                description={o.description}
                selected={frequency === o.value}
                onSelect={() => set({ frequency: o.value })}
              />
            ))}
          </div>
        </div>
        <Button
          size="xl"
          className="w-full"
          disabled={!frequency || !gate.canContinue}
          onClick={() => router.push("/onboarding/struggles")}
        >
          Continue
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </StepShell>
  );
}
