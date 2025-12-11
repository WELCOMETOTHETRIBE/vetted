"use client"

import { useRouter } from "next/navigation"

interface Company {
  id: string
  name: string
}

interface CompanyFilterProps {
  companies: Company[]
  selectedCompanyId?: string
}

export default function CompanyFilter({ companies, selectedCompanyId }: CompanyFilterProps) {
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParams = new URLSearchParams(window.location.search)
    if (e.target.value) {
      newParams.set("company", e.target.value)
    } else {
      newParams.delete("company")
    }
    router.push(`/jobs?${newParams.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="company-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Company:
      </label>
      <select
        id="company-filter"
        value={selectedCompanyId || ""}
        onChange={handleChange}
        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white min-w-[200px]"
      >
        <option value="">All Companies</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </div>
  )
}

