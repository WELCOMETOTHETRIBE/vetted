"use client"

import { useEffect } from "react"

export type ConfirmDialogTone = "default" | "danger"

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmDialogTone
  isConfirmLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  isConfirmLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const confirmStyles =
    tone === "danger"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : "bg-primary-700 hover:bg-primary-800 focus:ring-primary-500"

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[3px]" onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="w-full max-w-md rounded-3xl bg-surface-elevated shadow-elevation-5 border border-surface-tertiary/50 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5">
            <div className="text-base font-semibold text-content-primary">{title}</div>
            {description ? (
              <div className="mt-2 text-sm text-content-secondary leading-relaxed">{description}</div>
            ) : null}
          </div>

          <div className="px-5 pb-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isConfirmLoading}
              className="px-4 py-2 rounded-xl border border-surface-tertiary text-content-primary hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirmLoading}
              className={`px-4 py-2 rounded-xl text-white font-semibold shadow-elevation-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmStyles}`}
            >
              {isConfirmLoading ? "Working…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

