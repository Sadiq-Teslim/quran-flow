"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import {
  Activity,
  Bell,
  ChevronRight,
  Compass,
  Globe,
  Handshake,
  Languages,
  LockKeyhole,
  LogIn,
  LogOut,
  Mic,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IdentityBadge } from "@/components/identity-badge";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const user = useUser();
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="pb-6">
      <ScreenHeader title="Profile" />
      <div className="space-y-6 px-5 sm:px-6">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div
              className="flex size-14 items-center justify-center rounded-full bg-primary/10 font-serif text-2xl text-primary"
              aria-hidden
            >
              {user.data?.name?.[0] ?? "·"}
            </div>
            <div className="min-w-0 flex-1">
              {user.isLoading || !user.data ? (
                <>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="mt-2 h-4 w-40" />
                </>
              ) : (
                <>
                  <p className="font-serif text-lg leading-tight">{user.data.name}</p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {user.data.email}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {auth.isAuthenticated ? "Your QuranFlow account" : "Local profile"}
                  </p>
                </>
              )}
            </div>
          </div>
          {user.data ? (
            <div className="mt-4">
              <IdentityBadge label={user.data.identity} />
            </div>
          ) : null}
        </Card>

        <AuthPanel
          isAuthenticated={auth.isAuthenticated}
          onLogin={auth.login.mutateAsync}
          onSignup={auth.signup.mutateAsync}
          onLogout={auth.logout.mutateAsync}
          onAnonymous={auth.anonymous.mutateAsync}
          isPending={
            auth.login.isPending ||
            auth.signup.isPending ||
            auth.logout.isPending ||
            auth.anonymous.isPending
          }
        />

        {auth.isAuthenticated ? <SecurityPanel auth={auth} /> : null}

        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Connected systems
          </h2>
          <Card className="divide-y divide-border/60">
            <Row
              icon={Sparkles}
              title="Plan and AI"
              detail="Generate plans, recommendations, re-entry check-ins"
              href="/plan"
            />
            <Row
              icon={Bell}
              title="Notifications"
              detail="Reminders, nudges, and settings"
              href="/notifications"
            />
            <Row
              icon={Handshake}
              title="Accountability"
              detail="Partner requests and check-ins"
              href="/accountability"
            />
            <Row
              icon={Users}
              title="Family"
              detail="Family groups, invites, and dashboard"
              href="/family"
            />
            <Row
              icon={Mic}
              title="Tajweed"
              detail="Lessons and pronunciation feedback"
              href="/tajweed"
            />
            <Row
              icon={Compass}
              title="New Muslim guide"
              detail="Foundation content and starter verses"
              href="/new-muslim"
            />
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Preferences
          </h2>
          <Card className="divide-y divide-border/60">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-secondary/40"
            >
              {isDark ? (
                <Moon className="size-5 text-muted-foreground" aria-hidden />
              ) : (
                <Sun className="size-5 text-muted-foreground" aria-hidden />
              )}
              <div className="flex-1">
                <p className="font-medium leading-tight">Reading mode</p>
                <p className="text-sm text-muted-foreground">
                  {isDark ? "Night" : "Day"} · tap to switch
                </p>
              </div>
            </button>
            <Row
              icon={Languages}
              title="Language"
              detail="English · soon: Yoruba, Igbo, Hausa"
            />
            <Row
              icon={Activity}
              title="Reading anchor"
              detail={user.data?.preferredTime ?? "Not set"}
            />
            <Row
              icon={Globe}
              title="Tafsir source"
              detail="Scholar-verified · Tafsir Ibn Kathir"
            />
          </Card>
        </section>

        <section className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            About
          </h2>
          <Card className="p-5 font-serif text-sm leading-relaxed text-muted-foreground">
            QuranFlow is built so the Quran becomes a daily presence — not a
            seasonal one. Read small. Read often. Return without guilt.
          </Card>
        </section>

        <p className="text-center text-xs text-muted-foreground">
          QuranFlow · Beyond Ramadan
        </p>
      </div>
    </div>
  );
}

