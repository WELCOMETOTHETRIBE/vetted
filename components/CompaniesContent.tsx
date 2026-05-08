"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface Company {
  id: string
  name: string
  slug: string
  logo: string | null
  industry: string | null
  size: string | null
  location: string | null
  _count: { employees: number; jobs: number; posts: number }
}

interface CompaniesContentProps {
  initialCompanies: Company[]
}

export default function CompaniesContent({
  initialCompanies,
}: CompaniesContentProps) {
  const [companies] = useState(initialCompanies)
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
        company.location?.toLowerCase().includes(value.toLowerCase()),
    )
    setFilteredCompanies(filtered)
  }

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search companies by name, industry, or location…"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        aria-label="Search companies"
      />

      {filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            >
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {company.logo ? (
                      <div className="w-14 h-14 rounded-md border border-border flex items-center justify-center relative flex-shrink-0 bg-secondary p-1.5">
                        <Image
                          src={company.logo}
                          alt={company.name}
                          width={56}
                          height={56}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-md bg-primary/15 text-primary flex items-center justify-center text-lg font-semibold flex-shrink-0 border border-border">
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground mb-1 truncate">
                        {company.name}
                      </h3>
                      {company.industry && (
                        <p className="text-sm text-muted-foreground truncate">
                          {company.industry}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {company.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        <span className="truncate">{company.location}</span>
                      </div>
                    )}
                    {company.size && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" aria-hidden />
                        <span>{company.size} employees</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border flex gap-3 text-xs text-muted-foreground flex-wrap">
                    <span>{company._count.employees} employees</span>
                    <span>•</span>
                    <span>{company._count.jobs} jobs</span>
                    <span>•</span>
                    <span>{company._count.posts} posts</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {search
                ? "No companies found matching your search."
                : "No companies available at the moment."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
