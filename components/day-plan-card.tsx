"use client";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { TodayPlan } from "@/lib/services/reading.service";

const anchorLabel: Record<TodayPlan["anchor"], string> = {
  after_fajr: "after Fajr",
  morning: "in the morning",
  afternoon: "this afternoon",
  maghrib: "after Maghrib",
  before_sleep: "before sleep",
};

export function DayPlanCard({ plan }: { plan: TodayPlan }) {
  const verseCount = plan.endAyah - plan.startAyah + 1;
  return (
    <Card className="overflow-hidden bg-gradient-to-b from-primary/[0.04] to-transparent p-6">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Today&apos;s reading
          </p>
          <h2 className="mt-1 font-serif text-2xl leading-tight">
            {plan.surahName} · {verseCount} verses
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            ~{plan.estimatedMinutes} min · {anchorLabel[plan.anchor]}
          </p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href={`/read/${plan.surah}/${plan.startAyah}`}>
            Begin
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
