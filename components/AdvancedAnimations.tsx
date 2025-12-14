"use client"

import { ReactNode, useEffect, useRef, useState } from 'react'

// Advanced Micro-Interaction Components

// Hover Morph Effect - Shape morphing on hover
export function HoverMorph({
  children,
  className = ""
}: {
  children: ReactNode
  className?: string
}) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    let animationFrame: number | undefined

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const deltaX = (x - centerX) / centerX
      const deltaY = (y - centerY) / centerY

      const morphX = deltaX * 10
      const morphY = deltaY * 10

      element.style.borderRadius = `${50 + morphX}% ${50 - morphX}% ${50 - morphY}% ${50 + morphY}% / ${50 + morphY}% ${50 - morphY}% ${50 + morphX}% ${50 - morphX}%`
    }

    const handleMouseLeave = () => {
      element.style.borderRadius = '12px'
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-300 ease-out will-change-transform ${className}`}
      style={{ borderRadius: '12px' }}
    >
      {children}
    </div>
  )
}

// Liquid Button - Fluid-like interactions
export function LiquidButton({
  children,
  onClick,
  className = "",
  variant = "primary"
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: "primary" | "secondary"
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newRipple = {
      id: Date.now(),
      x,
      y
    }

    setRipples(prev => [...prev, newRipple])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)

    onClick?.()
  }

  const baseClasses = "relative overflow-hidden border-none outline-none cursor-pointer transition-all duration-300 ease-out will-change-transform"
  const variantClasses = variant === "primary"
    ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
    : "bg-surface-secondary text-content-primary hover:bg-surface-tertiary hover:scale-102 active:scale-98"

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {/* Ripples */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animation: 'liquid-ripple 0.6s ease-out forwards'
          }}
        />
      ))}

      <span className="relative z-10">{children}</span>
    </button>
  )
}

// Magnetic Effect - Elements attracted to cursor
export function MagneticElement({
  children,
  strength = 0.3,
  className = ""
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const deltaX = e.clientX - centerX
      const deltaY = e.clientY - centerY

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const maxDistance = 100

      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance
        const moveX = deltaX * force * strength
        const moveY = deltaY * force * strength

        element.style.transform = `translate(${moveX}px, ${moveY}px)`
      } else {
        element.style.transform = 'translate(0px, 0px)'
      }
    }

    const handleMouseLeave = () => {
      element.style.transform = 'translate(0px, 0px)'
    }

    document.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [strength])

  return (
    <div
      ref={elementRef}
      className={`transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transform: 'translate(0px, 0px)' }}
    >
      {children}
    </div>
  )
}

