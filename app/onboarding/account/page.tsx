"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { createOnboardingAccount } from "@/lib/services/auth.service";

type AccountPayload = {
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
  const hasRealAccount = Boolean(user.data && !user.data.isAnonymous);

  const createAccount = useMutation({
    mutationFn: (payload: AccountPayload) =>
      createOnboardingAccount({
        email: payload.email,
        password: payload.password,
        firstName: payload.firstName,
        lastName: payload.lastName,
        userType: "beginner",
      }),
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
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("That email already has an account. Sign in to continue.");
        router.push(
          `/login?next=${encodeURIComponent("/onboarding/frequency")}&email=${encodeURIComponent(email.trim())}`,
        );
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
    !firstName.trim() ||
    !lastName.trim() ||
    !email.trim() ||
    password.length < 8;

  return (
    <StepShell step={2} total={7}>
      <div className="flex flex-1 flex-col">
        <div className="flex-1 space-y-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Step 2 of 7
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight">
              Create your QuranFlow account.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Your reading plan, reflections, and progress should belong to you
              from the start.
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
                    We&apos;ll save your journey before personalizing your daily plan.
                  </p>
                </div>
                <form className="space-y-3" onSubmit={handleSubmit}>
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
                      ? "Creating account..."
                      : "Join QuranFlow"}
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                  <Button
                    asChild
                    className="w-full"
                    size="sm"
                    variant="ghost"
                  >
                    <Link href="/login?next=%2Fonboarding%2Ffrequency">
                      Already have an account? Sign in
                    </Link>
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
