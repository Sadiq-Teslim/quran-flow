"use client";

import { useState } from "react";
import { Handshake, Send } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  useCheckins,
  useCreateCheckin,
  useEndPartner,
  usePartners,
  useRequestPartner,
} from "@/hooks/use-accountability";
import { useAuth } from "@/hooks/use-auth";

export default function AccountabilityPage() {
  const auth = useAuth();
  const partners = usePartners();
  const requestPartner = useRequestPartner();
  const endPartner = useEndPartner();
  const activePartner = partners.data?.find((partner) => partner.status !== "ended");
  const checkins = useCheckins(activePartner?.id);
  const createCheckin = useCreateCheckin();
  const [message, setMessage] = useState("");

  async function handleRequest() {
    if (!auth.isAuthenticated) {
      toast.error("Sign in to use accountability.");
      return;
    }
    try {
      await requestPartner.mutateAsync(["similar_goals", "similar_time"]);
      toast.success("Accountability request started.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't request a partner.");
    }
  }

  async function handleCheckin() {
    if (!activePartner || !message.trim()) return;
    try {
      await createCheckin.mutateAsync({
        partnershipId: activePartner.id,
        message: message.trim(),
      });
      setMessage("");
      toast.success("Check-in sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't send check-in.");
    }
  }

  return (
    <div className="pb-6">
      <ScreenHeader title="Accountability" subtitle="Partner and AI check-ins" />
      <div className="space-y-6 px-5 sm:px-6">
        {partners.isLoading ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : !auth.isAuthenticated ? (
          <EmptyState
            icon={Handshake}
            title="Sign in to continue"
            description="Partner matching and check-ins need your QuranFlow profile."
          />
        ) : activePartner ? (
          <Card className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-accent">
              {activePartner.phase}
            </p>
            <p className="mt-2 font-serif text-2xl leading-tight">
              Partner status: {activePartner.status}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Criteria: {activePartner.criteria.join(", ") || "matched for you"}
            </p>
            <Button
              variant="secondary"
              className="mt-4 w-full"
              disabled={endPartner.isPending}
              onClick={() => endPartner.mutate(activePartner.id)}
            >
              End partnership
            </Button>
          </Card>
        ) : (
          <Card className="p-5">
            <p className="font-serif text-xl leading-tight">
              Start with AI-based accountability.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Start with a simple check-in system, then request a partner when
              matching is available for you.
            </p>
            <Button
              className="mt-4 w-full"
              disabled={requestPartner.isPending}
              onClick={handleRequest}
            >
              <Handshake className="size-4" aria-hidden />
              {requestPartner.isPending ? "Requesting..." : "Request partner"}
            </Button>
          </Card>
        )}

        {activePartner ? (
          <section className="space-y-3">
            <h2 className="font-serif text-xl leading-tight">Check-ins</h2>
            <Card className="p-4">
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="How did your Quran session go today?"
                className="min-h-28 resize-none"
              />
              <Button
                className="mt-3 w-full"
                disabled={createCheckin.isPending || !message.trim()}
                onClick={handleCheckin}
              >
                <Send className="size-4" aria-hidden />
                Send check-in
              </Button>
            </Card>
            {checkins.isLoading ? (
              <Skeleton className="h-24 w-full rounded-lg" />
            ) : checkins.data?.length ? (
              <div className="space-y-3">
                {checkins.data.map((checkin) => (
                  <Card key={checkin.id} className="p-5">
                    <p className="font-serif text-base leading-relaxed">
                      {checkin.message ?? "Daily check-in"}
                    </p>
                    {checkin.responseMessage ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Response: {checkin.responseMessage}
                      </p>
                    ) : null}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-5 text-sm text-muted-foreground">
                No check-ins yet.
              </Card>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
