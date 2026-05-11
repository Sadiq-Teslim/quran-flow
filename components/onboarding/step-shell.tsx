import { cn } from "@/lib/utils";

export function StepShell({
  step,
  total,
  children,
  className,
}: {
  step: number;
  total: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex min-h-svh max-w-[480px] flex-col px-5 sm:px-6", className)}>
      <div className="flex items-center gap-2 pt-8" aria-label={`Step ${step} of ${total}`}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i < step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
      <main className="flex flex-1 flex-col pb-8 pt-10">{children}</main>
    </div>
  );
}
