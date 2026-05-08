import type { Metadata } from "next"
import Link from "next/link"
import {
  Compass,
  ShieldCheck,
  Settings2,
  BadgeCheck,
  FolderKanban,
  Sparkles,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MacTechFooter } from "@/components/layout/mactech-footer"

export const metadata: Metadata = {
  title: "clearD by MacTech — Cleared Talent Network",
  description:
    "The clearance-first professional network for transitioning service members, defense contractors, and federal program staff.",
}

const AUDIENCES = [
  {
    Icon: Compass,
    title: "Cleared Professionals",
    description:
      "Build a Cleared Mission Profile that preserves clearance continuity and mission readiness — especially during transition.",
  },
  {
    Icon: ShieldCheck,
    title: "Defense Contractors / GovCon Teams",
    description:
      "Invitation-only sourcing and mission-fit evaluation for cleared roles with audit-friendly workflows.",
  },
  {
    Icon: Settings2,
    title: "Admin / Operator (MacTech Solutions)",
    description:
      "Operated and supported by MacTech Solutions to onboard contractors, run CSP pilots, and ensure compliance awareness.",
  },
]

const SYSTEMS = [
  {
    Icon: BadgeCheck,
    title: "System 1 · Cleared Professional Network",
    description:
      "A clearance-first professional identity system centered on Cleared Mission Profiles, validated capabilities, and a trusted network.",
  },
  {
    Icon: FolderKanban,
    title: "System 2 · Contractor Sourcing & Console",
    description:
      "Private, invitation-only sourcing for cleared hiring teams: cleared talent pools, mission-fit evaluation, and operator workflows.",
  },
  {
    Icon: Sparkles,
    title: "System 3 · Decision Support (Advisory)",
    description:
      "AI-assisted summaries, alignment indicators, and review flags to support human decisions. Advisory only; human review required.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/"
              className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md px-1"
              aria-label="clearD homepage"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md brand-mark-chip">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              </div>
              <span className="text-sm font-semibold tracking-tight">clearD</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Button asChild variant="ghost" size="sm">
                <Link href="#audiences">Audiences</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="#systems">Systems</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/csp">CSP</Link>
              </Button>
            </nav>

            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/signup">Get started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="cleard-hero-bg">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
                clearD by MacTech
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-tight mb-6">
                Cleared talent, mission-ready by design.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mb-4">
                clearD is the first clearance-native professional network built for
                transitioning service members, defense contractors, and government
                programs.
              </p>
              <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-2xl mb-8">
                A clearance-first professional identity system and mission-ready
                sourcing platform. AI features provide decision support only — human
                review required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/auth/signup">
                    Create your mission profile
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Audiences */}
        <section id="audiences" className="border-t border-border">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
                Designed for three audiences
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Each audience sees different language and emphasis without changing the
                underlying platform capabilities.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {AUDIENCES.map(({ Icon, title, description }) => (
                <Card key={title} className="transition-colors hover:border-primary/40">
                  <CardHeader>
                    <div className="flex h-9 w-9 items-center justify-center rounded-md brand-mark-chip mb-3">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Systems */}
        <section id="systems" className="border-t border-border bg-card/30">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="max-w-2xl mb-10">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
                Three integrated systems
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                clearD is framed as a cleared talent network, a contractor console, and
                AI-assisted decision support — without automating decisions.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {SYSTEMS.map(({ Icon, title, description }) => (
                <Card key={title} className="transition-colors hover:border-primary/40">
                  <CardHeader>
                    <div className="flex h-9 w-9 items-center justify-center rounded-md brand-mark-chip mb-3">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="border-t border-border">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="max-w-3xl">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
                Defense-aligned, not DoD-endorsed
              </h2>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    clearD supports defense contractors, government programs, and
                    Career Skills Program (CSP) participants with clearance-continuity
                    workflows and mission-ready sourcing. clearD does not claim
                    official DoD endorsement or certification. The platform is
                    operated and supported by MacTech Solutions.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border cleard-hero-bg">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
            <h2 className="text-2xl md:text-4xl font-semibold tracking-tight text-foreground mb-3">
              Ready to start your cleared pathway?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-prose mx-auto">
              Build your Cleared Mission Profile or request access to the clearD
              Contractor Console.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/auth/signup">Get started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/csp">Learn about CSP</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <MacTechFooter />
    </div>
  )
}
