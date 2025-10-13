"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "./app-sidebar";
import type { Sidebar } from "./ui/sidebar";

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client1" | "client2";
}

export function SidebarWrapper(props: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setUser(data);
        }
      })
      .catch((error) => console.error("Failed to fetch user:", error))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !user) {
    return (
      <AppSidebar
        user={{ name: "Loading...", email: "", role: "client1" }}
        {...props}
      />
    );
  }

  return <AppSidebar user={{ ...user, role: user.role }} {...props} />;
}
