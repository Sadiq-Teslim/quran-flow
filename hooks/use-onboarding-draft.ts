"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingDraft = {
  accountCreated?: boolean;
  frequency?: string;
  struggles?: string[];
  preferredTime?: string;
  motivation?: string;
};

type Store = OnboardingDraft & {
  hasHydrated: boolean;
  set: (patch: Partial<OnboardingDraft>) => void;
  reset: () => void;
  setHasHydrated: (value: boolean) => void;
};

export const useOnboardingDraft = create<Store>()(
  persist(
    (setState) => ({
      hasHydrated: false,
      set: (patch) => setState(patch),
      reset: () =>
        setState({
          accountCreated: undefined,
          frequency: undefined,
          struggles: undefined,
          preferredTime: undefined,
          motivation: undefined,
        }),
      setHasHydrated: (value) => setState({ hasHydrated: value }),
    }),
    {
      name: "qf-onboarding-draft",
      partialize: ({
        accountCreated,
        frequency,
        struggles,
        preferredTime,
        motivation,
      }) => ({
        accountCreated,
        frequency,
        struggles,
        preferredTime,
        motivation,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
