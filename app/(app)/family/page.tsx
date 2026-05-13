"use client";

import { useState } from "react";
import { Mail, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  useCreateFamily,
  useFamilies,
  useFamilyDashboard,
  useFamilyMembers,
  useInviteFamilyMember,
} from "@/hooks/use-family";
import { useAuth } from "@/hooks/use-auth";

export default function FamilyPage() {
  const auth = useAuth();
  const families = useFamilies();
  const createFamily = useCreateFamily();
  const invite = useInviteFamilyMember();
  const activeFamily = families.data?.[0];
  const dashboard = useFamilyDashboard(activeFamily?.id);
  const members = useFamilyMembers(activeFamily?.id);
  const [familyName, setFamilyName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  async function handleCreate() {
    if (!familyName.trim()) return;
    try {
      await createFamily.mutateAsync({ name: familyName.trim(), target: 3 });
      setFamilyName("");
      toast.success("Family created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't create family.");
    }
  }

  async function handleInvite() {
    if (!activeFamily || !inviteEmail.trim()) return;
    try {
      await invite.mutateAsync({
        familyId: activeFamily.id,
        email: inviteEmail.trim(),
        role: "child",
      });
      setInviteEmail("");
      toast.success("Invite sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't invite member.");
    }
  }

  return (
    <div className="pb-6">
      <ScreenHeader title="Family" subtitle="Shared Quran habits" />
      <div className="space-y-6 px-5 sm:px-6">
        {!auth.isAuthenticated ? (
          <EmptyState
            icon={Users}
            title="Sign in to continue"
            description="Create or join a family group to build a shared habit."
          />
        ) : families.isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : activeFamily ? (
          <>
            <Card className="p-5">
              <p className="text-xs font-medium uppercase tracking-wider text-accent">
                Family dashboard
              </p>
              <p className="mt-2 font-serif text-2xl leading-tight">
                {activeFamily.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Shared target: {activeFamily.sharedDailyVerseTarget} verses daily
              </p>
              {dashboard.data ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="font-serif text-2xl">{dashboard.data.memberCount}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-3">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="font-serif text-2xl">
                      {dashboard.data.sharedDailyVerseTarget}
                    </p>
                  </div>
                </div>
              ) : null}
            </Card>

            <section className="space-y-3">
              <h2 className="font-serif text-xl leading-tight">Invite member</h2>
              <Card className="flex gap-3 p-4">
                <Input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="email@example.com"
                  type="email"
                />
                <Button
                  size="icon"
                  disabled={invite.isPending || !inviteEmail.trim()}
                  onClick={handleInvite}
                  aria-label="Invite member"
                >
                  <Mail className="size-4" aria-hidden />
                </Button>
              </Card>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-xl leading-tight">Members</h2>
              {members.isLoading ? (
                <Skeleton className="h-24 w-full rounded-2xl" />
              ) : members.data?.length ? (
                <div className="space-y-2">
                  {members.data.map((member) => (
                    <Card key={member.id} className="p-4">
                      <p className="font-medium">
                        {member.displayName ?? member.email ?? member.userId}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                        {member.role}
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-5 text-sm text-muted-foreground">
                  No members yet.
                </Card>
              )}
            </section>
          </>
        ) : (
          <Card className="p-5">
            <p className="font-serif text-xl leading-tight">
              Create your first family group.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with a shared daily target of three verses.
            </p>
            <div className="mt-4 flex gap-3">
              <Input
                value={familyName}
                onChange={(event) => setFamilyName(event.target.value)}
                placeholder="Family name"
              />
              <Button
                size="icon"
                disabled={createFamily.isPending || !familyName.trim()}
                onClick={handleCreate}
                aria-label="Create family"
              >
                <Plus className="size-4" aria-hidden />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
