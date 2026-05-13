"use client";

import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { useState } from "react";
import { useTodayPlan } from "@/hooks/use-today-plan";
import { useChapters, useReadingHistory, useVerseSearch } from "@/hooks/use-quran";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DayPlanCard } from "@/components/day-plan-card";

export default function ReadIndex() {
  const { data, isLoading } = useTodayPlan();
  const [query, setQuery] = useState("");
  const chapters = useChapters();
  const search = useVerseSearch(query);
  const history = useReadingHistory();

  return (
    <div className="pb-6">
      <ScreenHeader title="Read" subtitle="Today's path through the Mushaf" />
      <div className="space-y-6 px-5 sm:px-6">
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : data ? (
          <DayPlanCard plan={data} />
        ) : (
          <Card className="p-5 text-sm text-muted-foreground">
            Something didn&apos;t load.
          </Card>
        )}

        <section className="space-y-3">
          <h2 className="font-serif text-xl leading-tight">Search verses</h2>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search meaning, Arabic, or tafsir"
              className="pl-10"
            />
          </div>
          {query.trim().length >= 2 ? (
            search.isLoading ? (
              <Skeleton className="h-28 w-full rounded-2xl" />
            ) : search.data?.length ? (
              <div className="space-y-3">
                {search.data.map((verse) => (
                  <Link
                    key={`${verse.surah}:${verse.ayah}`}
                    href={`/read/${verse.surah}/${verse.ayah}`}
                    className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Card className="p-5 transition-colors hover:bg-secondary/40">
                      <p className="text-xs font-medium uppercase tracking-wider text-accent">
                        {verse.surahName} · {verse.surah}:{verse.ayah}
                      </p>
                      <p className="mt-2 line-clamp-2 font-serif text-sm leading-relaxed">
                        {verse.translation}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-5 text-sm text-muted-foreground">
                No verses found yet.
              </Card>
            )
          ) : null}
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl leading-tight">Browse chapters</h2>
          {chapters.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(chapters.data ?? []).slice(0, 12).map((chapter) => (
                <Link
                  key={chapter.id}
                  href={`/read/${chapter.number}/1`}
                  className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-secondary/40">
                    <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-sm font-medium">
                      {chapter.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif leading-tight">{chapter.nameEnglish}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {chapter.meaning ?? chapter.revelationType} · {chapter.verseCount} verses
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl leading-tight">Reading history</h2>
          {history.isLoading ? (
            <Skeleton className="h-20 w-full rounded-2xl" />
          ) : history.data?.items.length ? (
            <div className="space-y-2">
              {history.data.items.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/read/${item.chapterId}/${item.startVerse}`}
                  className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card className="p-4 transition-colors hover:bg-secondary/40">
                    <p className="font-medium leading-tight">
                      Surah {item.chapterId}:{item.startVerse}-{item.endVerse}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.versesCompleted} verses · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-5 text-sm text-muted-foreground">
              No reading history yet. Open a verse and your completed readings
              will appear here.
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
