"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function JobFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [location, setLocation] = useState(searchParams.get("location") || "")
  const [remote, setRemote] = useState(searchParams.get("remote") === "true")
  const [employmentType, setEmploymentType] = useState(
    searchParams.get("employmentType") || "ALL",
  )

  const handleFilter = () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (location) params.set("location", location)
    if (remote) params.set("remote", "true")
    if (employmentType && employmentType !== "ALL") {
      params.set("employmentType", employmentType)
    }
    router.push(`/jobs?${params.toString()}`)
  }

  const hasActiveFilters =
    !!search || !!location || remote || (employmentType && employmentType !== "ALL")

  const handleClearFilters = () => {
    setSearch("")
    setLocation("")
    setRemote(false)
    setEmploymentType("ALL")
    router.push("/jobs")
  }

  return (
    <Card className="lg:sticky lg:top-20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-semibold text-foreground">Filters</h3>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={handleClearFilters}
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="job-search">Search Jobs</Label>
            <Input
              id="job-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              placeholder="Job title, keywords, company…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-location">Location</Label>
            <Input
              id="job-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              placeholder="City, State, Country"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="job-remote"
              checked={remote}
              onCheckedChange={(c) => setRemote(c === true)}
            />
            <Label htmlFor="job-remote" className="font-normal cursor-pointer">
              Remote only
            </Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-emptype">Employment Type</Label>
            <Select value={employmentType} onValueChange={setEmploymentType}>
              <SelectTrigger id="job-emptype">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="FULL_TIME">Full Time</SelectItem>
                <SelectItem value="PART_TIME">Part Time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="INTERNSHIP">Internship</SelectItem>
                <SelectItem value="TEMPORARY">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-2">
            <Button type="button" onClick={handleFilter} className="w-full">
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleClearFilters}
                className="w-full"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
