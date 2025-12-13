"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  className?: string
}

const Sidebar = ({ className = "" }: SidebarProps) => {
  const pathname = usePathname()

  const quickLinks = [
    { href: "/groups", label: "Groups", icon: "👥" },
    { href: "/companies", label: "Companies", icon: "🏢" },
    { href: "/admin", label: "Admin", icon: "⚙️" },
  ]

  return (
    <aside className={`w-64 bg-white border-r border-gray-200 p-4 ${className}`}>
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Quick Links
          </h3>
          <ul className="space-y-1">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    pathname === link.href
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Resources
          </h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/market"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname === "/market"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>📊</span>
                <span>Market Intelligence</span>
              </Link>
            </li>
            <li>
              <Link
                href="/help"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname === "/help"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>📚</span>
                <span>Help Center</span>
              </Link>
            </li>
            <li>
              <Link
                href="/tips"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname === "/tips"
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>💡</span>
                <span>Tips & Tricks</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

