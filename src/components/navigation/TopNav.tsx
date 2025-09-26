"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import clsx from "clsx";
import type { ExtendedSession } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  roles?: string[];
};

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Organization", href: "/organization" },
  { label: "Catalogue", href: "/catalogue" },
  { label: "Requests", href: "/requests" },
  { label: "Reports", href: "/reports" },
];

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "--";
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav() {
  const pathname = usePathname() ?? "/";
  const { data: session, status } = useSession<ExtendedSession>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const navItems = useMemo(() => {
    if (!session?.role) {
      return PRIMARY_NAV_ITEMS;
    }

    return PRIMARY_NAV_ITEMS.filter((item) => {
      if (!item.roles?.length) {
        return true;
      }
      return item.roles.includes(session.role);
    });
  }, [session?.role]);

  const activeOrg = useMemo(() => {
    if (!session?.membership?.length || !session.orgId) {
      return null;
    }
    return session.membership.find((membership) => membership.orgId === session.orgId) ?? null;
  }, [session?.membership, session?.orgId]);

  const initials = getInitials(session?.user?.name, session?.user?.email);
  const orgName = activeOrg?.orgName ?? "";

  if (status === "loading") {
    return (
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="hidden h-6 w-24 animate-pulse rounded bg-slate-200 md:block" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
          </div>
        </div>
      </header>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-900 transition hover:text-blue-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 4l9 6.5M4.5 9v10.5h5.5V14h4v5.5H19.5V9" />
              </svg>
            </span>
            <div className="flex flex-col">
              <span className="text-base font-semibold">OfficeStore</span>
              {orgName && <span className="text-xs font-medium text-slate-500">{orgName}</span>}
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H15" />
              )}
            </svg>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left transition hover:border-blue-200 hover:bg-blue-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {initials}
              </span>
              <span className="hidden text-sm font-medium text-slate-700 sm:flex sm:flex-col sm:items-start">
                <span>{session.user.name ?? session.user.email}</span>
                {session.user.email && <span className="text-xs text-slate-500">{session.user.email}</span>}
              </span>
              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-60 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg ring-1 ring-black/5">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-800">{session.user.name ?? "Signed In"}</p>
                  {orgName && <p className="text-xs text-slate-500">{orgName}</p>}
                </div>
                <div className="flex flex-col py-1">
                  <Link
                    href="/profile"
                    className="px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    href="/organization/setup"
                    className="px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    Organization Settings
                  </Link>
                  <Link
                    href="/help"
                    className="px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    Help &amp; Support
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
