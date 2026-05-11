"use client";

import { use } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useReflection } from "@/hooks/use-reflections";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function ReflectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useReflection(id);

  return (
    <div className="pb-6">
      <ScreenHeader title="Reflection" back />
      <div className="space-y-6 px-5 sm:px-6">
        {isLoading || !data ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {new Date(data.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1 className="mt-2 font-serif text-3xl leading-tight">
                {data.title}
              </h1>
            </div>
            {data.verseRef ? (
              <Button asChild variant="secondary" size="sm">
                <Link href={`/read/${data.verseRef.surah}/${data.verseRef.ayah}`}>
                  <BookOpen className="size-4" aria-hidden />
                  Open {data.verseRef.surah}:{data.verseRef.ayah}
                </Link>
              </Button>
            ) : null}
            <article className="space-y-5 font-serif text-[17px] leading-[1.85]">
              {data.body.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </article>
          </>
        )}
      </div>
    </div>
  );
}
