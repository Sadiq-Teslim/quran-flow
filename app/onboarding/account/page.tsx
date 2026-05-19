"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { StepShell } from "@/components/onboarding/step-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useOnboardingDraft } from "@/hooks/use-onboarding-draft";
import { useUser } from "@/hooks/use-user";
import { ApiError } from "@/lib/api/client";
import { createOnboardingAccount, login } from "@/lib/services/auth.service";

type AccountMode = "signup" | "login";

type AccountPayload = {
  mode: AccountMode;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export default function AccountStep() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setDraft = useOnboardingDraft((state) => state.set);
  const user = useUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AccountMode>("signup");
  const hasRealAccount = Boolean(user.data && !user.data.isAnonymous);

  const createAccount = useMutation({
    mutationFn: (payload: AccountPayload) =>
      payload.mode === "signup"
        ? createOnboardingAccount({
            email: payload.email,
            password: payload.password,
            firstName: payload.firstName,
            lastName: payload.lastName,
            userType: "beginner",
          })
        : login({ email: payload.email, password: payload.password }),
    onSuccess: async () => {
      setDraft({ accountCreated: true });
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/onboarding/frequency");
    },
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await createAccount.mutateAsync({
        mode,
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setMode("login");
        toast.error("That email already has an account. Sign in to continue.");
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't create your QuranFlow account.",
      );
    }
  }

  const disabled =
    createAccount.isPending ||
    user.isLoading ||
    (mode === "signup" && (!firstName.trim() || !lastName.trim())) ||
    !email.trim() ||
    password.length < 8;
  const isSignup = mode === "signup";

  return (
    <StepShell step={2} total={7}>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Step 2 of 7
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight">
              {isSignup ? "Create your QuranFlow account." : "Sign in to QuranFlow."}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {isSignup
                ? "Your reading plan, reflections, and progress should belong to you from the start."
                : "Continue with the account that already holds your journey."}
            </p>
          </div>

          <Card className="p-5">
            {hasRealAccount ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 size-5 text-accent" aria-hidden />
                  <div>
                    <p className="text-sm font-medium">Your account is ready.</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      You&apos;re signed in as {user.data?.email}. Continue to build
                      your personalized plan.
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="xl"
                  onClick={() => {
                    setDraft({ accountCreated: true });
                    router.push("/onboarding/frequency");
                  }}
                >
                  Continue
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 size-5 text-accent" aria-hidden />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {isSignup
                      ? "We'll save your journey before personalizing your daily plan."
                      : "Use your existing account to continue onboarding."}
                  </p>
                </div>
                <form className="space-y-3" onSubmit={handleSubmit}>
                  {isSignup ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="First name"
                        autoComplete="given-name"
                        required
                      />
                      <Input
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder="Last name"
                        autoComplete="family-name"
                        required
                      />
                    </div>
                  ) : null}
                  <Input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                  <Input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password, at least 8 characters"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <Button className="w-full" disabled={disabled} size="xl" type="submit">
                    {createAccount.isPending
                      ? isSignup
                        ? "Creating account..."
                        : "Signing in..."
                      : isSignup
                        ? "Join QuranFlow"
                        : "Sign in and continue"}
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                  <Button
                    className="w-full"
                    disabled={createAccount.isPending}
                    onClick={() => setMode(isSignup ? "login" : "signup")}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    {isSignup
                      ? "Already have an account? Sign in"
                      : "Need a new account? Create one"}
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </StepShell>
  );
}
