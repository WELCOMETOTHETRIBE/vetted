"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  Users,
  MessagesSquare,
  Bell,
  UsersRound,
  UserCircle2,
  Briefcase,
  Building2,
  Lightbulb,
  Target,
  Settings2,
  Gift,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ClearDSidebarProps {
  /** Audience the navigation should be tuned for. */
  accountType?: "CANDIDATE" | "EMPLOYER" | undefined;
  isAdmin?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

function buildNav({
  accountType,
  isAdmin,
}: ClearDSidebarProps): NavGroup[] {
  const network: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/feed", label: "Feed", icon: Newspaper },
    { href: "/network", label: "Network", icon: Users },
    { href: "/messages", label: "Messages", icon: MessagesSquare },
    { href: "/notifications", label: "Notifications", icon: Bell },
    { href: "/groups", label: "Groups", icon: UsersRound },
  ];

  const career: NavItem[] = [
    { href: "/profile", label: "Profile", icon: UserCircle2 },
  ];
  if (isAdmin || accountType !== "EMPLOYER") {
    career.push({ href: "/jobs", label: "Jobs", icon: Briefcase });
  }
  career.push({ href: "/companies", label: "Companies", icon: Building2 });
  career.push({ href: "/tips", label: "Tips", icon: Lightbulb });

  const operator: NavItem[] = [];
  if (isAdmin || accountType === "EMPLOYER") {
    operator.push({ href: "/candidates", label: "Talent Pool", icon: Target });
  }
  if (isAdmin) {
    operator.push({ href: "/admin", label: "Operator Console", icon: Settings2 });
  }
  operator.push({ href: "/referrals", label: "Referrals", icon: Gift });

  const groups: NavGroup[] = [
    { group: "Network", items: network },
    { group: "Career", items: career },
  ];
  if (operator.length > 0) {
    groups.push({ group: "Operator", items: operator });
  }
  return groups;
}

export function ClearDSidebar({ accountType, isAdmin }: ClearDSidebarProps) {
  const pathname = usePathname();
  const nav = buildNav({ accountType, isAdmin });

  return (
    <aside className="hidden md:flex h-screen w-64 shrink-0 flex-col border-r border-border bg-card sticky top-0">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-5 py-5 border-b border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md brand-mark-chip">
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </div>
        <div className="leading-tight">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            MacTech Suite
          </div>
          <div className="text-sm font-semibold leading-snug">clearD</div>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm" aria-label="Primary">
        {nav.map((group) => (
          <div key={group.group} className="mb-5">
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.group}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                        active
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="leading-snug">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground space-y-1">
        <div className="font-mono">clearD · v0.1.0</div>
        <div className="text-[11px] leading-relaxed">
          Cleared talent network · MacTech Suite
        </div>
      </div>
    </aside>
  );
}
