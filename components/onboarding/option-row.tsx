"use client";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function OptionRow({
  label,
  description,
  selected,
  onSelect,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary bg-primary/[0.06]"
          : "border-border/60 bg-card hover:bg-secondary/40",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-primary bg-primary" : "border-border",
        )}
        aria-hidden
      >
        {selected ? <Check className="size-3.5 text-primary-foreground" /> : null}
      </span>
      <span className="flex-1">
        <span className="block font-medium leading-tight">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}
