interface ProfileSectionCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function ProfileSectionCard({
  title,
  children,
  className = "",
}: ProfileSectionCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 mb-4 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  )
}