// Parallax Scroll Effect
export function ParallaxElement({
  children,
  speed = 0.5,
  className = ""
}: {
  children: ReactNode
  speed?: number
  className?: string
}) {
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleScroll = () => {
      const scrolled = window.pageYOffset
      const rate = scrolled * speed

      element.style.transform = `translateY(${rate}px)`
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return (
    <div ref={elementRef} className={`will-change-transform ${className}`}>
      {children}
    </div>
  )
}

// Stagger Animation for Lists
export function StaggerContainer({
  children,
  staggerDelay = 100,
  className = ""
}: {
  children: ReactNode
  staggerDelay?: number
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const items = container.children
    Array.from(items).forEach((item, index) => {
      const element = item as HTMLElement
      element.style.animationDelay = `${index * staggerDelay}ms`
      element.classList.add('animate-fade-in-up')
    })
  }, [staggerDelay, children])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

// Morphing Shape Background
export function MorphingBackground({
  className = ""
}: {
  className?: string
}) {
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

    // Morphing blob
    let time = 0
    const animate = () => {
      time += 0.01

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const baseRadius = 200

      ctx.save()
      ctx.globalAlpha = 0.1
      ctx.fillStyle = 'hsl(var(--brand-primary))'

      ctx.beginPath()
      for (let i = 0; i <= 360; i += 5) {
        const angle = (i * Math.PI) / 180
        const radius = baseRadius + Math.sin(time + i * 0.1) * 50 + Math.cos(time * 0.5 + i * 0.05) * 30
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius

        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()

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
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
    />
  )
}

// Interactive Cursor Follower
export function CursorFollower({
  children,
  className = ""
}: {
  children: ReactNode
  className?: string
}) {
  const followerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const follower = followerRef.current
    if (!follower) return

    let mouseX = 0
    let mouseY = 0
    let followerX = 0
    let followerY = 0

    const animate = () => {
      const dx = mouseX - followerX
      const dy = mouseY - followerY

      followerX += dx * 0.1
      followerY += dy * 0.1

      follower.style.transform = `translate(${followerX - 25}px, ${followerY - 25}px)`
      requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    document.addEventListener('mousemove', handleMouseMove)
    animate()

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <>
      <div
        ref={followerRef}
        className={`fixed w-12 h-12 bg-primary-500/20 rounded-full blur-xl pointer-events-none z-50 transition-opacity duration-300 ${className}`}
        style={{ transform: 'translate(-50px, -50px)' }}
      />
      {children}
    </>
  )
}

// Progressive Loading Animation
export function ProgressiveLoader({
  isLoading,
  children,
  className = ""
}: {
  isLoading: boolean
  children: ReactNode
  className?: string
}) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setProgress(100)
      return
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 10
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isLoading])

  return (
    <div className={`relative ${className}`}>
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-primary/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <div className="w-64 h-2 bg-surface-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-content-secondary mt-2">Loading experience...</p>
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </div>
  )
}

// Floating Action Button with Morphing
export function MorphingFAB({
  icon,
  onClick,
  className = ""
}: {
  icon: ReactNode
  onClick?: () => void
  className?: string
}) {
  const fabRef = useRef<HTMLButtonElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      ref={fabRef}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full shadow-2xl hover:shadow-primary-xl transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-primary-500/30 z-50 will-change-transform ${className}`}
      style={{
        transform: isHovered ? 'scale(1.1) rotate(180deg)' : 'scale(1) rotate(0deg)',
        borderRadius: isHovered ? '20% 80% 70% 30% / 30% 70% 80% 20%' : '50%'
      }}
    >
      <div className="flex items-center justify-center w-full h-full">
        {icon}
      </div>
    </button>
  )
}

// CSS-in-JS Animation Library (for complex animations)
export const advancedAnimations = {
  // Bounce with easing
  bounceIn: {
    animation: 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Elastic morphing
  elasticMorph: {
    animation: 'elasticMorph 2s ease-in-out infinite',
  },

  // Liquid float
  liquidFloat: {
    animation: 'liquidFloat 6s ease-in-out infinite',
  },

  // Pulse glow
  pulseGlow: {
    animation: 'pulseGlow 2s ease-in-out infinite',
  },

  // Scale bounce
  scaleBounce: {
    animation: 'scaleBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Slide with momentum
  slideMomentum: {
    animation: 'slideMomentum 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },
}

// Custom CSS Animations (to be added to globals.css)
export const animationCSS = `
@keyframes liquid-ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes elasticMorph {
  0%, 100% {
    border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  }
  25% {
    border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
  }
  50% {
    border-radius: 50% 50% 60% 40% / 60% 50% 50% 40%;
  }
  75% {
    border-radius: 40% 60% 50% 50% / 50% 40% 60% 50%;
  }
}

@keyframes liquidFloat {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-10px) rotate(1deg);
  }
  50% {
    transform: translateY(-20px) rotate(0deg);
  }
  75% {
    transform: translateY(-10px) rotate(-1deg);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 20px hsl(var(--brand-primary) / 0.4);
  }
  50% {
    box-shadow: 0 0 40px hsl(var(--brand-primary) / 0.8);
  }
}

@keyframes scaleBounce {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes slideMomentum {
  0% {
    transform: translateX(-100%);
  }
  60% {
    transform: translateX(10%);
  }
  100% {
    transform: translateX(0);
  }
}
`
