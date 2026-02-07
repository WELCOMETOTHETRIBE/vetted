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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobilePanelRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (mobilePanelRef.current && !mobilePanelRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
        setMobileSearchOpen(false)
      }
    }

    if (dropdownOpen || mobileMenuOpen || mobileSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownOpen, mobileMenuOpen, mobileSearchOpen])

  // Base navigation items
  const basePrimaryNavItems = [
    { href: "/feed", label: "Feed", icon: "📰", iconOnly: false },
    { href: "/jobs", label: "Jobs", icon: "💼", iconOnly: false },
  ]
  const baseIconNavItems = [
    { href: "/messages", label: "Messages", icon: "💬", iconOnly: true },
    { href: "/notifications", label: "Notifications", icon: "🔔", iconOnly: true },
  ]

  // Add Admin tab for admins
  const adminNavItems = isAdmin
    ? [
        { href: "/candidates", label: "Talent Pool", icon: "🎯", iconOnly: false },
        { href: "/admin", label: "Console", icon: "⚙️", iconOnly: true },
      ]
    : []
  const adminPrimaryNavItems = adminNavItems.filter((i) => !i.iconOnly)
  const adminIconNavItems = adminNavItems.filter((i) => i.iconOnly)

  // Desktop order: primary links -> admin primary -> icon links (messages/bell) -> admin icon (console)
  const navItems = [...basePrimaryNavItems, ...adminPrimaryNavItems, ...baseIconNavItems, ...adminIconNavItems]
  const mobileNavItems = [
    ...basePrimaryNavItems,
    ...adminPrimaryNavItems,
    { href: "/messages", label: "Messages", icon: "💬", iconOnly: false },
    { href: "/notifications", label: "Notifications", icon: "🔔", iconOnly: false },
    ...(isAdmin ? [{ href: "/admin", label: "Console", icon: "⚙️", iconOnly: false }] : []),
  ]

  return (
    <nav className="glass-elevated sticky top-0 z-40 backdrop-blur-xl border-b border-surface-tertiary/50 shadow-elevation-1">
      <div className="container-fluid">
        <div className="flex justify-between items-center h-16">
          {/* Logo - More Prominent */}
          <div className="flex items-center">
            <Link href="/feed" className="flex items-center hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-1">
              <img
                src="/cleard-mark.png"
                alt="clearD"
                className="h-10 sm:h-12 md:h-14 w-auto"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                  const parent = target.parentElement
                  if (parent && !parent.querySelector(".fallback-logo")) {
                    const fallback = document.createElement("span")
                    fallback.className = "fallback-logo text-2xl font-bold text-primary-600"
                    fallback.textContent = "clearD"
                    parent.appendChild(fallback)
                  }
                }}
              />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden md:block flex-1 max-w-xl mx-4 lg:mx-8">
            <SearchBar />
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {/* Mobile actions */}
            <div className="flex md:hidden items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen((v) => !v)
                  setMobileMenuOpen(false)
                }}
                className="p-2.5 rounded-xl text-content-secondary hover:bg-surface-secondary hover:text-content-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                aria-label="Search"
                aria-expanded={mobileSearchOpen}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              {isAdmin && (
                <Link
                  href="/candidates"
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    pathname === "/candidates"
                      ? "text-primary-700 bg-primary-50 shadow-sm"
                      : "text-content-secondary hover:bg-surface-secondary hover:text-content-primary"
                  } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`}
                  aria-label="Talent Pool"
                  title="Talent Pool"
                >
                  <span className="text-base" aria-hidden="true">🎯</span>
                </Link>
              )}

              <Link
                href="/messages"
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  pathname === "/messages"
                    ? "text-primary-700 bg-primary-50 shadow-sm"
                    : "text-content-secondary hover:bg-surface-secondary hover:text-content-primary"
                } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`}
                aria-label="Messages"
                title="Messages"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </Link>

              <Link
                href="/notifications"
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  pathname === "/notifications"
                    ? "text-primary-700 bg-primary-50 shadow-sm"
                    : "text-content-secondary hover:bg-surface-secondary hover:text-content-primary"
                } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`}
                aria-label="Notifications"
                title="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen((v) => !v)
                  setMobileSearchOpen(false)
                }}
                className="p-2.5 rounded-xl text-content-secondary hover:bg-surface-secondary hover:text-content-primary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                aria-label="Menu"
                aria-expanded={mobileMenuOpen}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isIconOnly = item.iconOnly || false
                const isActive = pathname === item.href
                
                // Render icon-only items (Console, Notifications, Messages)
                if (isIconOnly) {
                  let iconSvg = null
                  if (item.href === "/admin") {
                    iconSvg = (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                      </svg>
                    )
                  } else if (item.href === "/notifications") {
                    iconSvg = (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    )
                  } else if (item.href === "/messages") {
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
                        View Mission Profile
                      </Link>
                    )}
                    <Link
                      href="/profile/edit"
                      onClick={() => setDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 transition-colors"
                    >
                      Profile & Settings
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
      </div>

      {/* Mobile overlays */}
      {(mobileMenuOpen || mobileSearchOpen) && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-50">
          <div
            ref={mobilePanelRef}
            className="absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl border-l border-neutral-200 flex flex-col"
          >
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-neutral-900 truncate">{user?.name || "User"}</div>
                  <div className="text-xs text-neutral-600 truncate">{user?.email || ""}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setMobileSearchOpen(false)
                }}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                aria-label="Close panel"
              >
                <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              {mobileSearchOpen && (
                <div className="mb-4">
                  <SearchBar />
                </div>
              )}

              {mobileMenuOpen && (
                <div className="space-y-1">
                  {mobileNavItems.map((item) => {
                    const active = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                          active ? "bg-primary-50 text-primary-700" : "text-neutral-800 hover:bg-neutral-50"
                        }`}
                      >
                        <span className="text-base" aria-hidden="true">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}

                  <div className="pt-2 mt-2 border-t border-neutral-200" />

                  {userId && (
                    <Link
                      href={`/profile/${userId}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
                    >
                      <span className="text-base" aria-hidden="true">🪪</span>
                      <span>Mission Profile</span>
                    </Link>
                  )}
                  <Link
                    href="/profile/edit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors"
                  >
                    <span className="text-base" aria-hidden="true">⚙️</span>
                    <span>Profile & Settings</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-error-700 hover:bg-error-50 transition-colors"
                  >
                    <span className="text-base" aria-hidden="true">⎋</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default NavbarClient

