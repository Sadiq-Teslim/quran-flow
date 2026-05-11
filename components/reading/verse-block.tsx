import { cn } from "@/lib/utils";
import type { Verse } from "@/lib/services/reading.service";

export function VerseBlock({ verse, className }: { verse: Verse; className?: string }) {
  return (
    <article
      className={cn("flex flex-col gap-6", className)}
      aria-label={`Surah ${verse.surahName} verse ${verse.ayah}`}
    >
      <div className="flex items-center justify-center">
        <span
          className="inline-flex size-10 items-center justify-center rounded-full border border-accent/40 text-sm font-medium text-accent"
          aria-label={`Verse ${verse.ayah}`}
        >
          {verse.ayah}
        </span>
      </div>
      <p
        lang="ar"
        dir="rtl"
        className="text-center text-[28px] leading-[2.4] sm:text-[34px]"
      >
        {verse.arabic}
      </p>
      <p className="text-center text-sm italic text-muted-foreground">
        {verse.transliteration}
      </p>
      <div className="mx-auto h-px w-12 bg-border/80" />
      <p className="font-serif text-base leading-[1.85] text-foreground sm:text-lg">
        {verse.translation}
      </p>
    </article>
  );
}
