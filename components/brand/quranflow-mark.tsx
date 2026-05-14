import Image from "next/image";
import { cn } from "@/lib/utils";

export function QuranFlowMark({
  className,
  showWordmark = false,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <Image
      src={showWordmark ? "/quranflow-logo.png" : "/quranflow-icon.png"}
      alt="QuranFlow"
      width={showWordmark ? 190 : 48}
      height={showWordmark ? 143 : 48}
      priority
      className={cn(
        showWordmark ? "h-auto w-44" : "size-12 rounded-lg",
        className,
      )}
    />
  );
}
