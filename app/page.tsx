"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "@/components/Providers"

// Advanced Particle System Component
function ParticleSystem() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Particle system
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      opacity: number
      color: string
    }> = []

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        color: `hsl(${214 + Math.random() * 20}, 100%, ${60 + Math.random() * 20}%)`
      })
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Draw particle
        ctx.save()
        ctx.globalAlpha = particle.opacity
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        // Add glow effect
        ctx.shadowColor = particle.color
        ctx.shadowBlur = particle.size * 2
        ctx.fill()
        ctx.restore()

        // Draw connections to nearby particles
        particles.slice(index + 1).forEach(otherParticle => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.save()
            ctx.globalAlpha = (1 - distance / 100) * 0.1
            ctx.strokeStyle = particle.color
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()
            ctx.restore()
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

// 3D Card Component with hover effects
function FeatureCard3D({
  icon,
  title,
  description,
  delay = 0
}: {
  icon: string
  title: string
  description: string
  delay?: number
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = (y - centerY) / 10
      const rotateY = (centerX - x) / 10

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`
    }

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className="card-modern p-8 text-center group cursor-pointer animate-on-scroll"
      style={{
        animationDelay: `${delay}s`,
        transformStyle: 'preserve-3d'
      }}
    >
      <div className="relative mb-6">
        <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300" />
      </div>

      <h3 className="text-2xl font-bold mb-4 text-gradient group-hover:scale-105 transition-transform duration-300">
        {title}
      </h3>

      <p className="text-content-secondary leading-relaxed group-hover:text-content-primary transition-colors duration-300">
        {description}
      </p>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-primary-700/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  )
}

// Animated counter component
function AnimatedCounter({
  end,
  suffix = "",
  duration = 2000
}: {
  end: number
  suffix?: string
  duration?: number
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(easeOutCubic * end))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [end, duration])

  return (
    <span className="text-gradient font-bold">
      {count.toLocaleString()}{suffix}
    </span>
  )
}

// Magnetic button component
function MagneticButton({
  children,
  href,
  variant = "primary"
}: {
  children: React.ReactNode
  href: string
  variant?: "primary" | "secondary"
}) {
  const buttonRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      const distance = Math.sqrt(x * x + y * y)
      const maxDistance = 50

      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance
        const moveX = (x / distance) * force * 10
        const moveY = (y / distance) * force * 10

        button.style.transform = `translate(${moveX}px, ${moveY}px)`
      } else {
        button.style.transform = 'translate(0px, 0px)'
      }
    }

    const handleMouseLeave = () => {
      button.style.transform = 'translate(0px, 0px)'
    }

    button.addEventListener('mousemove', handleMouseMove)
    button.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      button.removeEventListener('mousemove', handleMouseMove)
      button.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  const baseClasses = "btn-modern inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 will-change-transform"
  const variantClasses = variant === "primary"
    ? "btn-primary-modern shadow-2xl hover:shadow-primary-xl"
    : "btn-ghost border-2 border-primary-500 hover:border-primary-600"

  return (
    <Link
      ref={buttonRef}
      href={href}
      className={`${baseClasses} ${variantClasses}`}
      style={{ transform: 'translate(0px, 0px)' }}
    >
      {children}
    </Link>
  )
}

export default function Home() {
  const { theme, setTheme } = useTheme()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Particle Background */}
      <ParticleSystem />

      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-3 rounded-full glass hover:bg-surface-elevated transition-all duration-300"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="glass-elevated sticky top-0 z-40 backdrop-blur-xl border-b border-surface-tertiary/50">
          <div className="container-fluid">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <img
                  src="/cleard.png"
                  alt="clearD"
                  className="h-10 w-auto"
                  loading="eager"
                />
              </Link>

              <div className="hidden md:flex items-center space-x-8">
                <Link href="#features" className="text-content-secondary hover:text-content-primary transition-colors">
                  Systems
                </Link>
                <Link href="#stats" className="text-content-secondary hover:text-content-primary transition-colors">
                  Audiences
                </Link>
                <Link href="/csp" className="text-content-secondary hover:text-content-primary transition-colors">
                  CSP
                </Link>
                <Link href="#about" className="text-content-secondary hover:text-content-primary transition-colors">
                  About
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-content-secondary hover:text-content-primary font-medium transition-colors"
                >
                  Sign In
                </Link>
                <MagneticButton href="/auth/signup" variant="secondary">
                  Get Started
                  <span className="text-xl">→</span>
                </MagneticButton>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative py-32 md:py-40">
          <div className="container-fluid text-center">
            {/* Logo */}
            <div className={`flex justify-center mb-10 transition-all duration-1000 ${isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <img
                src="/cleard.png"
                alt="clearD"
                className="h-[clamp(6rem,18vw,18rem)] w-auto drop-shadow-2xl"
                loading="eager"
              />
            </div>

            {/* Hero Content */}
            <div className={`space-y-8 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="text-fluid-5xl md:text-fluid-7xl font-bold text-balance leading-tight">
                <span className="text-gradient">The Cleared Talent Network</span> for Mission-Ready Defense Work
              </h1>

              <p className="text-fluid-xl text-content-secondary max-w-4xl mx-auto leading-relaxed text-balance">
                clearD is the first clearance-native professional network built for transitioning service members, defense contractors, and government programs.
              </p>

              <p className="text-base text-content-tertiary max-w-4xl mx-auto leading-relaxed text-balance">
                Built as a clearance-first professional identity system and mission-ready sourcing platform. AI features provide decision support only—human review required.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-8">
                <MagneticButton href="/auth/signup">
                  <span>Create your mission profile</span>
                  <span className="text-xl animate-bounce">🚀</span>
                </MagneticButton>

                <MagneticButton href="/auth/signin" variant="secondary">
                  <span>Sign In</span>
                  <span className="text-xl">→</span>
                </MagneticButton>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute top-1/4 left-10 animate-float" style={{ animationDelay: '0s' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-full blur-xl" />
            </div>
            <div className="absolute top-1/3 right-16 animate-float" style={{ animationDelay: '2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-success-400/20 to-success-600/20 rounded-full blur-xl" />
            </div>
            <div className="absolute bottom-1/4 left-20 animate-float" style={{ animationDelay: '4s' }}>
              <div className="w-24 h-24 bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 rounded-full blur-xl" />
            </div>
          </div>
        </section>

        {/* Audiences Section */}
        <section id="stats" className="py-24 bg-surface-secondary/50 backdrop-blur-sm">
          <div className="container-fluid">
            <div className="text-center mb-12">
              <h2 className="text-fluid-3xl md:text-fluid-4xl font-bold mb-4 text-gradient">
                Designed for three audiences
              </h2>
              <p className="text-fluid-lg text-content-secondary max-w-3xl mx-auto">
                Each audience sees different language and emphasis—without changing the underlying platform capabilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard3D
                icon="🧭"
                title="Cleared Professionals"
                description="Build a Cleared Mission Profile that preserves clearance continuity and mission readiness—especially during transition."
                delay={0.1}
              />
              <FeatureCard3D
                icon="🛡️"
                title="Defense Contractors / GovCon Teams"
                description="Invitation-only sourcing and mission-fit evaluation for cleared roles with audit-friendly workflows."
                delay={0.3}
              />
              <FeatureCard3D
                icon="⚙️"
                title="Admin / Operator (MacTech Solutions)"
                description="Operated and supported by MacTech Solutions to onboard contractors, run CSP pilots, and ensure compliance awareness."
                delay={0.5}
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32">
          <div className="container-fluid">
            <div className="text-center mb-20">
              <h2 className="text-fluid-4xl md:text-fluid-5xl font-bold mb-6 text-gradient">
                Three integrated systems
              </h2>
              <p className="text-fluid-xl text-content-secondary max-w-3xl mx-auto">
                clearD is framed as a cleared talent network, a contractor console, and AI-assisted decision support—without automating decisions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard3D
                icon="🪪"
                title="System 1: Cleared Professional Network"
                description="A clearance-first professional identity system centered on Cleared Mission Profiles, validated capabilities, and a trusted network."
                delay={0.1}
              />
              <FeatureCard3D
                icon="🗂️"
                title="System 2: Contractor Sourcing & Console"
                description="Private, invitation-only sourcing for cleared hiring teams: cleared talent pools, mission-fit evaluation, and operator workflows."
                delay={0.3}
              />
              <FeatureCard3D
                icon="🧠"
                title="System 3: Decision Support (Advisory)"
                description="AI-assisted summaries, alignment indicators, and review flags to support human decisions. Advisory only; human review required."
                delay={0.5}
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 bg-surface-secondary/40 backdrop-blur-sm">
          <div className="container-fluid">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-fluid-4xl font-bold mb-6 text-gradient text-center">
                Defense-aligned, not DoD-endorsed
              </h2>
              <div className="card-modern p-8">
                <p className="text-content-secondary leading-relaxed">
                  clearD supports defense contractors, government programs, and Career Skills Program (CSP) participants with clearance-continuity workflows and mission-ready sourcing.
                  clearD does not claim official DoD endorsement or certification. The platform is operated and supported by MacTech Solutions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/20 dark:to-primary-900/20">
          <div className="container-fluid text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-fluid-4xl md:text-fluid-5xl font-bold mb-6 text-balance">
                Ready to start your cleared pathway?
              </h2>
              <p className="text-fluid-xl text-content-secondary mb-12 text-balance">
                Build your Cleared Mission Profile or request access to the clearD Contractor Console.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <MagneticButton href="/auth/signup">
                  <span>Get started</span>
                  <span className="text-xl">✨</span>
                </MagneticButton>

                <MagneticButton href="/csp" variant="secondary">
                  <span>Learn about CSP</span>
                  <span className="text-xl">▶️</span>
                </MagneticButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
