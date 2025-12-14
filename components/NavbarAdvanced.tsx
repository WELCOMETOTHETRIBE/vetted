"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useTheme } from "./Providers"

// Advanced Search Component with Filters
function AdvancedSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState({
    type: "all",
    location: "",
    experience: ""
  })
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={searchRef} className="relative flex-1 max-w-xl mx-4 lg:mx-8">
      <div className="relative">
        <input
          type="text"
          placeholder="Search jobs, people, companies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="input-modern w-full pl-12 pr-4 py-3 text-lg bg-surface-primary border-2 border-surface-tertiary rounded-2xl focus:border-primary-500 transition-all duration-300"
        />
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-content-tertiary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-content-tertiary hover:text-content-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* Advanced Search Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-elevated rounded-2xl p-6 shadow-2xl animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2">Search Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="input-modern w-full"
              >
                <option value="all">All</option>
                <option value="jobs">Jobs</option>
                <option value="people">People</option>
                <option value="companies">Companies</option>
                <option value="posts">Posts</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2">Location</label>
              <input
                type="text"
                placeholder="City, State, or Remote"
                value={filters.location}
                onChange={(e) => setFilters({...filters, location: e.target.value})}
                className="input-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-content-secondary mb-2">Experience</label>
              <select
                value={filters.experience}
                onChange={(e) => setFilters({...filters, experience: e.target.value})}
                className="input-modern w-full"
              >
                <option value="">Any Level</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="executive">Executive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-content-tertiary">
              Press Enter to search or Esc to close
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setQuery("")
                  setFilters({ type: "all", location: "", experience: "" })
                }}
                className="px-4 py-2 text-sm text-content-secondary hover:text-content-primary transition-colors"
              >
                Clear
              </button>
              <button className="btn-primary-modern px-6 py-2 text-sm">
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Notification System with Real-time Updates
function NotificationBell({ count }: { count: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  // Mock notifications - in real app, this would come from API
  const notifications = [
    { id: 1, type: "connection", message: "John Doe accepted your connection request", time: "2m ago", unread: true },
    { id: 2, type: "job", message: "New job match: Senior Developer at Tech Corp", time: "1h ago", unread: true },
    { id: 3, type: "message", message: "Sarah Wilson sent you a message", time: "3h ago", unread: false },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={bellRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-surface-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label={`Notifications ${count > 0 ? `(${count} unread)` : ''}`}
      >
        <svg className="w-6 h-6 text-content-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7V4a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2m0 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2z" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-error-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 glass-elevated rounded-2xl shadow-2xl animate-slide-down max-h-96 overflow-hidden">
          <div className="p-4 border-b border-surface-tertiary">
            <h3 className="font-semibold text-content-primary">Notifications</h3>
            <p className="text-sm text-content-secondary">{count} unread</p>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-surface-secondary transition-colors border-b border-surface-tertiary last:border-b-0 ${
                  notification.unread ? 'bg-primary-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notification.unread ? 'bg-primary-500' : 'bg-transparent'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-content-primary leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-xs text-content-tertiary mt-1">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-surface-tertiary">
            <Link
              href="/notifications"
              className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              onClick={() => setIsOpen(false)}
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// Advanced Profile Dropdown with Quick Actions
function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-surface-secondary transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Profile menu"
        aria-expanded={isOpen}
      >
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg">
            JD
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success-500 rounded-full border-2 border-surface-primary" />
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-content-primary">John Doe</div>
          <div className="text-xs text-content-secondary">Senior Developer</div>
        </div>
        <svg
          className={`w-4 h-4 text-content-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-elevated rounded-2xl shadow-2xl animate-slide-down">
          {/* Quick Actions */}
          <div className="p-4 border-b border-surface-tertiary">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                JD
              </div>
              <div>
                <div className="font-medium text-content-primary">John Doe</div>
                <div className="text-sm text-content-secondary">Senior Developer</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/profile/edit"
                className="btn-ghost px-3 py-2 text-sm text-center"
                onClick={() => setIsOpen(false)}
              >
                View Profile
              </Link>
              <Link
                href="/profile/edit"
                className="btn-ghost px-3 py-2 text-sm text-center"
                onClick={() => setIsOpen(false)}
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/settings"
              className="block px-4 py-3 text-sm text-content-primary hover:bg-surface-secondary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              ⚙️ Settings
            </Link>
            <Link
              href="/help"
              className="block px-4 py-3 text-sm text-content-primary hover:bg-surface-secondary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              ❓ Help & Support
            </Link>
            <Link
              href="/feedback"
              className="block px-4 py-3 text-sm text-content-primary hover:bg-surface-secondary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              💬 Send Feedback
            </Link>
          </div>

          <div className="border-t border-surface-tertiary">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="block w-full text-left px-4 py-3 text-sm text-error-600 hover:bg-error-50 transition-colors"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Mega Menu Component for Navigation
function MegaMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div
        ref={menuRef}
        className="glass-elevated rounded-2xl shadow-2xl w-full max-w-4xl mx-4 animate-slide-down"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8">
          {/* Jobs Section */}
          <div>
            <h3 className="font-semibold text-content-primary mb-4 flex items-center gap-2">
              💼 Jobs
            </h3>
            <div className="space-y-3">
              <Link href="/jobs" className="block p-3 rounded-lg hover:bg-surface-secondary transition-colors" onClick={onClose}>
                <div className="font-medium text-content-primary">Browse Jobs</div>
                <div className="text-sm text-content-secondary">Find your next opportunity</div>
              </Link>
              <Link href="/jobs/saved" className="block p-3 rounded-lg hover:bg-surface-secondary transition-colors" onClick={onClose}>
                <div className="font-medium text-content-primary">Saved Jobs</div>
                <div className="text-sm text-content-secondary">Your bookmarked positions</div>
              </Link>
              <Link href="/jobs/applications" className="block p-3 rounded-lg hover:bg-surface-secondary transition-colors" onClick={onClose}>
                <div className="font-medium text-content-primary">My Applications</div>
                <div className="text-sm text-content-secondary">Track your progress</div>
              </Link>
            </div>
          </div>

          {/* Network Section */}
          <div>
            <h3 className="font-semibold text-content-primary mb-4 flex items-center gap-2">
              👥 Network
            </h3>
            <div className="space-y-3">
              <Link href="/network" className="block p-3 rounded-lg hover:bg-surface-secondary transition-colors" onClick={onClose}>
                <div className="font-medium text-content-primary">My Network</div>
                <div className="text-sm text-content-secondary">Manage connections</div>
              </Link>
              <Link href="/network/discover" className="block p-3 rounded-lg hover:bg-surface-secondary transition-colors" onClick={onClose}>
                <div className="font-medium text-content-primary">Discover People</div>
                <div className="text-sm text-content-secondary">Find new connections</div>
              </Link>
              <Link href="/network/invitations" className="block p-3 rounded-lg hover:bg-surface-secondary transition-colors" onClick={onClose}>
                <div className="font-medium text-content-primary">Invitations</div>
                <div className="text-sm text-content-secondary">Pending requests</div>
              </Link>
            </div>
          </div>

          {/* More Section */}
          <div>
            <h3 className="font-semibold text-content-primary mb-4 flex items-center gap-2">
              🌟 More
            </h3>
            <div className="space-y-3">
              <Link href="/feed" className="block p-3 rounded-lg hover:bg-surface-secondary transition-colors" onClick={onClose}>
                <div className="font-medium text-content-primary">Feed</div>
                <div className="text-sm text-content-secondary">Latest updates</div>
              </Link>
              <Link href="/messages" className="block p-3 rounded-lg hover:bg-surface-secondary transition-colors" onClick={onClose}>
                <div className="font-medium text-content-primary">Messages</div>
                <div className="text-sm text-content-secondary">Chat with connections</div>
              </Link>
              <Link href="/tips" className="block p-3 rounded-lg hover:bg-surface-secondary transition-colors" onClick={onClose}>
                <div className="font-medium text-content-primary">Career Tips</div>
                <div className="text-sm text-content-secondary">Professional advice</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface NavbarAdvancedProps {
  isAdmin?: boolean
}

const NavbarAdvanced = ({ isAdmin = false }: NavbarAdvancedProps) => {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Base navigation items
  const navItems = [
    { href: "/feed", label: "Feed", icon: "📰" },
    { href: "/jobs", label: "Jobs", icon: "💼" },
    { href: "/network", label: "Network", icon: "👥" },
    { href: "/messages", label: "Messages", icon: "💬" },
  ]

  return (
    <>
      <nav className="glass-elevated sticky top-0 z-40 backdrop-blur-xl border-b border-surface-tertiary/50 shadow-elevation-1">
        <div className="container-fluid">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/feed" className="flex items-center space-x-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-1">
                <img
                  src="/vetted.png"
                  alt="Vetted"
                  className="h-10 w-auto"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = "none"
                    const parent = target.parentElement
                    if (parent && !parent.querySelector(".fallback-logo")) {
                      const fallback = document.createElement("span")
                      fallback.className = "fallback-logo text-2xl font-bold text-primary-600"
                      fallback.textContent = "Vetted"
                    }
                  }}
                />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-1">
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
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <AdvancedSearch />

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Command Palette Trigger */}
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-content-secondary bg-surface-secondary rounded-xl hover:bg-surface-tertiary transition-colors"
                title="Command Palette (⌘K)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden lg:inline">⌘K</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-xl hover:bg-surface-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {/* Notifications */}
              <NotificationBell count={3} />

              {/* Profile Dropdown */}
              <ProfileDropdown />

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-surface-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label="Menu"
                aria-expanded={isMenuOpen}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>

              {/* Admin Panel */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    pathname === "/admin"
                      ? "text-primary-700 bg-primary-50 shadow-sm"
                      : "text-content-secondary hover:bg-surface-secondary hover:text-content-primary"
                  } focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`}
                  aria-current={pathname === "/admin" ? "page" : undefined}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mega Menu */}
      <MegaMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* Command Palette */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20">
          <div className="glass-elevated rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-slide-down">
            <div className="p-4 border-b border-surface-tertiary">
              <input
                type="text"
                placeholder="Type a command or search..."
                className="w-full bg-transparent border-none outline-none text-lg"
                autoFocus
              />
            </div>
            <div className="p-4">
              <div className="text-center text-content-secondary py-8">
                Command palette feature - Full implementation would include search across all app functions
              </div>
            </div>
            <div className="p-4 border-t border-surface-tertiary">
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="w-full text-center text-sm text-content-secondary hover:text-content-primary"
              >
                Press Esc to close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NavbarAdvanced
