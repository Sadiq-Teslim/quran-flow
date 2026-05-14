"use client";

import { useState } from "react";
import { Mic, Send } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  useSubmitTajweedFeedback,
  useTajweedFeedback,
  useTajweedLessons,
} from "@/hooks/use-tajweed";

export default function TajweedPage() {
  const auth = useAuth();
  const lessons = useTajweedLessons();
  const feedback = useTajweedFeedback();
  const submit = useSubmitTajweedFeedback();
  const [notes, setNotes] = useState("");
  const [score, setScore] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  async function handleSubmit() {
    if (!auth.isAuthenticated) {
      toast.error("Sign in to save tajweed feedback.");
      return;
    }
    try {
      await submit.mutateAsync({
        audioUrl: audioUrl.trim() || undefined,
        score: score ? Number(score) : undefined,
        notes: notes.trim() || undefined,
      });
      setNotes("");
      setScore("");
      setAudioUrl("");
      toast.success("Tajweed feedback saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save feedback.");
    }
  }

  return (
    <div className="pb-6">
      <ScreenHeader title="Tajweed" subtitle="Recitation lessons and feedback" />
      <div className="space-y-6 px-5 sm:px-6">
        <section className="space-y-3">
          <h2 className="font-serif text-xl leading-tight">Lessons</h2>
          {lessons.isLoading ? (
            <Skeleton className="h-28 w-full rounded-lg" />
          ) : lessons.data?.length ? (
            <div className="space-y-3">
              {lessons.data.map((lesson) => (
                <Card key={lesson.id} className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-accent">
                    {lesson.difficulty} - {lesson.exampleVerseRef}
                  </p>
                  <p className="mt-1 font-serif text-xl leading-tight">{lesson.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {lesson.description}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-5 text-sm text-muted-foreground">
              No tajweed lessons yet.
            </Card>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl leading-tight">Submit feedback</h2>
          <Card className="space-y-3 p-5">
            <Input
              value={audioUrl}
              onChange={(event) => setAudioUrl(event.target.value)}
              placeholder="Audio URL"
            />
            <Input
              value={score}
              onChange={(event) => setScore(event.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="Pronunciation score"
              inputMode="numeric"
            />
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes from recitation practice"
              className="min-h-28 resize-none"
            />
            <Button className="w-full" disabled={submit.isPending} onClick={handleSubmit}>
              <Send className="size-4" aria-hidden />
              Submit feedback
            </Button>
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl leading-tight">My feedback</h2>
          {feedback.isLoading ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : feedback.data?.length ? (
            <div className="space-y-3">
              {feedback.data.map((item) => (
                <Card key={item.id} className="p-5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mic className="size-4" aria-hidden />
                    <p className="text-xs uppercase tracking-wider">
                      Score {item.pronunciationScore ?? "pending"}
                    </p>
                  </div>
                  <p className="mt-2 font-serif text-base leading-relaxed">
                    {item.feedbackSummary ?? item.notes ?? "Feedback submitted."}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-5 text-sm text-muted-foreground">
              No feedback yet.
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
