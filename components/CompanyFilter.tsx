"use client"

import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Company {
  id: string
  name: string
}

interface CompanyFilterProps {
  companies: Company[]
  selectedCompanyId?: string
}

export default function CompanyFilter({
  companies,
  selectedCompanyId,
}: CompanyFilterProps) {
  const router = useRouter()

  const handleChange = (value: string) => {
    const newParams = new URLSearchParams(window.location.search)
    if (value && value !== "ALL") {
      newParams.set("company", value)
    } else {
      newParams.delete("company")
    }
    router.push(`/jobs?${newParams.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <Label
        htmlFor="company-filter"
        className="text-sm font-medium text-foreground whitespace-nowrap"
      >
        Company:
      </Label>
      <Select
        value={selectedCompanyId || "ALL"}
        onValueChange={handleChange}
      >
        <SelectTrigger id="company-filter" className="min-w-[200px]">
          <SelectValue placeholder="All Companies" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Companies</SelectItem>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
