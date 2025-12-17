"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import SearchBar from "./SearchBar"

interface NavbarClientProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  userId?: string
  isAdmin?: boolean
}

const NavbarClient = ({ user, userId, isAdmin = false }: NavbarClientProps) => {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen])

  // Base navigation items - include candidates for all users
  const baseNavItems = [
    { href: "/feed", label: "Feed", icon: "📰", iconOnly: false },
    { href: "/jobs", label: "Jobs", icon: "💼", iconOnly: false },
    { href: "/candidates", label: "Candidates", icon: "🎯", iconOnly: false },
    { href: "/network", label: "Network", icon: "👥", iconOnly: false },
    { href: "/messages", label: "Messages", icon: "💬", iconOnly: true },
    { href: "/notifications", label: "Notifications", icon: "🔔", iconOnly: true },
  ]

  // Add Admin tab for admins
  const adminNavItems = isAdmin ? [{ href: "/admin", label: "Admin", icon: "⚙️", iconOnly: true }] : []
  const navItems = [...baseNavItems, ...adminNavItems]

  return (
    <nav className="glass-elevated sticky top-0 z-40 backdrop-blur-xl border-b border-surface-tertiary/50 shadow-elevation-1">
      <div className="container-fluid">
        <div className="flex justify-between items-center h-16">
          {/* Logo - More Prominent */}
          <div className="flex items-center">
            <Link href="/feed" className="flex items-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-1">
              <img
                src="/vetted_2.png"
                alt="Vetted"
                className="h-20 w-auto"
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
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-4 lg:mx-8">
            <SearchBar />
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isIconOnly = item.iconOnly || false
              const isActive = pathname === item.href
              
              // Render icon-only items (Admin, Notifications, Messages)
              if (isIconOnly) {
                let iconSvg = null
                if (item.href === "/admin") {
                  // Robot/Administrator icon
                  iconSvg = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  )
                } else if (item.href === "/notifications") {
                  // Bell icon
                  iconSvg = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  )
                } else if (item.href === "/messages") {
                  // Letter/Envelope icon
                  iconSvg = (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )
                }
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`p-2.5 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "text-primary-700 bg-primary-50 shadow-sm"
                        : "text-content-secondary hover:bg-surface-secondary hover:text-content-primary"
                    } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    title={item.label}
                  >
                    {iconSvg}
                  </Link>
                )
              }
              
              // Render text items (Feed, Jobs, Candidates, Network)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "text-primary-700 bg-primary-50 shadow-sm"
                      : "text-content-secondary hover:bg-surface-secondary hover:text-content-primary"
                  } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden text-base" aria-label={item.label}>{item.icon}</span>
                </Link>
              )
            })}

            {/* Profile Dropdown */}
            <div className="ml-2 relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 px-2 py-2 rounded-lg hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                aria-label="Profile menu"
                aria-expanded={dropdownOpen}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline text-sm text-neutral-800 font-medium ml-2">
                  {user?.name || 'User'} ▼
                </span>
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
                  {userId && (
                    <Link
                      href={`/profile/${userId}`}
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 transition-colors"
                    >
                      View My Profile
                    </Link>
                  )}
                  <Link
                    href="/profile/edit"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 transition-colors"
                  >
                    Settings
                  </Link>
                  <div className="border-t border-neutral-200 my-1"></div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      signOut({ callbackUrl: "/" })
                    }}
                    className="block w-full text-left px-4 py-2.5 text-sm text-error-600 hover:bg-error-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavbarClient

