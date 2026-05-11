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

const ApiNotificationSchema = z.object({
  id: z.string(),
  notification_type: z.string(),
  title: z.string(),
  message: z.string(),
  read_at: z.string().nullable().optional(),
  created_at: z.string(),
});

const ApiNotificationListSchema = z.object({
  items: z.array(ApiNotificationSchema),
  total: z.number(),
  unread_count: z.number(),
});

const ApiNotificationSettingsSchema = z.object({
  notification_frequency: z.string(),
  notification_time: z.string(),
});

function mapNotification(item: z.infer<typeof ApiNotificationSchema>) {
  return NotificationSchema.parse({
    id: item.id,
    type: item.notification_type,
    title: item.title,
    message: item.message,
    readAt: item.read_at ?? null,
    createdAt: item.created_at,
  });
}

export async function listNotifications() {
  if (!hasAccessToken()) {
    return { items: [], total: 0, unreadCount: 0 };
  }

  try {
    const response = ApiNotificationListSchema.parse(
      await apiFetch<unknown>("/api/v1/notifications?page=1&page_size=20", {
        auth: true,
      }),
    );
    return {
      items: response.items.map(mapNotification),
      total: response.total,
      unreadCount: response.unread_count,
    };
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return { items: [], total: 0, unreadCount: 0 };
  }
}

export async function markNotificationRead(id: string) {
  await apiFetch(`/api/v1/notifications/${id}/read`, {
    auth: true,
    method: "POST",
  });
  return { ok: true };
}

export async function markAllNotificationsRead() {
  await apiFetch("/api/v1/notifications/read-all", {
    auth: true,
    method: "POST",
  });
  return { ok: true };
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  if (!hasAccessToken()) {
    return { frequency: "daily", time: "06:00:00" };
  }

  try {
    const settings = ApiNotificationSettingsSchema.parse(
      await apiFetch<unknown>("/api/v1/notifications/settings", { auth: true }),
    );
    return NotificationSettingsSchema.parse({
      frequency: settings.notification_frequency,
      time: settings.notification_time,
    });
  } catch (error) {
    if (!shouldUseMockFallback(error)) throw error;
    return { frequency: "daily", time: "06:00:00" };
  }
}

export async function updateNotificationSettings(input: Partial<NotificationSettings>) {
  const settings = ApiNotificationSettingsSchema.parse(
    await apiFetch<unknown>("/api/v1/notifications/settings", {
      auth: true,
      method: "PATCH",
      body: JSON.stringify({
        notification_frequency: input.frequency,
        notification_time: input.time,
      }),
    }),
  );
  return NotificationSettingsSchema.parse({
    frequency: settings.notification_frequency,
    time: settings.notification_time,
  });
}
