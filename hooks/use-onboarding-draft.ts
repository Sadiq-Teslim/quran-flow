"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingDraft = {
  frequency?: string;
  struggles?: string[];
  preferredTime?: string;
  motivation?: string;
  category?: string;
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
          frequency: undefined,
          struggles: undefined,
          preferredTime: undefined,
          motivation: undefined,
          category: undefined,
        }),
      setHasHydrated: (value) => setState({ hasHydrated: value }),
    }),
    {
      name: "qf-onboarding-draft",
      partialize: ({ frequency, struggles, preferredTime, motivation, category }) => ({
        frequency,
        struggles,
        preferredTime,
        motivation,
        category,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
