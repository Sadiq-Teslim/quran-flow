"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingDraft } from "@/hooks/use-onboarding-draft";
import { useUser } from "@/hooks/use-user";

export function useOnboardingAccountGate() {
  const router = useRouter();
  const accountCreated = useOnboardingDraft((state) => state.accountCreated);
  const hasHydrated = useOnboardingDraft((state) => state.hasHydrated);
  const setDraft = useOnboardingDraft((state) => state.set);
  const user = useUser();
  const hasRealAccount = Boolean(user.data && !user.data.isAnonymous);
  const canContinue = Boolean(accountCreated || hasRealAccount);

  useEffect(() => {
    if (hasRealAccount && !accountCreated) {
      setDraft({ accountCreated: true });
    }
  }, [accountCreated, hasRealAccount, setDraft]);

  useEffect(() => {
    if (!hasHydrated || user.isLoading) return;
    if (!canContinue) router.replace("/onboarding/account");
  }, [canContinue, hasHydrated, router, user.isLoading]);

  return {
    canContinue,
    isCheckingAccount: !hasHydrated || user.isLoading,
  };
}
