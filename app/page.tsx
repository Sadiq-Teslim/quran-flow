"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuranFlowMark } from "@/components/brand/quranflow-mark";
import { useUser } from "@/hooks/use-user";

export default function Index() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;
    if (user?.onboarded) router.replace("/home");
    else router.replace("/onboarding");
  }, [user?.onboarded, isLoading, router]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <QuranFlowMark showWordmark className="text-primary" />
    </div>
  );
}
