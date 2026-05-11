"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, PenLine } from "lucide-react";
import { useVerse, useNextVerse, usePrevVerse } from "@/hooks/use-verse";
import { useVerseLocalizations } from "@/hooks/use-quran";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VerseBlock } from "@/components/reading/verse-block";
import { InsightCard } from "@/components/reading/insight-card";

export default function VersePage({
  params,
}: {
  params: Promise<{ surah: string; ayah: string }>;
}) {
  const { surah: surahStr, ayah: ayahStr } = use(params);
  const surah = Number(surahStr);
  const ayah = Number(ayahStr);

  const verse = useVerse(surah, ayah);
  const next = useNextVerse(surah, ayah);
  const prev = usePrevVerse(surah, ayah);

  return (
    <div className="mx-auto max-w-2xl px-5 pb-24 pt-6 sm:px-8">
      <header className="mb-8 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link href="/home" aria-label="Back home">
            <ChevronLeft className="size-4" aria-hidden />
            Home
          </Link>
        </Button>
        {verse.data ? (
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {verse.data.surahName} · {verse.data.surah}:{verse.data.ayah}
          </span>
        ) : null}
      </header>

      {verse.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="mx-auto h-10 w-10 rounded-full" />
          <Skeleton className="mx-auto h-24 w-full" />
          <Skeleton className="mx-auto h-4 w-2/3" />
          <Skeleton className="mx-auto h-20 w-full" />
        </div>
      ) : verse.data ? (
        <>
          <VerseBlock verse={verse.data} />
          <div className="mt-10 space-y-4">
            {verse.data.lesson ? (
              <InsightCard tone="lesson">{verse.data.lesson}</InsightCard>
            ) : null}
            {verse.data.takeaway ? (
              <InsightCard tone="takeaway">{verse.data.takeaway}</InsightCard>
            ) : null}
            {verse.data.relatedDua ? (
              <InsightCard tone="dua" arabic>
                {verse.data.relatedDua}
              </InsightCard>
            ) : null}
          </div>
          <VerseLocalizations verseId={verse.data.id} />
          <div className="mt-10 flex items-center justify-between gap-3">
            <Button
              asChild
              variant="secondary"
              size="lg"
              disabled={!prev.data}
              className="flex-1"
            >
              {prev.data ? (
                <Link href={`/read/${prev.data.surah}/${prev.data.ayah}`}>
                  <ChevronLeft className="size-4" aria-hidden />
                  Previous
                </Link>
              ) : (
                <span className="opacity-50">Previous</span>
              )}
            </Button>
            <Button asChild size="lg" disabled={!next.data} className="flex-1">
              {next.data ? (
                <Link href={`/read/${next.data.surah}/${next.data.ayah}`}>
                  Next
                  <ChevronRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <span className="opacity-50">End</span>
              )}
            </Button>
          </div>
          <div className="mt-4">
            <Button asChild variant="ghost" className="w-full">
              <Link
                href={`/reflect/new?surah=${verse.data.surah}&ayah=${verse.data.ayah}`}
              >
                <PenLine className="size-4" aria-hidden />
                Reflect on this verse
              </Link>
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-8 text-center">
          <p className="font-serif text-lg">This verse didn&apos;t load.</p>
          <Button
            variant="ghost"
            className="mt-3"
            onClick={() => verse.refetch()}
          >
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

function VerseLocalizations({ verseId }: { verseId?: number }) {
  const localizations = useVerseLocalizations(verseId);

  if (!verseId) return null;
  if (localizations.isLoading) {
    return <Skeleton className="mt-8 h-24 w-full rounded-2xl" />;
  }
  if (!localizations.data?.length) return null;

  return (
    <section className="mt-8 space-y-3">
      <h2 className="font-serif text-xl leading-tight">Local explanations</h2>
      {localizations.data.map((item) => (
        <Card key={item.id} className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            {item.language} · {item.kind} · {item.reviewStatus}
          </p>
          <p className="mt-2 font-serif text-base leading-relaxed">{item.content}</p>
        </Card>
      ))}
    </section>
  );
}
