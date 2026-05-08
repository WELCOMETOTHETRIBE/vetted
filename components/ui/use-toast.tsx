"use client";

/**
 * Minimal global toast store for clearD. Imperative `toast(...)` from anywhere
 * on the client; the `<Toaster />` viewport is mounted once inside
 * `<ClearDShell>`. Ported from MacTech Governance for parity.
 */

import * as React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";

export type ToastVariant = "default" | "success" | "warning" | "destructive";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface InternalToast extends ToastInput {
  id: string;
}

type Listener = (toasts: InternalToast[]) => void;

const listeners = new Set<Listener>();
let queue: InternalToast[] = [];

function notify() {
  listeners.forEach((l) => l(queue));
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export function toast(input: ToastInput) {
  const id = genId();
  queue = [{ id, variant: "default", durationMs: 5000, ...input }, ...queue];
  notify();
  return id;
}

function dismiss(id: string) {
  queue = queue.filter((t) => t.id !== id);
  notify();
}

const ICONS = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
} as const;

export function Toaster() {
  const [toasts, setToasts] = React.useState<InternalToast[]>([]);
  React.useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant ?? "default"];
        return (
          <Toast
            key={t.id}
            variant={t.variant}
            duration={t.durationMs ?? 5000}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
          >
            <div className="flex items-start gap-3">
              <Icon className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
              <div className="grid gap-1">
                <ToastTitle>{t.title}</ToastTitle>
                {t.description && <ToastDescription>{t.description}</ToastDescription>}
              </div>
            </div>
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
