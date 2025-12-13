"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

interface Company {
  id: string
  name: string
  slug: string
  logo: string | null
  industry: string | null
  size: string | null
  location: string | null
  _count: {
    employees: number
    jobs: number
    posts: number
  }
}

interface CompaniesContentProps {
  initialCompanies: Company[]
}

export default function CompaniesContent({
  initialCompanies,
}: CompaniesContentProps) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [search, setSearch] = useState("")
  const [filteredCompanies, setFilteredCompanies] = useState(companies)

  const handleSearch = (value: string) => {
    setSearch(value)
    if (!value.trim()) {
      setFilteredCompanies(companies)
      return
    }

    const filtered = companies.filter(
      (company) =>
        company.name.toLowerCase().includes(value.toLowerCase()) ||
        company.industry?.toLowerCase().includes(value.toLowerCase()) ||
        company.location?.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredCompanies(filtered)
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search companies by name, industry, or location..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4 mb-4">
                {company.logo ? (
                  <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center relative flex-shrink-0">
                    <Image
                      src={company.logo}
                      alt={company.name}
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-2xl font-bold flex-shrink-0">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                    {company.name}
                  </h3>
                  {company.industry && (
                    <p className="text-sm text-gray-600 truncate">
                      {company.industry}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {company.location && (
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span className="truncate">{company.location}</span>
                  </div>
                )}
                {company.size && (
                  <div className="flex items-center gap-2">
                    <span>👥</span>
                    <span>{company.size} employees</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                <span>{company._count.employees} employees</span>
                <span>•</span>
                <span>{company._count.jobs} jobs</span>
                <span>•</span>
                <span>{company._count.posts} posts</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600">
            {search
              ? "No companies found matching your search."
              : "No companies available at the moment."}
          </p>
        </div>
      )}
    </div>
  )
}

