"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StepShell } from "@/components/onboarding/step-shell";
import { OptionRow } from "@/components/onboarding/option-row";
import { Button } from "@/components/ui/button";
import { useOnboardingDraft } from "@/hooks/use-onboarding-draft";

const options = [
  { value: "time", label: "Finding time", description: "Days move fast, hours disappear." },
  { value: "consistency", label: "Staying consistent", description: "I start strong and slow down." },
  { value: "understanding", label: "Understanding what I read", description: "Arabic feels distant from meaning." },
  { value: "motivation", label: "Staying motivated", description: "Some weeks the spark just isn't there." },
];

export default function StrugglesStep() {
  const router = useRouter();
  const { struggles = [], set } = useOnboardingDraft();

  function toggle(v: string) {
    const next = struggles.includes(v)
      ? struggles.filter((s) => s !== v)
      : [...struggles, v];
    set({ struggles: next });
  }

  return (
    <StepShell step={3} total={6}>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Step 3 of 6
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight">
              What gets in the way?
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pick all that feel true.
            </p>
          </div>
          <div className="space-y-3">
            {options.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                description={o.description}
                selected={struggles.includes(o.value)}
                onSelect={() => toggle(o.value)}
              />
            ))}
          </div>
        </div>
        <Button
          size="xl"
          className="w-full"
          disabled={struggles.length === 0}
          onClick={() => router.push("/onboarding/time")}
        >
          Continue
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </StepShell>
  );
}
