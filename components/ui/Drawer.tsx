"use client"

import { ReactNode, useEffect } from "react"

export interface DrawerProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  widthClassName?: string
}

export default function Drawer({
  open,
  title,
  children,
  onClose,
  footer,
  widthClassName = "max-w-xl",
}: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full sm:w-[32rem] ${widthClassName}`}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="h-full bg-surface-elevated border-l border-surface-tertiary/50 shadow-elevation-6 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-16 px-5 flex items-center justify-between border-b border-surface-tertiary/50 bg-surface-secondary/40">
            <div className="font-semibold text-content-primary truncate">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">{children}</div>

          {footer ? (
            <div className="border-t border-surface-tertiary/50 p-4 bg-surface-secondary/40">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

