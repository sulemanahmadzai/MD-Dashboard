import React from "react";
import { ProtectedLayoutClient } from "@/components/protected-layout-client";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
