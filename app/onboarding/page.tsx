"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { QuranFlowMark } from "@/components/brand/quranflow-mark";
import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";

export default function OnboardingWelcome() {
  return (
    <StepShell step={1} total={7}>
      <div className="flex flex-1 flex-col">
        <div className="flex-1">
          <QuranFlowMark showWordmark className="mb-10" />
          <p
            lang="ar"
            dir="rtl"
            className="mb-5 text-center text-3xl text-accent [font-family:var(--font-arabic),serif]"
          >
            السلام عليكم
          </p>
          <h1 className="text-[38px] font-semibold leading-[1.1] tracking-tight">
            As-salamu alaykum.
            <br />
            <span className="text-muted-foreground">
              Let&apos;s shape your journey.
            </span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            QuranFlow helps the Quran become a steady daily presence, not a
            Ramadan-only visitor.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            A few questions, then your plan begins.
          </p>
        </div>
        <Button asChild size="xl" className="w-full">
          <Link href="/onboarding/account">
            Begin
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </StepShell>
  );
}
