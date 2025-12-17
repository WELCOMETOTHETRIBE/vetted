"use client"

import Link from "next/link"
import Image from "next/image"
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
                <Image
                  src="/vetted.png"
                  alt="Vetted"
                  width={120}
                  height={48}
                  className="h-12 w-auto"
                  priority
                />
              </Link>

              <div className="hidden md:flex items-center space-x-8">
                <Link href="#features" className="text-content-secondary hover:text-content-primary transition-colors">
                  Features
                </Link>
                <Link href="#stats" className="text-content-secondary hover:text-content-primary transition-colors">
                  Stats
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
            {/* Animated Logo */}
            <div className={`flex justify-center mb-12 transition-all duration-1000 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="relative">
                <Image
                  src="/vetted_2.png"
                  alt="Vetted"
                  width={350}
                  height={140}
                  className="h-44 w-auto drop-shadow-2xl animate-float"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-primary-600/20 blur-3xl animate-pulse" />
              </div>
            </div>

            {/* Hero Content */}
            <div className={`space-y-8 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="text-fluid-5xl md:text-fluid-7xl font-bold text-balance leading-tight">
                Connect. <span className="text-gradient">Grow.</span> Get Hired.
              </h1>

              <p className="text-fluid-xl text-content-secondary max-w-4xl mx-auto leading-relaxed text-balance">
                Experience the future of professional networking with AI-powered insights,
                immersive connections, and opportunities that match your potential.
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-8">
                <MagneticButton href="/auth/signup">
                  <span>Join Vetted</span>
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

        {/* Stats Section */}
        <section id="stats" className="py-24 bg-surface-secondary/50 backdrop-blur-sm">
          <div className="container-fluid">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="animate-on-scroll">
                <div className="text-fluid-4xl font-bold mb-2">
                  <AnimatedCounter end={50000} suffix="+" />
                </div>
                <div className="text-content-secondary">Professionals</div>
              </div>
              <div className="animate-on-scroll" style={{ animationDelay: '0.2s' }}>
                <div className="text-fluid-4xl font-bold mb-2">
                  <AnimatedCounter end={10000} suffix="+" />
                </div>
                <div className="text-content-secondary">Companies</div>
              </div>
              <div className="animate-on-scroll" style={{ animationDelay: '0.4s' }}>
                <div className="text-fluid-4xl font-bold mb-2">
                  <AnimatedCounter end={250000} suffix="+" />
                </div>
                <div className="text-content-secondary">Connections</div>
              </div>
              <div className="animate-on-scroll" style={{ animationDelay: '0.6s' }}>
                <div className="text-fluid-4xl font-bold mb-2">
                  <AnimatedCounter end={95} suffix="%" />
                </div>
                <div className="text-content-secondary">Success Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32">
          <div className="container-fluid">
            <div className="text-center mb-20">
              <h2 className="text-fluid-4xl md:text-fluid-5xl font-bold mb-6 text-gradient">
                Revolutionize Your Career Journey
              </h2>
              <p className="text-fluid-xl text-content-secondary max-w-3xl mx-auto">
                Cutting-edge features powered by advanced AI and human-centered design
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard3D
                icon="🎯"
                title="AI-Powered Matching"
                description="Advanced algorithms analyze your profile and preferences to find the perfect opportunities and connections."
                delay={0.1}
              />
              <FeatureCard3D
                icon="🚀"
                title="Career Acceleration"
                description="Get personalized insights, mentorship opportunities, and skill development recommendations."
                delay={0.3}
              />
              <FeatureCard3D
                icon="🌟"
                title="Immersive Networking"
                description="Experience professional networking like never before with virtual events and AI-facilitated introductions."
                delay={0.5}
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/20 dark:to-primary-900/20">
          <div className="container-fluid text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-fluid-4xl md:text-fluid-5xl font-bold mb-6 text-balance">
                Ready to Transform Your Professional Life?
              </h2>
              <p className="text-fluid-xl text-content-secondary mb-12 text-balance">
                Join thousands of professionals who have accelerated their careers with Vetted
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <MagneticButton href="/auth/signup">
                  <span>Start Your Journey</span>
                  <span className="text-xl">✨</span>
                </MagneticButton>

                <MagneticButton href="/demo" variant="secondary">
                  <span>Watch Demo</span>
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
