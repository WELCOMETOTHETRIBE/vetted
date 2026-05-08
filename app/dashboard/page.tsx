import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Newspaper,
  UserCircle2,
  Briefcase,
  Users,
  MessagesSquare,
  Bell,
  Target,
  Building2,
  Settings2,
  Gift,
  ShieldCheck,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClearDShell } from "@/components/layout/cleard-shell";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PrimaryArea {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

/* ------------------------------------------------------------------ */
/* Per-audience primary-area definitions. No mock data — every count   */
/* on this page resolves to a live Prisma query in `loadDashboard`.    */
/* ------------------------------------------------------------------ */

const CANDIDATE_AREAS: PrimaryArea[] = [
  {
    href: "/feed",
    title: "Feed",
    description: "Updates from your network and the cleared community.",
    icon: Newspaper,
  },
  {
    href: "/profile",
    title: "Profile",
    description: "Cleared mission profile, headline, and continuity record.",
    icon: UserCircle2,
  },
  {
    href: "/jobs",
    title: "Jobs",
    description: "Mission-fit cleared roles ranked for your profile.",
    icon: Briefcase,
  },
  {
    href: "/network",
    title: "Network",
    description: "Connections, pending invites, and suggested introductions.",
    icon: Users,
  },
  {
    href: "/messages",
    title: "Messages",
    description: "Direct conversations with peers and recruiters.",
    icon: MessagesSquare,
  },
  {
    href: "/notifications",
    title: "Notifications",
    description: "Connection requests, mentions, and platform updates.",
    icon: Bell,
  },
];

const EMPLOYER_AREAS: PrimaryArea[] = [
  {
    href: "/candidates",
    title: "Talent Pool",
    description: "Cleared candidates filtered by clearance fit and mission area.",
    icon: Target,
  },
  {
    href: "/jobs",
    title: "Jobs Posted",
    description: "Manage your cleared roles and review applicants.",
    icon: Briefcase,
  },
  {
    href: "/messages",
    title: "Messages",
    description: "Outreach threads with cleared candidates and your team.",
    icon: MessagesSquare,
  },
  {
    href: "/companies",
    title: "Companies",
    description: "Defense contractor profiles and program affiliations.",
    icon: Building2,
  },
  {
    href: "/notifications",
    title: "Notifications",
    description: "Application activity and engagement alerts.",
    icon: Bell,
  },
];

const ADMIN_AREAS: PrimaryArea[] = [
  {
    href: "/admin",
    title: "Operator Console",
    description: "Platform health, candidate moderation, and ATS scrapers.",
    icon: Settings2,
  },
  {
    href: "/admin?tab=ops-tickets",
    title: "Ops Tickets",
    description: "Bug reports, feature requests, and triage queue.",
    icon: AlertTriangle,
  },
  {
    href: "/candidates",
    title: "Talent Pool",
    description: "Imported and scraped cleared candidate records.",
    icon: Target,
  },
  {
    href: "/feed",
    title: "Feed",
    description: "Platform-wide candidate posts and content.",
    icon: Newspaper,
  },
  {
    href: "/referrals",
    title: "Referrals",
    description: "Referral program activity and payouts.",
    icon: Gift,
  },
];

interface DashboardCounts {
  acceptedConnections: number;
  pendingConnections: number;
  unreadNotifications: number;
  conversationCount: number;
  jobsPosted: number;
  candidateCount: number;
  openOpsTickets: number;
}

async function loadDashboard(userId: string): Promise<DashboardCounts> {
  /* Run the small set of counts in parallel. Each query is bounded — none of
   * these are unbounded scans. The dashboard doesn't fetch row data, only
   * aggregate counts, so the result set is constant-sized regardless of
   * platform scale. */
  const [
    acceptedConnections,
    pendingConnections,
    unreadNotifications,
    conversationCount,
    jobsPosted,
    candidateCount,
    openOpsTickets,
  ] = await Promise.all([
    prisma.connection.count({
      where: {
        OR: [
          { requesterId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
    }),
    prisma.connection.count({
      where: { receiverId: userId, status: "PENDING" },
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
    prisma.messageThread
      .count({ where: { OR: [{ user1Id: userId }, { user2Id: userId }] } })
      .catch(() => 0),
    prisma.job.count({ where: { postedById: userId } }).catch(() => 0),
    prisma.candidate.count().catch(() => 0),
    prisma.opsTicket
      .count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } })
      .catch(() => 0),
  ]);

  return {
    acceptedConnections,
    pendingConnections,
    unreadNotifications,
    conversationCount,
    jobsPosted,
    candidateCount,
    openOpsTickets,
  };
}

/* ------------------------------------------------------------------ */

interface MetricSpec {
  label: string;
  value: number;
  hint: string;
}

function candidateMetrics(c: DashboardCounts): MetricSpec[] {
  return [
    {
      label: "Connections",
      value: c.acceptedConnections,
      hint: "Accepted in your cleared network.",
    },
    {
      label: "Pending invites",
      value: c.pendingConnections,
      hint: "Connection requests awaiting your response.",
    },
    {
      label: "Conversations",
      value: c.conversationCount,
      hint: "Active threads in Messages.",
    },
    {
      label: "Unread alerts",
      value: c.unreadNotifications,
      hint: "Mentions, replies, and platform notices.",
    },
  ];
}

function employerMetrics(c: DashboardCounts): MetricSpec[] {
  return [
    {
      label: "Jobs posted",
      value: c.jobsPosted,
      hint: "Cleared roles you have published.",
    },
    {
      label: "Talent pool",
      value: c.candidateCount,
      hint: "Cleared candidates available to source from.",
    },
    {
      label: "Conversations",
      value: c.conversationCount,
      hint: "Active outreach threads.",
    },
    {
      label: "Unread alerts",
      value: c.unreadNotifications,
      hint: "Engagement events that need a response.",
    },
  ];
}

function adminMetrics(c: DashboardCounts): MetricSpec[] {
  return [
    {
      label: "Open ops tickets",
      value: c.openOpsTickets,
      hint: "Bug reports and feature requests in the queue.",
    },
    {
      label: "Talent pool",
      value: c.candidateCount,
      hint: "Total cleared candidate records.",
    },
    {
      label: "Connections",
      value: c.acceptedConnections,
      hint: "Your own accepted connections.",
    },
    {
      label: "Unread alerts",
      value: c.unreadNotifications,
      hint: "Notifications routed to your account.",
    },
  ];
}

/* ------------------------------------------------------------------ */

function MetricCard({ spec }: { spec: MetricSpec }) {
  return (
    <Card className="bg-card/60">
      <CardHeader className="pb-3">
        <CardDescription className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {spec.label}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {spec.value.toLocaleString()}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">{spec.hint}</CardContent>
    </Card>
  );
}

function PrimaryAreaCard({ area }: { area: PrimaryArea }) {
  const Icon = area.icon;
  return (
    <Link
      href={area.href}
      className={cn(
        "group flex gap-3 rounded-lg border border-border p-4 transition-colors",
        "hover:border-primary/40 hover:bg-card/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-foreground">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium group-hover:text-primary">
          {area.title}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{area.description}</p>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?redirect_url=%2Fdashboard");
  }

  const counts = await loadDashboard(session.user.id);
  const role = session.user.role;
  const accountType = session.user.accountType;
  const isAdmin = role === "ADMIN";
  const isEmployer = accountType === "EMPLOYER";

  let areas: PrimaryArea[];
  let metrics: MetricSpec[];
  let audienceLine: string;
  let audienceTitle: string;

  if (isAdmin) {
    areas = ADMIN_AREAS;
    metrics = adminMetrics(counts);
    audienceTitle = "Operator dashboard";
    audienceLine =
      "Platform health, candidate moderation, and the operator console. Open ops tickets and talent pool size are live.";
  } else if (isEmployer) {
    areas = EMPLOYER_AREAS;
    metrics = employerMetrics(counts);
    audienceTitle = "Employer dashboard";
    audienceLine =
      "Source cleared talent, manage your roles, and triage outreach. All counts pull from your account in real time.";
  } else {
    areas = CANDIDATE_AREAS;
    metrics = candidateMetrics(counts);
    audienceTitle = "Candidate dashboard";
    audienceLine =
      "Your network at a glance. Jump straight back into the feed, your profile, or mission-fit jobs.";
  }

  return (
    <ClearDShell
      viewer={{
        name: session.user.name,
        email: session.user.email,
        role,
        accountType,
      }}
    >
      <div className="space-y-8">
        <PageHeader title={audienceTitle} description={audienceLine} />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card className="border-primary/20 bg-card/60 sm:col-span-2 xl:col-span-2">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                <LayoutDashboard className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">clearD by MacTech</CardTitle>
                <CardDescription>
                  Cleared talent network · {audienceTitle.toLowerCase()} ·
                  signed in as{" "}
                  <span className="font-mono text-xs">{session.user.email}</span>
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Use the left navigation for the full surface. Quick areas below.
            </CardContent>
          </Card>

          <Card className="bg-card/60">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base">Clearance hygiene</CardTitle>
                <CardDescription>
                  Keep posts, messages, and profile fields free of classified or
                  CUI detail.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            At a glance
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <MetricCard key={m.label} spec={m} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Primary areas
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => (
              <PrimaryAreaCard key={area.href} area={area} />
            ))}
          </div>
        </section>
      </div>
    </ClearDShell>
  );
}
