"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-[480px] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-serif text-2xl">Something didn&apos;t load.</p>
      <p className="text-sm text-muted-foreground">
        Take a breath. Try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
