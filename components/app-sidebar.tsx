"use client";

import type * as React from "react";
import { Command, Settings2, Users } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navMain = [
  {
    title: "Dashboard",
    url: "/",
    icon: IconDashboard,
    isActive: true,
  },
  {
    title: "Client 1",
    url: "/client1",
    icon: IconListDetails,
    isActive: true,
  },
  {
    title: "Client 2",
    url: "/client2",
    icon: IconChartBar,
    isActive: true,
  },
  {
    title: "User Management",
    url: "/users",
    icon: Users,
    isActive: true,
    items: [
      {
        title: "All Users",
        url: "/users",
      },
      {
        title: "Roles",
        url: "/users/roles",
      },
    ],
  },
  {
    title: "Settings",
    url: "/account",
    icon: Settings2,
    items: [
      {
        title: "Account",
        url: "/account",
      },
    ],
  },
];

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar?: string; role?: string };
}) {
  // Filter navigation items based on user role
  const getFilteredNavItems = () => {
    if (user.role === "admin") {
      // Admin sees everything
      return navMain;
    } else if (user.role === "client1") {
      // Client1 sees only Client 1 and Settings
      return navMain.filter(
        (item) => item.title === "Client 1" || item.title === "Settings"
      );
    } else if (user.role === "client2") {
      // Client2 sees only Client 2 and Settings
      return navMain.filter(
        (item) => item.title === "Client 2" || item.title === "Settings"
      );
    }
    // Default: show nothing
    return [];
  };

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={getFilteredNavItems()} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
