import { z } from "zod";
import { apiFetch, hasAccessToken, shouldUseMockFallback } from "@/lib/api/client";

export const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationSettingsSchema = z.object({
  frequency: z.string(),
  time: z.string(),
});
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;

const ApiNotificationSettingsSchema = z.object({
  notification_frequency: z.string().optional(),
  notification_time: z.string().optional(),
  preferred_time: z.string().nullable().optional(),
  reminders_enabled: z.boolean().nullable().optional(),
});

export async function listNotifications(): Promise<{
  items: Notification[];
  total: number;
  unreadCount: number;
}> {
  if (!hasAccessToken()) {
    return { items: [], total: 0, unreadCount: 0 };
  }

  try {
    return { items: [], total: 0, unreadCount: 0 };
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return { items: [], total: 0, unreadCount: 0 };
  }
}

export async function markNotificationRead(id: string) {
  void id;
  return { ok: true };
}

export async function markAllNotificationsRead() {
  return { ok: true };
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  if (!hasAccessToken()) {
    return { frequency: "daily", time: "06:00:00" };
  }

  try {
    const settings = ApiNotificationSettingsSchema.parse(
      await apiFetch<unknown>("/api/v1/notifications/preferences", { auth: true }),
    );
    return NotificationSettingsSchema.parse({
      frequency: settings.reminders_enabled === false ? "off" : settings.notification_frequency ?? "daily",
      time: settings.preferred_time ?? settings.notification_time ?? "06:00:00",
    });
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return { frequency: "daily", time: "06:00:00" };
  }
}

export async function updateNotificationSettings(input: Partial<NotificationSettings>) {
  const settings = ApiNotificationSettingsSchema.parse(
    await apiFetch<unknown>("/api/v1/notifications/preferences", {
      auth: true,
      method: "PATCH",
      body: JSON.stringify({
        reminders_enabled: input.frequency ? input.frequency !== "off" : undefined,
        preferred_time: input.time,
      }),
    }),
  );
  return NotificationSettingsSchema.parse({
    frequency: settings.reminders_enabled === false ? "off" : settings.notification_frequency ?? input.frequency ?? "daily",
    time: settings.preferred_time ?? settings.notification_time ?? input.time ?? "06:00:00",
  });
}
