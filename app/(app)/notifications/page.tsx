"use client";

import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { ScreenHeader } from "@/components/nav/screen-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/hooks/use-auth";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationSettings,
  useNotifications,
  useUpdateNotificationSettings,
} from "@/hooks/use-notifications";

export default function NotificationsPage() {
  const auth = useAuth();
  const notifications = useNotifications();
  const settings = useNotificationSettings();
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const updateSettings = useUpdateNotificationSettings();

  async function handleSaveTime(time: string) {
    if (!auth.isAuthenticated) {
      toast.error("Connect your account first.");
      return;
    }
    try {
      await updateSettings.mutateAsync({ time });
      toast.success("Notification time saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save settings.");
    }
  }

  return (
    <div className="pb-6">
      <ScreenHeader
        title="Notifications"
        subtitle="Nudges, reminders, and reinforcement"
        right={
          notifications.data?.unreadCount ? (
            <Button
              size="icon"
              variant="secondary"
              aria-label="Mark all as read"
              disabled={markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="size-4" aria-hidden />
            </Button>
          ) : null
        }
      />
      <div className="space-y-6 px-5 sm:px-6">
        <Card className="p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Reminder settings
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Frequency: {settings.data?.frequency ?? "daily"}
          </p>
          <div className="mt-4 flex gap-3">
            <Input
              type="time"
              defaultValue={(settings.data?.time ?? "06:00:00").slice(0, 5)}
              onBlur={(event) => handleSaveTime(`${event.target.value}:00`)}
            />
            <Button
              variant="secondary"
              disabled={updateSettings.isPending}
              onClick={() =>
                handleSaveTime((settings.data?.time ?? "06:00:00").slice(0, 8))
              }
            >
              Save
            </Button>
          </div>
        </Card>

        {notifications.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : !auth.isAuthenticated ? (
          <EmptyState
            icon={Bell}
            title="Connect account"
            description="Notifications are stored on the backend."
          />
        ) : notifications.data?.items.length ? (
          <div className="space-y-3">
            {notifications.data.items.map((item) => (
              <Card key={item.id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-1 size-2 rounded-full bg-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.message}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                      {item.type}
                    </p>
                  </div>
                </div>
                {!item.readAt ? (
                  <Button
                    variant="ghost"
                    className="mt-3 w-full"
                    disabled={markOne.isPending}
                    onClick={() => markOne.mutate(item.id)}
                  >
                    Mark read
                  </Button>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Reminders and educational nudges will appear here."
          />
        )}
      </div>
    </div>
  );
}
