"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NotificationButton } from "./notification-button";
import { apiRequest, clearSession, type User } from "../lib/api";

export function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></>,
    folder: <><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2H18a3 3 0 0 1 3 3v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M3 11h18" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4 4" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    chevron: <><path d="m9 18 6-6-6-6" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 4a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
    filter: <><path d="M4 7h16M7 12h10m-7 5h4" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14z" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4z" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
    share: <><path d="M12 16V3m-5 5 5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></>,
    eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ?? paths.spark}
    </svg>
  );
}

export const avatarColors: Record<string, string> = {
  peach: "bg-[#f8ddd0] text-[#9f5a3d]",
  blue: "bg-[#dce8ff] text-[#315b9c]",
  pink: "bg-[#f6ddec] text-[#994b77]",
  green: "bg-[#d8f0e5] text-[#31785c]",
  yellow: "bg-[#fff0c2] text-[#95701b]",
  violet: "bg-[#e9e3ff] text-[#6558b9]",
};

export function Avatar({
  initials,
  color = "violet",
  size = "md",
}: {
  initials: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white ${avatarColors[color] ?? avatarColors.violet} ${sizeClass}`}>
      {initials}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "On track": "bg-[#e8f7ef] text-[#23774e]",
    "At risk": "bg-[#fff3dc] text-[#a46a0b]",
    Completed: "bg-[#eeeaff] text-[#6558b9]",
    "In progress": "bg-[#eeebff] text-[#5f50c8]",
    "To do": "bg-[#f0f2f5] text-[#687286]",
    "In review": "bg-[#e8f3ff] text-[#3877b5]",
    Done: "bg-[#e8f7ef] text-[#23774e]",
    High: "bg-[#fff0ee] text-[#bf5147]",
    Medium: "bg-[#fff4de] text-[#a46a0b]",
    Low: "bg-[#f0f2f5] text-[#687286]",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>{status}</span>;
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: "grid" },
  { href: "/projects", label: "Projects", icon: "folder" },
  { href: "/tasks", label: "Tasks", icon: "check" },
];

export function AppShell({
  children,
  active = "Overview",
}: {
  children: ReactNode;
  active?: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!window.sessionStorage.getItem("neostat-token")) {
      router.replace("/login");
      return;
    }
    const handleUnauthorized = () => router.replace("/login");
    window.addEventListener("neostat:unauthorized", handleUnauthorized);
    apiRequest<User>("/profile")
      .then((profile) => {
        setUser(profile);
        window.sessionStorage.setItem("neostat-name", profile.name);
        window.sessionStorage.setItem("neostat-role", profile.role);
        window.sessionStorage.setItem("neostat-user-id", profile.id);
      })
      .catch((error) => {
        console.error("Loading workspace profile failed:", error);
      });
    return () => window.removeEventListener("neostat:unauthorized", handleUnauthorized);
  }, [router]);

  const nav = user?.role === "ADMIN"
    ? [...navItems, { href: "/users", label: "Users", icon: "users" }]
    : navItems;

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="flex w-full flex-col border-b border-[#e9ebf1] bg-white px-4 py-4 md:fixed md:inset-y-0 md:w-[248px] md:border-r md:border-b-0 md:px-5 md:py-7">
        <Link href="/dashboard" className="mb-5 flex items-center gap-2.5 px-1 md:mb-10">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6558d3] text-white shadow-sm"><Icon name="spark" size={20} /></span>
          <span className="text-[19px] font-bold tracking-tight text-[#202638]">Project<span className="text-[#6558d3]">Pulse</span></span>
          <span className="ml-auto rounded-md bg-[#f5f4fb] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#77718d] md:hidden">Workspace</span>
        </Link>
        <p className="mb-2 hidden px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa1b1] md:block">Workspace</p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${active === item.label ? "bg-[#f1efff] text-[#5d50c7]" : "text-[#687286] hover:bg-[#f7f8fa] hover:text-[#202638]"}`}
            >
              <Icon name={item.icon} size={18} />{item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-7 hidden md:block">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#9aa1b1]">Your projects</p>
          <nav className="flex flex-col gap-1">
            <Link href="/projects/1" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#687286] hover:bg-[#f7f8fa]"><span className="h-2.5 w-2.5 rounded-full bg-[#9b8cf3]" />Website redesign</Link>
            <Link href="/projects/2" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#687286] hover:bg-[#f7f8fa]"><span className="h-2.5 w-2.5 rounded-full bg-[#6fa8e7]" />Mobile app launch</Link>
            <Link href="/projects/3" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-[#687286] hover:bg-[#f7f8fa]"><span className="h-2.5 w-2.5 rounded-full bg-[#efb84c]" />Brand identity</Link>
          </nav>
        </div>
        <div className="mt-auto hidden rounded-xl bg-[#f7f6ff] p-4 md:block">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#38315f]"><Icon name="spark" size={16} />Your workspace</div>
          <p className="mb-3 text-xs leading-5 text-[#77718d]">You’re doing great! Your team has completed 82% of this month’s goals.</p>
          <Link href="/projects" className="text-xs font-semibold text-[#6558d3] hover:underline">View progress <span aria-hidden>→</span></Link>
        </div>
        <div className="mt-4 hidden border-t border-[#eceef2] pt-4 md:block">
          <Link href="/profile" className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-[#f7f8fa]">
            <Avatar initials={user?.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("") ?? "U"} color="peach" />
            <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#30384a]">{user?.name ?? "Loading profile…"}</span><span className="block truncate text-[11px] text-[#8a91a0]">{user?.role.replaceAll("_", " ") ?? "Workspace user"}</span></span>
          </Link>
          <button type="button" onClick={logout} className="mt-2 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-xs font-medium text-[#687286] hover:bg-[#f7f8fa]">
            <Icon name="logout" size={16} /> Sign out
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1 md:ml-[248px]">
      <header className="sticky top-0 z-10 hidden h-[72px] items-center justify-between border-b border-[#e9ebf1] bg-[#ffffffeb] px-8 backdrop-blur md:flex">
        <span className="text-xs text-[#8991a0]">Workspace</span>
          <div className="flex items-center gap-4">
            <NotificationButton />
            <div className="h-7 w-px bg-[#e9ebf1]" />
            <Avatar initials="SP" color="peach" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[.12em] text-[#8b91a0]">{eyebrow}</p>}
        <h1 className="text-[26px] font-semibold tracking-tight text-[#202638] sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-[#7c8495]">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
}) {
  const styles = {
    primary: "bg-[#6558d3] text-white shadow-sm hover:bg-[#5749c3]",
    secondary: "border border-[#e3e6ed] bg-white text-[#444d60] hover:bg-[#f8f9fb]",
    quiet: "text-[#6f788b] hover:bg-[#f3f4f8]",
  };
  return <button className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition ${styles[variant]} ${className}`} {...props}>{children}</button>;
}

export function ProgressBar({ value, color = "bg-[#7569dc]" }: { value: number; color?: string }) {
  return <div className="h-1.5 overflow-hidden rounded-full bg-[#eff0f4]"><div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} /></div>;
}
