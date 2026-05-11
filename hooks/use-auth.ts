"use client";

import { useSyncExternalStore } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hasAccessToken, subscribeToAuthChanges } from "@/lib/api/client";
import {
  login,
  logout,
  signup,
  startAnonymousSession,
  enable2FA,
  confirm2FA,
  disable2FA,
  type LoginPayload,
  type SignupPayload,
} from "@/lib/services/auth.service";

export function useAuth() {
  const queryClient = useQueryClient();
  const isAuthenticated = useSyncExternalStore(
    subscribeToAuthChanges,
    hasAccessToken,
    () => false,
  );

  const refreshAuthedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["user"] }),
      queryClient.invalidateQueries({ queryKey: ["today-plan"] }),
      queryClient.invalidateQueries({ queryKey: ["streak"] }),
      queryClient.invalidateQueries({ queryKey: ["week-activity"] }),
      queryClient.invalidateQueries({ queryKey: ["streak-history"] }),
      queryClient.invalidateQueries({ queryKey: ["progress-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["analytics"] }),
      queryClient.invalidateQueries({ queryKey: ["learn-path"] }),
      queryClient.invalidateQueries({ queryKey: ["education-stages"] }),
      queryClient.invalidateQueries({ queryKey: ["reflections"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] }),
      queryClient.invalidateQueries({ queryKey: ["partners"] }),
      queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
      queryClient.invalidateQueries({ queryKey: ["fallback-checkin"] }),
      queryClient.invalidateQueries({ queryKey: ["families"] }),
      queryClient.invalidateQueries({ queryKey: ["tajweed-feedback"] }),
      queryClient.invalidateQueries({ queryKey: ["new-muslim-guided-content"] }),
      queryClient.invalidateQueries({ queryKey: ["reading-history"] }),
    ]);
  };

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: refreshAuthedQueries,
  });

  const signupMutation = useMutation({
    mutationFn: async (payload: SignupPayload) => {
      await signup(payload);
      return login({ email: payload.email, password: payload.password });
    },
    onSuccess: refreshAuthedQueries,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: refreshAuthedQueries,
  });

  const anonymousMutation = useMutation({
    mutationFn: startAnonymousSession,
    onSuccess: refreshAuthedQueries,
  });

  const enable2FAMutation = useMutation({
    mutationFn: enable2FA,
  });

  const confirm2FAMutation = useMutation({
    mutationFn: confirm2FA,
    onSuccess: refreshAuthedQueries,
  });

  const disable2FAMutation = useMutation({
    mutationFn: disable2FA,
    onSuccess: refreshAuthedQueries,
  });

  return {
    isAuthenticated,
    login: loginMutation,
    signup: signupMutation,
    logout: logoutMutation,
    anonymous: anonymousMutation,
    enable2FA: enable2FAMutation,
    confirm2FA: confirm2FAMutation,
    disable2FA: disable2FAMutation,
  };
}
