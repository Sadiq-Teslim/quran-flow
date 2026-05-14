"use client";

import Link from "next/link";
import { Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useFallbackCheckin,
  useGeneratePlan,
  usePersonalize,
  useRecommendations,
} from "@/hooks/use-personalization";
import { useAuth } from "@/hooks/use-auth";
import { useStartReEntry } from "@/hooks/use-streak";

export default function PlanPage() {
  const auth = useAuth();
  const generate = useGeneratePlan();
  const personalize = usePersonalize();
  const reEntry = useStartReEntry();
  const recommendations = useRecommendations();
  const checkin = useFallbackCheckin();

  async function handleGenerate() {
    if (!auth.isAuthenticated) {
      toast.error("Sign in to generate a plan.");
      return;
    }
    try {
      const plan = await generate.mutateAsync("QuranFlow Daily Plan");
      toast.success(`${plan.versesPerDay} verses per day. Plan generated.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't generate a plan.");
    }
  }

  async function handlePersonalize() {
    if (!auth.isAuthenticated) {
      toast.error("Sign in to personalize your plan.");
      return;
    }
    try {
      const bundle = await personalize.mutateAsync({
        planName: "QuranFlow Personalized Plan",
        recommendationLimit: 3,
      });
      toast.success(`${bundle.plan.versesPerDay} verses/day with recommendations.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't personalize.");
    }
  }

  async function handleReEntry() {
    if (!auth.isAuthenticated) {
      toast.error("Sign in to restart your plan.");
      return;
    }
    try {
      const entry = await reEntry.mutateAsync("manual_restart");
      toast.success(`${entry.plan.versesPerDay} verses/day. Welcome back.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't start re-entry.");
    }
  }

  return (
    <div className="pb-6">
      <ScreenHeader title="Plan" subtitle="Personalization and re-entry" />
      <div className="space-y-6 px-5 sm:px-6">
        <Card className="bg-gradient-to-b from-primary/[0.06] to-transparent p-6">
          <div className="flex items-center gap-2 text-primary">
            <Wand2 className="size-4" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wider">
              AI reading plan
            </p>
          </div>
          <p className="mt-3 font-serif text-2xl leading-tight">
            Generate a plan from your profile and habit history.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            QuranFlow adjusts daily verse targets, difficulty, and reading time
            around your profile.
          </p>
          <Button
            className="mt-5 w-full"
            disabled={generate.isPending}
            onClick={handleGenerate}
          >
            <Sparkles className="size-4" aria-hidden />
            {generate.isPending ? "Generating..." : "Generate plan"}
          </Button>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              disabled={personalize.isPending}
              onClick={handlePersonalize}
            >
              {personalize.isPending ? "Working..." : "One-shot AI"}
            </Button>
            <Button
              variant="secondary"
              disabled={reEntry.isPending}
              onClick={handleReEntry}
            >
              {reEntry.isPending ? "Restarting..." : "Re-entry"}
            </Button>
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="font-serif text-xl leading-tight">Fallback check-in</h2>
          {checkin.isLoading ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : (
            <Card className="p-5 font-serif text-base italic leading-relaxed">
              {checkin.data}
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl leading-tight">Recommended learning</h2>
          {recommendations.isLoading ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : recommendations.data?.length ? (
            <div className="space-y-3">
              {recommendations.data.map((item) => (
                <Link
                  key={item.id}
                  href={`/learn/${item.id}`}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="p-5 transition-colors hover:bg-secondary/40">
                    <p className="text-xs font-medium uppercase tracking-wider text-accent">
                      {item.stage}
                    </p>
                    <p className="mt-1 font-serif text-lg leading-tight">{item.title}</p>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    ) : null}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-5 text-sm text-muted-foreground">
              No recommendations yet. Complete more reading or learning sessions
              and check back here.
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
