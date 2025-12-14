"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import SearchBar from "./SearchBar"

interface NavbarClientProps {
  isAdmin?: boolean
}

const NavbarClient = ({ isAdmin = false }: NavbarClientProps) => {
  const pathname = usePathname()

  // Base navigation items
  const baseNavItems = [
    { href: "/feed", label: "Feed", icon: "📰" },
    { href: "/jobs", label: "Jobs", icon: "💼" },
    { href: "/network", label: "Network", icon: "👥" },
    { href: "/messages", label: "Messages", icon: "💬" },
    { href: "/notifications", label: "Notifications", icon: "🔔" },
  ]

  // Add Candidates tab for admins - ensure it's visible
  const adminNavItems = isAdmin ? [{ href: "/candidates", label: "Candidates", icon: "🎯" }] : []
  const navItems = [...baseNavItems, ...adminNavItems]

  return (
    <nav className="glass-elevated sticky top-0 z-40 backdrop-blur-xl border-b border-surface-tertiary/50 shadow-elevation-1">
      <div className="container-fluid">
        <div className="flex justify-between items-center h-16">
          {/* Logo - More Prominent */}
          <div className="flex items-center">
            <Link href="/feed" className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-1">
              <img
                src="/vetted-logo.png"
                alt="Vetted"
                className="h-10 w-auto"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                  const parent = target.parentElement
                  if (parent && !parent.querySelector(".fallback-logo")) {
                    const fallback = document.createElement("span")
                    fallback.className = "fallback-logo text-2xl font-bold text-primary-600"
                    fallback.textContent = "Vetted"
                    parent.appendChild(fallback)
                  }
                }}
              />
              <span className="hidden md:block text-xl font-bold text-neutral-900">Vetted</span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-4 lg:mx-8">
            <SearchBar />
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname === item.href
                    ? "text-primary-700 bg-primary-50 shadow-sm"
                    : "text-content-secondary hover:bg-surface-secondary hover:text-content-primary"
                } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden text-base" aria-label={item.label}>{item.icon}</span>
              </Link>
            ))}
            {/* Admin tab - separate from main nav items */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === "/admin"
                    ? "text-primary-700 bg-primary-50 shadow-sm"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-primary-600"
                } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`}
                aria-current={pathname === "/admin" ? "page" : undefined}
              >
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden text-base" aria-label="Admin">⚙️</span>
              </Link>
            )}

            {/* Profile Dropdown */}
            <div className="ml-2 relative group">
              <button 
                className="flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                aria-label="Profile menu"
                aria-expanded="false"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  Me
                </div>
                <span className="hidden md:inline text-sm text-neutral-800 font-medium">▼</span>
              </button>
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link
                  href="/profile/edit"
                  className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  href="/profile/edit"
                  className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 transition-colors"
                >
                  Settings
                </Link>
                <div className="border-t border-neutral-200 my-1"></div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block w-full text-left px-4 py-2.5 text-sm text-error-600 hover:bg-error-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavbarClient

