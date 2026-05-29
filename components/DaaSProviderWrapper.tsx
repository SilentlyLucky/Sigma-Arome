/**
 * DaaS Provider Wrapper
 *
 * Configures DaaSProvider with the DaaS URL and a getToken callback
 * that reads the live Supabase session JWT. Waits for the session to
 * be available before rendering children to prevent 401 race conditions.
 */

"use client";

import { DaaSProvider } from "@/lib/buildpad/services";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader, Center } from "@mantine/core";

export function DaaSProviderWrapper({ children }: { children: ReactNode }) {
  const [sessionReady, setSessionReady] = useState(false);

  // Wait for Supabase session to be available before rendering DaaSProvider children
  useEffect(() => {
    const supabase = createClient();

    // Check if session exists immediately
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      }
    });

    // Listen for auth state changes (handles delayed hydration)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSessionReady(true);
      }
    });

    // Fallback: if after 2s still no session, render anyway (user might not be logged in)
    const timeout = setTimeout(() => setSessionReady(true), 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const config = useMemo(
    () => ({
      url: process.env.NEXT_PUBLIC_BUILDPAD_DAAS_URL ?? "",
      getToken: async () => {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        return data.session?.access_token ?? null;
      },
      getHeaders: async (): Promise<Record<string, string>> => {
        if (typeof document === "undefined") return {};
        const raw = document.cookie
          .split("; ")
          .find((r) => r.startsWith("daas_resource_uri="))
          ?.split("=")[1];
        if (!raw) return {};
        return { "X-Resource-Uri": decodeURIComponent(raw) };
      },
    }),
    []
  );

  if (!sessionReady) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return <DaaSProvider config={config}>{children}</DaaSProvider>;
}
