"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReflection } from "@/hooks/use-reflections";

function NewReflectionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const surah = params.get("surah");
  const ayah = params.get("ayah");
  const verseRef =
    surah && ayah ? { surah: Number(surah), ayah: Number(ayah) } : null;

  const [title, setTitle] = useState(verseRef ? `On ${verseRef.surah}:${verseRef.ayah}` : "");
  const [body, setBody] = useState("");
  const create = useCreateReflection();

  async function handleSave() {
    if (!title.trim() || !body.trim()) {
      toast.error("Add a title and a few words.");
      return;
    }
    try {
      await create.mutateAsync({ title: title.trim(), body: body.trim(), verseRef });
      toast.success("Saved.");
      router.push("/reflect");
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  }

  return (
    <div className="pb-44">
      <ScreenHeader
        title="New reflection"
        back
        subtitle={
          verseRef ? `Anchored to ${verseRef.surah}:${verseRef.ayah}` : "Free reflection"
        }
      />
      <div className="space-y-4 px-5 sm:px-6">
        <div className="space-y-2">
          <label
            htmlFor="title"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="A title for what you're carrying"
            className="font-serif text-lg"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="body"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            Reflection
          </label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What stayed with you? What did the verse ask of you today?"
            className="min-h-[280px] resize-none font-serif text-base leading-relaxed"
          />
        </div>
      </div>
      <div
        className="fixed inset-x-0 z-30 mx-auto max-w-[480px] border-t border-border/60 bg-background/95 p-4 backdrop-blur"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
      >
        <Button
          size="xl"
          className="w-full"
          disabled={create.isPending}
          onClick={handleSave}
        >
          {create.isPending ? "Saving…" : "Save reflection"}
        </Button>
      </div>
    </div>
  );
}

export default function NewReflectionPage() {
  return (
    <Suspense fallback={null}>
      <NewReflectionForm />
    </Suspense>
  );
}
