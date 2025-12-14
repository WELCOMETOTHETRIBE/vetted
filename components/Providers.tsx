"use client"

import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { SessionProvider } from 'next-auth/react'

// Advanced Theme System - Enterprise Grade
type Theme = 'light' | 'dark' | 'high-contrast' | 'auto'
type MotionPreference = 'normal' | 'reduced' | 'none'

interface ThemeContextType {
  theme: Theme
  motionPreference: MotionPreference
  setTheme: (theme: Theme) => void
  setMotionPreference: (preference: MotionPreference) => void
  isSystemDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  defaultMotion?: MotionPreference
}

function ThemeProvider({
  children,
  defaultTheme = 'auto',
  defaultMotion = 'normal'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [motionPreference, setMotionPreferenceState] = useState<MotionPreference>(defaultMotion)
  const [isSystemDark, setIsSystemDark] = useState(false)

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    const updateSystemTheme = () => setIsSystemDark(mediaQuery.matches)
    const updateMotionPreference = () => {
      if (motionQuery.matches) {
        setMotionPreferenceState('reduced')
      }
    }

    updateSystemTheme()
    updateMotionPreference()

    mediaQuery.addEventListener('change', updateSystemTheme)
    motionQuery.addEventListener('change', updateMotionPreference)

    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme)
      motionQuery.removeEventListener('change', updateMotionPreference)
    }
  }, [])

  // Load saved preferences
  useEffect(() => {
    const savedTheme = localStorage.getItem('vetted-theme') as Theme
    const savedMotion = localStorage.getItem('vetted-motion') as MotionPreference

    if (savedTheme && ['light', 'dark', 'high-contrast', 'auto'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
    if (savedMotion && ['normal', 'reduced', 'none'].includes(savedMotion)) {
      setMotionPreferenceState(savedMotion)
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    const appliedTheme = theme === 'auto' ? (isSystemDark ? 'dark' : 'light') : theme

    root.setAttribute('data-theme', appliedTheme)

    // Apply motion preferences
    if (motionPreference === 'reduced' || motionPreference === 'none') {
      root.style.setProperty('--animation-duration', '0.01ms')
      root.style.setProperty('--transition-duration', '0.01ms')
    } else {
      root.style.removeProperty('--animation-duration')
      root.style.removeProperty('--transition-duration')
    }

    // Save to localStorage
    localStorage.setItem('vetted-theme', theme)
    localStorage.setItem('vetted-motion', motionPreference)

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      const themeColor = appliedTheme === 'dark' ? '#0a0a0a' : '#ffffff'
      metaThemeColor.setAttribute('content', themeColor)
    }

  }, [theme, motionPreference, isSystemDark])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const setMotionPreference = (preference: MotionPreference) => {
    setMotionPreferenceState(preference)
  }

  const value = {
    theme,
    motionPreference,
    setTheme,
    setMotionPreference,
    isSystemDark,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Advanced Intersection Observer for scroll animations
function ScrollObserverProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, observerOptions)

    // Observe all elements with animate-on-scroll class
    const animatedElements = document.querySelectorAll('.animate-on-scroll')
    animatedElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return <>{children}</>
}

// Performance monitoring and analytics (would be expanded in real implementation)
function PerformanceProvider({ children }: { children: ReactNode }) {
  // Placeholder for future performance monitoring
  return <>{children}</>
}

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <ScrollObserverProvider>
          <PerformanceProvider>
            {children}
          </PerformanceProvider>
        </ScrollObserverProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}

