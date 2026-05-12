"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useEffect, useRef, useState } from "react";
import { hasAccessToken } from "@/lib/api/client";
import { startAnonymousSession } from "@/lib/services/auth.service";

function BackendSessionBootstrap() {
  const booted = useRef(false);
  const client = useQueryClient();

  useEffect(() => {
    if (booted.current || hasAccessToken()) return;
    booted.current = true;

    startAnonymousSession()
      .then(() => client.invalidateQueries())
      .catch((error) => {
        console.warn("QuranFlow anonymous backend session failed", error);
      });
  }, [client]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={client}>
        <BackendSessionBootstrap />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            className:
              "rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm",
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
