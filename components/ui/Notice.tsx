"use client"

export type NoticeTone = "info" | "success" | "error"

export interface NoticeProps {
  tone: NoticeTone
  title?: string
  message: string
  onDismiss?: () => void
}

export default function Notice({ tone, title, message, onDismiss }: NoticeProps) {
  const styles =
    tone === "success"
      ? "bg-[hsl(var(--glow-success))] border-[hsl(var(--success)/0.25)] text-content-primary"
      : tone === "error"
        ? "bg-[hsl(var(--glow-error))] border-[hsl(var(--error)/0.25)] text-content-primary"
        : "bg-[hsl(var(--glow-primary))] border-[hsl(var(--brand-primary)/0.25)] text-content-primary"

  return (
    <div className={`rounded-2xl border p-4 flex items-start justify-between gap-4 ${styles}`}>
      <div className="min-w-0">
        {title ? <div className="font-semibold">{title}</div> : null}
        <div className="text-sm text-content-secondary leading-relaxed">{message}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-1.5 rounded-xl hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  )
}

