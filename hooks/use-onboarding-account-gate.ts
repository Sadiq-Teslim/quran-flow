"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingDraft } from "@/hooks/use-onboarding-draft";
import { useUser } from "@/hooks/use-user";

export function useOnboardingAccountGate() {
  const router = useRouter();
  const hasHydrated = useOnboardingDraft((state) => state.hasHydrated);
  const setDraft = useOnboardingDraft((state) => state.set);
  const user = useUser();
  const hasRealAccount = Boolean(user.data && !user.data.isAnonymous);

  useEffect(() => {
    if (hasRealAccount) {
      setDraft({ accountCreated: true });
    }
  }, [hasRealAccount, setDraft]);

  useEffect(() => {
    if (!hasHydrated || user.isLoading) return;
    if (!hasRealAccount) router.replace("/onboarding/account");
  }, [hasHydrated, hasRealAccount, router, user.isLoading]);

  return {
    canContinue: hasRealAccount,
    isCheckingAccount: !hasHydrated || user.isLoading,
  };
}
