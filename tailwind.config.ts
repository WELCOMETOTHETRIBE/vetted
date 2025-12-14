import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", "[data-theme='dark']"],
  theme: {
    extend: {
      // Advanced Color System with Semantic Tokens
      colors: {
        // Brand Identity - Professional Blue with depth
        brand: {
          50: "#eff8ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Semantic Colors with improved accessibility
        primary: {
          50: "#eff8ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        secondary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        // Semantic Status Colors
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        info: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        // Advanced Neutral Scale
        neutral: {
          50: "#fafbfc",
          100: "#f6f8fa",
          200: "#e9ecef",
          300: "#dee2e6",
          400: "#ced4da",
          500: "#adb5bd",
          600: "#6c757d",
          700: "#495057",
          800: "#343a40",
          900: "#212529",
          950: "#0a0a0a",
        },
        // Surface System for Depth
        surface: {
          primary: "hsl(var(--surface-primary) / <alpha-value>)",
          secondary: "hsl(var(--surface-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--surface-tertiary) / <alpha-value>)",
          elevated: "hsl(var(--surface-elevated) / <alpha-value>)",
          overlay: "hsl(var(--surface-overlay) / <alpha-value>)",
        },
        // Content Colors
        content: {
          primary: "hsl(var(--content-primary) / <alpha-value>)",
          secondary: "hsl(var(--content-secondary) / <alpha-value>)",
          tertiary: "hsl(var(--content-tertiary) / <alpha-value>)",
          inverse: "hsl(var(--content-inverse) / <alpha-value>)",
        },
        // Interactive States
        interactive: {
          hover: "hsl(var(--interactive-hover) / <alpha-value>)",
          active: "hsl(var(--interactive-active) / <alpha-value>)",
          focus: "hsl(var(--interactive-focus) / <alpha-value>)",
          disabled: "hsl(var(--interactive-disabled) / <alpha-value>)",
        },
        // Special Accent Colors
        accent: {
          purple: "#8b5cf6",
          pink: "#ec4899",
          orange: "#f97316",
          teal: "#14b8a6",
          cyan: "#06b6d4",
          indigo: "#6366f1",
          emerald: "#10b981",
          lime: "#84cc16",
        },
      },

      // Fluid Typography System
      fontSize: {
        "fluid-xs": "clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)",
        "fluid-sm": "clamp(0.875rem, 0.8rem + 0.375vw, 1rem)",
        "fluid-base": "clamp(1rem, 0.9rem + 0.5vw, 1.125rem)",
        "fluid-lg": "clamp(1.125rem, 1rem + 0.625vw, 1.25rem)",
        "fluid-xl": "clamp(1.25rem, 1.125rem + 0.625vw, 1.5rem)",
        "fluid-2xl": "clamp(1.5rem, 1.25rem + 1vw, 2rem)",
        "fluid-3xl": "clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)",
        "fluid-4xl": "clamp(2.25rem, 1.75rem + 2.5vw, 3.5rem)",
        "fluid-5xl": "clamp(3rem, 2.25rem + 3.75vw, 5rem)",
        "fluid-6xl": "clamp(3.75rem, 2.75rem + 5vw, 7rem)",
        "fluid-7xl": "clamp(4.5rem, 3rem + 7.5vw, 9rem)",
        "fluid-8xl": "clamp(6rem, 4rem + 10vw, 12rem)",
        "fluid-9xl": "clamp(8rem, 5rem + 15vw, 16rem)",
      },

      // Advanced Spacing System (8px grid with meaningful steps)
      spacing: {
        "fluid-px": "clamp(1px, 0.1vw, 2px)",
        "fluid-0.5": "clamp(2px, 0.2vw, 4px)",
        "fluid-1": "clamp(4px, 0.4vw, 8px)",
        "fluid-1.5": "clamp(6px, 0.6vw, 12px)",
        "fluid-2": "clamp(8px, 0.8vw, 16px)",
        "fluid-2.5": "clamp(10px, 1vw, 20px)",
        "fluid-3": "clamp(12px, 1.2vw, 24px)",
        "fluid-3.5": "clamp(14px, 1.4vw, 28px)",
        "fluid-4": "clamp(16px, 1.6vw, 32px)",
        "fluid-5": "clamp(20px, 2vw, 40px)",
        "fluid-6": "clamp(24px, 2.4vw, 48px)",
        "fluid-7": "clamp(28px, 2.8vw, 56px)",
        "fluid-8": "clamp(32px, 3.2vw, 64px)",
        "fluid-9": "clamp(36px, 3.6vw, 72px)",
        "fluid-10": "clamp(40px, 4vw, 80px)",
        "fluid-12": "clamp(48px, 4.8vw, 96px)",
        "fluid-16": "clamp(64px, 6.4vw, 128px)",
        "fluid-20": "clamp(80px, 8vw, 160px)",
        "fluid-24": "clamp(96px, 9.6vw, 192px)",
        "fluid-32": "clamp(128px, 12.8vw, 256px)",
        "fluid-40": "clamp(160px, 16vw, 320px)",
        "fluid-48": "clamp(192px, 19.2vw, 384px)",
        "fluid-56": "clamp(224px, 22.4vw, 448px)",
        "fluid-64": "clamp(256px, 25.6vw, 512px)",
      },

      // Advanced Border Radius System
      borderRadius: {
        "fluid-xs": "clamp(2px, 0.2vw, 4px)",
        "fluid-sm": "clamp(4px, 0.4vw, 8px)",
        "fluid-md": "clamp(6px, 0.6vw, 12px)",
        "fluid-lg": "clamp(8px, 0.8vw, 16px)",
        "fluid-xl": "clamp(12px, 1.2vw, 24px)",
        "fluid-2xl": "clamp(16px, 1.6vw, 32px)",
        "fluid-3xl": "clamp(20px, 2vw, 40px)",
        "fluid-full": "9999px",
      },

      // Advanced Shadow System with Layers
      boxShadow: {
        // Semantic Shadows
        "elevation-0": "none",
        "elevation-1": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "elevation-2": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "elevation-3": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "elevation-4": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "elevation-5": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "elevation-6": "0 25px 50px -12px rgb(0 0 0 / 0.25)",

        // Colored Shadows for Interactive Elements
        "brand-xs": "0 1px 2px 0 rgb(37 99 235 / 0.05)",
        "brand-sm": "0 1px 3px 0 rgb(37 99 235 / 0.1), 0 1px 2px -1px rgb(37 99 235 / 0.1)",
        "brand-md": "0 4px 6px -1px rgb(37 99 235 / 0.1), 0 2px 4px -2px rgb(37 99 235 / 0.1)",
        "brand-lg": "0 10px 15px -3px rgb(37 99 235 / 0.1), 0 4px 6px -4px rgb(37 99 235 / 0.1)",
        "brand-xl": "0 20px 25px -5px rgb(37 99 235 / 0.1), 0 8px 10px -6px rgb(37 99 235 / 0.1)",

        // Glow Effects
        "glow-xs": "0 0 0 1px rgb(37 99 235 / 0.1)",
        "glow-sm": "0 0 0 2px rgb(37 99 235 / 0.1)",
        "glow-md": "0 0 0 4px rgb(37 99 235 / 0.15)",
        "glow-lg": "0 0 0 8px rgb(37 99 235 / 0.1)",

        // Inner Shadows for Inset Effects
        "inner-xs": "inset 0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "inner-sm": "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        "inner-md": "inset 0 4px 8px 0 rgb(0 0 0 / 0.05)",

        // Special Effects
        "spotlight": "0 0 20px 5px rgb(37 99 235 / 0.1)",
        "card-hover": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1), 0 0 0 1px rgb(37 99 235 / 0.05)",
      },

      // Advanced Motion System
      animation: {
        // Micro-interactions
        "micro-bounce": "microBounce 0.2s ease-out",
        "micro-scale": "microScale 0.15s ease-out",
        "micro-rotate": "microRotate 0.2s ease-out",

        // Page Transitions
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "fade-in-down": "fadeInDown 0.6s ease-out",
        "fade-in-left": "fadeInLeft 0.6s ease-out",
        "fade-in-right": "fadeInRight 0.6s ease-out",
        "slide-in-up": "slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-down": "slideInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)",

        // Loading States
        "pulse-soft": "pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer": "shimmer 2s linear infinite",
        "skeleton": "skeleton 1.5s ease-in-out infinite",

        // Advanced Interactions
        "bounce-gentle": "bounceGentle 0.8s ease-out",
        "float": "float 3s ease-in-out infinite",
        "wiggle": "wiggle 0.5s ease-in-out",
        "heartbeat": "heartbeat 1.5s ease-in-out infinite",

        // Complex Animations
        "morph": "morph 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        "liquid": "liquid 2s ease-in-out infinite",
        "breathe": "breathe 4s ease-in-out infinite",
      },

      keyframes: {
        // Micro-interactions
        microBounce: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" },
        },
        microScale: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        microRotate: {
          "0%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(5deg)" },
          "75%": { transform: "rotate(-5deg)" },
          "100%": { transform: "rotate(0deg)" },
        },

        // Page Transitions
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInLeft: {
          "0%": { opacity: "0", transform: "translateX(-30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        fadeInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        slideInDown: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },

        // Loading States
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        skeleton: {
          "0%": { opacity: "0.6" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.6" },
        },

        // Advanced Interactions
        bounceGentle: {
          "0%, 20%, 53%, 80%, 100%": { transform: "translateY(0)" },
          "40%, 43%": { transform: "translateY(-8px)" },
          "70%": { transform: "translateY(-4px)" },
          "90%": { transform: "translateY(-2px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },

        // Complex Animations
        morph: {
          "0%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "50%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
          "100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
        },
        liquid: {
          "0%": { borderRadius: "50% 50% 50% 50% / 50% 50% 50% 50%" },
          "25%": { borderRadius: "60% 40% 50% 50% / 50% 60% 40% 50%" },
          "50%": { borderRadius: "50% 50% 60% 40% / 60% 50% 50% 40%" },
          "75%": { borderRadius: "40% 60% 50% 50% / 50% 40% 60% 50%" },
          "100%": { borderRadius: "50% 50% 50% 50% / 50% 50% 50% 50%" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.05)", opacity: "0.8" },
        },
      },

      // Advanced Transition System
      transitionDuration: {
        "0": "0ms",
        "25": "25ms",
        "50": "50ms",
        "75": "75ms",
        "100": "100ms",
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
        "400": "400ms",
        "500": "500ms",
        "600": "600ms",
        "700": "700ms",
        "800": "800ms",
        "900": "900ms",
        "1000": "1000ms",
      },

      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "bounce-out": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "ease-in-expo": "cubic-bezier(0.95, 0.05, 0.795, 0.035)",
        "ease-out-expo": "cubic-bezier(0.19, 1, 0.22, 1)",
        "ease-in-back": "cubic-bezier(0.6, -0.28, 0.735, 0.045)",
        "ease-out-back": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "ease-in-circ": "cubic-bezier(0.6, 0.04, 0.98, 0.335)",
        "ease-out-circ": "cubic-bezier(0.075, 0.82, 0.165, 1)",
        "spring": "cubic-bezier(0.16, 1, 0.3, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
}

export default config

