"use client";

import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import type { Sidebar } from "./ui/sidebar";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client1" | "client2";
}

// Module-level cache persists across navigations (in the same tab)
let cachedUser: SessionUser | null = null;

// Stable, SSR-safe placeholder used for both server render and first client render.
// (No randoms/dates; strings only)
const PLACEHOLDER_USER: SessionUser = {
  id: "",
  name: "Loading…",
  email: "",
  role: "admin",
};

export function SidebarWrapper(props: React.ComponentProps<typeof Sidebar>) {
  // On the server, this evaluates to `null` (cachedUser is null), which ensures
  // the first render uses the same PLACEHOLDER_USER on both server and client.
  const [user, setUser] = React.useState<SessionUser | null>(cachedUser);

  React.useEffect(() => {
    // If we already have the user, don't refetch.
    if (cachedUser) return;

    const ctrl = new AbortController();

    fetch("/api/auth/me", { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: SessionUser | { error?: string }) => {
        if (data && !(data as any).error) {
          cachedUser = data as SessionUser;
          setUser(cachedUser);
        }
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("Failed to fetch user:", err);
        }
      });

    return () => ctrl.abort();
  }, []);

  // Always render the same element tree; only the text/props change once data arrives.
  const displayUser = user ?? PLACEHOLDER_USER;

  return <AppSidebar user={displayUser} {...props} />;
}
