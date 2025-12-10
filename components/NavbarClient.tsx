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

  // Add Candidates tab for admins
  const navItems = isAdmin
    ? [...baseNavItems, { href: "/candidates", label: "Candidates", icon: "🎯" }]
    : baseNavItems

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/feed" className="flex items-center space-x-2">
              <img
                src="/vetted-logo.png"
                alt="Vetted"
                className="h-8 w-auto"
                onError={(e) => {
                  // Fallback to text if image fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                  const parent = target.parentElement
                  if (parent && !parent.querySelector(".fallback-logo")) {
                    const fallback = document.createElement("span")
                    fallback.className = "fallback-logo text-2xl font-bold text-blue-600"
                    fallback.textContent = "Vetted"
                    parent.appendChild(fallback)
                  }
                }}
              />
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <SearchBar />
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.icon}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === "/admin"
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">⚙️</span>
              </Link>
            )}

            {/* Profile Dropdown */}
            <div className="ml-4 relative group">
              <button className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                  Me
                </div>
                <span className="hidden md:inline text-sm text-gray-700">▼</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <Link
                  href="/profile/edit"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View Profile
                </Link>
                <Link
                  href="/profile/edit"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

