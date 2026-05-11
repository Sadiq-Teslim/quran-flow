"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";

export default function OnboardingWelcome() {
  return (
    <StepShell step={1} total={6}>
      <div className="flex flex-1 flex-col">
        <div className="flex-1">
          <p
            lang="ar"
            dir="rtl"
            className="mb-6 text-center text-3xl text-accent [font-family:var(--font-arabic),serif]"
          >
            ٱلسَّلَامُ عَلَيْكُمْ
          </p>
          <h1 className="font-serif text-[40px] leading-[1.1] tracking-tight">
            As-salāmu ʿalaykum.
            <br />
            <span className="text-muted-foreground">
              Let&apos;s shape your journey.
            </span>
          </h1>
          <p className="mt-6 font-serif text-lg leading-relaxed text-muted-foreground">
            QuranFlow is a quiet companion — built so the Quran becomes a daily
            presence in your life, not a Ramadan-only visitor.
          </p>
          <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
            A few questions, then we begin.
          </p>
        </div>
        <Button asChild size="xl" className="w-full">
          <Link href="/onboarding/frequency">
            Begin
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </StepShell>
  );
}
