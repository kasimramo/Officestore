"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TopNav } from "@/components/navigation/TopNav";

const HIDDEN_PATHS = new Set(["/", "/auth/signin", "/auth/signup"]);
const HIDDEN_PREFIXES = ["/api", "/auth/", "/onboarding"];

interface AppFrameProps {
  children: ReactNode;
}

export function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname() ?? "/";

  const hideNav = HIDDEN_PATHS.has(pathname) || HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
