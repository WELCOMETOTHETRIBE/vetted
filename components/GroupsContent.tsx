"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import CreateGroupModal from "./CreateGroupModal"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Group {
  id: string
  name: string
  description: string
  owner: { id: string; name: string | null }
  memberships?: { id: string }[]
}

interface Membership {
  group: Group
}

interface GroupsContentProps {
  initialData: {
    allGroups: Group[]
    myGroups: Membership[]
  }
  currentUserId: string
}

export default function GroupsContent({
  initialData,
}: GroupsContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"all" | "my">("all")
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleJoin = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
      })
      if (response.ok) router.refresh()
    } catch (error) {
      console.error("Error joining group:", error)
    }
  }

  const handleLeave = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
      })
      if (response.ok) router.refresh()
    } catch (error) {
      console.error("Error leaving group:", error)
    }
  }

  const isMember = (group: Group) =>
    group.memberships ? group.memberships.length > 0 : false

  const TabButton = ({
    value,
    children,
  }: {
    value: "all" | "my"
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t",
        activeTab === value
          ? "text-primary border-primary"
          : "text-muted-foreground border-transparent hover:text-foreground",
      )}
      role="tab"
      aria-selected={activeTab === value}
    >
      {children}
    </button>
  )

  const renderGroup = (group: Group) => (
    <Card key={group.id} className="transition-colors hover:border-primary/40">
      <CardContent className="p-6">
        <Link
          href={`/groups/${group.id}`}
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <h3 className="text-base font-semibold text-foreground mb-2 hover:text-primary transition-colors">
            {group.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {group.description}
        </p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground">
            Created by {group.owner.name}
          </span>
          {isMember(group) ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleLeave(group.id)}
            >
              Leave
            </Button>
          ) : (
            <Button size="sm" onClick={() => handleJoin(group.id)}>
              Join
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div role="tablist" className="flex border-b border-border">
          <TabButton value="all">All Groups</TabButton>
          <TabButton value="my">My Groups ({initialData.myGroups.length})</TabButton>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-3.5 w-3.5" aria-hidden /> Create Group
        </Button>
      </div>

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {activeTab === "all" ? (
        initialData.allGroups.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No public groups yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialData.allGroups.map(renderGroup)}
          </div>
        )
      ) : initialData.myGroups.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">You haven’t joined any groups yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialData.myGroups.map((membership) => (
            <Card key={membership.group.id} className="transition-colors hover:border-primary/40">
              <CardContent className="p-6">
                <Link
                  href={`/groups/${membership.group.id}`}
                  className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <h3 className="text-base font-semibold text-foreground mb-2 hover:text-primary transition-colors">
                    {membership.group.name}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {membership.group.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
