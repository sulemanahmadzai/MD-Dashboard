"use client";

import * as React from "react";
import { AppSidebar } from "./app-sidebar";
import type { Sidebar } from "./ui/sidebar";
import { useUser } from "@/lib/hooks/use-user";

export function SidebarWrapper(props: React.ComponentProps<typeof Sidebar>) {
  // Use React Query hook - automatically manages caching and invalidation
  const { data: user, isLoading } = useUser();

  // Pass both user data and loading state to AppSidebar
  // This prevents showing wrong permissions during loading
  return <AppSidebar user={user} isLoading={isLoading} {...props} />;
}
