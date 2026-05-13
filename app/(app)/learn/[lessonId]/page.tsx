"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { useLesson, useMarkLessonComplete } from "@/hooks/use-learn";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = use(params);
  const router = useRouter();
  const lesson = useLesson(lessonId);
  const mark = useMarkLessonComplete();

  async function handleComplete() {
    try {
      await mark.mutateAsync(lessonId);
      toast.success("Marked complete");
      router.push("/learn");
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  }

  return (
    <div className="pb-44">
      <ScreenHeader title="Lesson" back />
      <div className="space-y-6 px-5 pr-14 sm:px-6">
        {lesson.isLoading || !lesson.data ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-accent">
                Stage {lesson.data.stage} · {lesson.data.stageName}
              </p>
              <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight">
                {lesson.data.title}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-3.5" aria-hidden />
                {lesson.data.minutes} min read
              </p>
            </div>
            <p className="font-serif text-lg italic leading-relaxed text-muted-foreground">
              {lesson.data.summary}
            </p>
            <article className="space-y-5 font-serif text-[17px] leading-[1.85] text-foreground">
              {lesson.data.body.split("\n\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </article>
          </>
        )}
      </div>
      {lesson.data ? (
        <div
          className="fixed inset-x-0 z-30 mx-auto max-w-[480px] border-t border-border/60 bg-background/95 p-4 backdrop-blur"
          style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
        >
          <Button
            size="xl"
            className="w-full"
            disabled={lesson.data.completed || mark.isPending}
            onClick={handleComplete}
          >
            {lesson.data.completed ? (
              <>
                <Check className="size-4" aria-hidden />
                Completed
              </>
            ) : mark.isPending ? (
              "Saving…"
            ) : (
              "Mark complete"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
