import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ProfileSectionCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function ProfileSectionCard({
  title,
  children,
  className,
}: ProfileSectionCardProps) {
  return (
    <Card className={cn("mb-4", className)}>
      <CardContent className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-5 pb-3 border-b border-border">
          {title}
        </h2>
        {children}
      </CardContent>
    </Card>
  )
}
