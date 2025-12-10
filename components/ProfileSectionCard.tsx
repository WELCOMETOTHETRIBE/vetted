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
    <div className={`bg-white rounded-xl border border-gray-200 p-6 mb-4 shadow-sm ${className}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

