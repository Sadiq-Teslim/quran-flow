"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScreenHeader({
  title,
  subtitle,
  back = false,
  right,
  className,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-3 px-5 pb-4 pt-6 sm:px-6",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {back ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="-ml-2 inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Go back"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
        ) : null}
        <div>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {right}
    </header>
  );
}
