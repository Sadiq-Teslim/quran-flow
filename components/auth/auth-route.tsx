"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QuranFlowMark } from "@/components/brand/quranflow-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useOnboardingDraft } from "@/hooks/use-onboarding-draft";
import { useUser } from "@/hooks/use-user";
import { ApiError } from "@/lib/api/client";

type AuthMode = "login" | "signup";

export function AuthRoute({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();
  const user = useUser();
  const queryClient = useQueryClient();
  const setDraft = useOnboardingDraft((state) => state.set);
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const nextPath = useMemo(() => sanitizeNextPath(params.get("next")), [params]);
  const isSignup = mode === "signup";
  const isPending = auth.login.isPending || auth.signup.isPending;
  const hasRealAccount = Boolean(user.data && !user.data.isAnonymous);

  useEffect(() => {
    if (!hasRealAccount) return;
    if (nextPath.startsWith("/onboarding")) {
      setDraft({ accountCreated: true });
    }
  }, [hasRealAccount, nextPath, setDraft]);

  async function completeAuth() {
    if (nextPath.startsWith("/onboarding")) {
      setDraft({ accountCreated: true });
    }
    await queryClient.invalidateQueries({ queryKey: ["user"] });
    router.replace(nextPath);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (isSignup) {
        await auth.signup.mutateAsync({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          userType: "beginner",
        });
        toast.success("Account created.");
      } else {
        await auth.login.mutateAsync({ email: email.trim(), password });
        toast.success("Welcome back.");
      }
      await completeAuth();
    } catch (error) {
      if (isSignup && error instanceof ApiError && error.status === 409) {
        toast.error("That email already has an account. Sign in instead.");
        router.replace(`/login?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(email.trim())}`);
        return;
      }
      toast.error(error instanceof Error ? error.message : "Couldn't continue.");
    }
  }

  const disabled =
    isPending ||
    user.isLoading ||
    !email.trim() ||
    password.length < (isSignup ? 8 : 1) ||
    (isSignup && (!firstName.trim() || !lastName.trim()));

  return (
    <main className="mx-auto flex min-h-svh max-w-[480px] flex-col px-5 py-8 sm:px-6">
      <div className="mb-8 flex justify-center">
        <QuranFlowMark showWordmark className="text-primary" />
      </div>

      <div className="flex flex-1 flex-col justify-center pb-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            QuranFlow account
          </p>
          <h1 className="mt-2 font-serif text-3xl leading-tight tracking-tight">
            {isSignup ? "Create your account." : "Sign in to QuranFlow."}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {isSignup
              ? "Save your plan, reflections, and progress from the beginning."
              : "Continue your reading plan, reflections, and progress."}
          </p>
        </div>

        <Card className="p-5">
          {hasRealAccount ? (
            <div className="space-y-4">
              <div>
                <p className="font-medium leading-tight">You&apos;re signed in.</p>
                <p className="mt-1 text-sm text-muted-foreground">{user.data?.email}</p>
              </div>
              <Button className="w-full" size="xl" onClick={completeAuth}>
                Continue
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          ) : (
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
                placeholder={isSignup ? "Password, at least 8 characters" : "Password"}
                type="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={isSignup ? 8 : 1}
                required
              />
              <Button className="w-full" disabled={disabled} size="xl" type="submit">
                {isPending
                  ? isSignup
                    ? "Creating account..."
                    : "Signing in..."
                  : isSignup
                    ? "Create account"
                    : "Sign in"}
                {isSignup ? (
                  <UserPlus className="size-4" aria-hidden />
                ) : (
                  <LogIn className="size-4" aria-hidden />
                )}
              </Button>
            </form>
          )}
        </Card>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "New to QuranFlow?"}{" "}
          <Link
            href={`${isSignup ? "/login" : "/signup"}?next=${encodeURIComponent(nextPath)}${email.trim() ? `&email=${encodeURIComponent(email.trim())}` : ""}`}
            className="font-medium text-primary"
          >
            {isSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </main>
  );
}

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/home";
  return value;
}
