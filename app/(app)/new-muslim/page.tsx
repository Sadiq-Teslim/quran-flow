"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useGuidedContent } from "@/hooks/use-new-muslim";

export default function NewMuslimPage() {
  const auth = useAuth();
  const guided = useGuidedContent();

  return (
    <div className="pb-6">
      <ScreenHeader title="New Muslim" subtitle="Guided foundation path" />
      <div className="space-y-6 px-5 sm:px-6">
        {!auth.isAuthenticated ? (
          <EmptyState
            icon={Compass}
            title="Sign in to continue"
            description="Your guided foundation path will be shaped around your profile."
          />
        ) : guided.isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : guided.data ? (
          <>
            <Card className="bg-gradient-to-b from-accent/[0.08] to-transparent p-6">
              <p className="font-serif text-2xl leading-tight">
                {guided.data.welcomeMessage}
              </p>
            </Card>

            <section className="space-y-3">
              <h2 className="font-serif text-xl leading-tight">Starter verses</h2>
              {guided.data.starterVerses.map((verse) => (
                <Link
                  key={verse.id}
                  href={`/read/${verse.chapterId}/${verse.verseNumber}`}
                  className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="p-5 transition-colors hover:bg-secondary/40">
                    <p className="text-xs font-medium uppercase tracking-wider text-accent">
                      {verse.chapterId}:{verse.verseNumber}
                    </p>
                    <p className="mt-2 font-serif text-base leading-relaxed">
                      {verse.textEnglish}
                    </p>
                  </Card>
                </Link>
              ))}
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl leading-tight">Foundation modules</h2>
              {guided.data.modules.map((module) => (
                <Link
                  key={module.id}
                  href={`/learn/${module.id}`}
                  className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="p-5 transition-colors hover:bg-secondary/40">
                    <p className="text-xs font-medium uppercase tracking-wider text-accent">
                      {module.stage}
                    </p>
                    <p className="mt-1 font-serif text-lg leading-tight">
                      {module.title}
                    </p>
                    {module.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {module.description}
                      </p>
                    ) : null}
                  </Card>
                </Link>
              ))}
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl leading-tight">Next steps</h2>
              <Card className="space-y-3 p-5">
                {guided.data.nextSteps.map((step) => (
                  <p key={step} className="text-sm leading-relaxed text-muted-foreground">
                    {step}
                  </p>
                ))}
              </Card>
            </section>
          </>
        ) : (
          <EmptyState
            icon={Compass}
            title="No guide yet"
            description="Your foundation guide is not ready yet. Check back after your profile updates."
          />
        )}
      </div>
    </div>
  );
}