function SecurityPanel({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const [setup, setSetup] = useState<{
    qr_code: string;
    secret: string;
    otpauth_uri_account: string;
  } | null>(null);
  const [code, setCode] = useState("");

  async function handleEnable() {
    try {
      setSetup(await auth.enable2FA.mutateAsync());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't start 2FA.");
    }
  }

  async function handleConfirm() {
    if (!setup || code.length !== 6) return;
    try {
      await auth.confirm2FA.mutateAsync({ code, secret: setup.secret });
      setSetup(null);
      setCode("");
      toast.success("2FA enabled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't confirm 2FA.");
    }
  }

  async function handleDisable() {
    try {
      await auth.disable2FA.mutateAsync();
      toast.success("2FA disabled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't disable 2FA.");
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Security
      </h2>
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <LockKeyhole className="mt-0.5 size-5 text-muted-foreground" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium leading-tight">Two-factor authentication</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Add an extra layer of protection to your QuranFlow account.
            </p>
          </div>
        </div>
        {setup ? (
          <div className="mt-4 space-y-3">
            <Image
              src={setup.qr_code}
              alt="2FA QR code"
              width={176}
              height={176}
              unoptimized
              className="mx-auto size-44 rounded-lg border border-border bg-white p-2"
            />
            <p className="break-all text-center text-xs text-muted-foreground">
              {setup.secret}
            </p>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              inputMode="numeric"
              maxLength={6}
            />
            <Button
              className="w-full"
              disabled={auth.confirm2FA.isPending || code.length !== 6}
              onClick={handleConfirm}
            >
              Confirm 2FA
            </Button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              disabled={auth.enable2FA.isPending}
              onClick={handleEnable}
            >
              Enable
            </Button>
            <Button
              variant="secondary"
              disabled={auth.disable2FA.isPending}
              onClick={handleDisable}
            >
              Disable
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}

type AuthMode = "login" | "signup";

function AuthPanel({
  isAuthenticated,
  isPending,
  onLogin,
  onSignup,
  onLogout,
  onAnonymous,
}: {
  isAuthenticated: boolean;
  isPending: boolean;
  onLogin: (payload: { email: string; password: string }) => Promise<unknown>;
  onSignup: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: string;
  }) => Promise<unknown>;
  onLogout: () => Promise<unknown>;
  onAnonymous: () => Promise<unknown>;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (mode === "login") {
        await onLogin({ email: email.trim(), password });
        toast.success("You're connected.");
      } else {
        await onSignup({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          userType: "beginner",
        });
        toast.success("Account created and connected.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  async function handleLogout() {
    try {
      await onLogout();
      toast.success("Signed out.");
    } catch {
      toast.error("Couldn't sign out.");
    }
  }

  async function handleAnonymous() {
    try {
      await onAnonymous();
      toast.success("Guest session started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't start guest session.");
    }
  }

  if (isAuthenticated) {
    return (
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Account
        </h2>
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <ShieldCheck className="mt-0.5 size-5 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-tight">Account active</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Your reading plans, streaks, progress, and reflections are saved
                to your QuranFlow account.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="mt-4 w-full"
            disabled={isPending}
            onClick={handleLogout}
          >
            <LogOut className="size-4" aria-hidden />
            {isPending ? "Signing out..." : "Sign out"}
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Account
      </h2>
      <Card className="p-5">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary/50 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
              mode === "login" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            <LogIn className="size-4" aria-hidden />
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={cn(
              "flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
              mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            <UserPlus className="size-4" aria-hidden />
            Sign up
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Sign in to continue your QuranFlow journey across devices.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          {mode === "signup" ? (
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
            placeholder={mode === "signup" ? "Password, at least 8 characters" : "Password"}
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={mode === "signup" ? 8 : 1}
            required
          />
          <Button className="w-full" disabled={isPending} type="submit">
            {isPending
              ? "Connecting..."
              : mode === "signup"
                ? "Create account"
                : "Login"}
          </Button>
        </form>
        <Button
          variant="ghost"
          className="mt-3 w-full"
          disabled={isPending}
          onClick={handleAnonymous}
        >
          Continue as guest
        </Button>
      </Card>
    </section>
  );
}

function Row({
  icon: Icon,
  title,
  detail,
  href,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  detail: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-center gap-4 p-5 text-left">
      <Icon className="size-5 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-tight">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{detail}</p>
      </div>
      {href ? (
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      ) : null}
    </div>
  );
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "block transition-colors hover:bg-secondary/40 focus-visible:bg-secondary/40 focus-visible:outline-none",
        )}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
