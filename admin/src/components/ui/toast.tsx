'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type ToastVariant = 'success' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  exiting?: boolean
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

// ── Variant styles (Navy/Gold branding) ───────────────────────────────────────

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-l-4 border-l-green-500 bg-[#0A192F] text-white',
  info: 'border-l-4 border-l-[#C6A868] bg-[#0A192F] text-white',
  warning: 'border-l-4 border-l-yellow-400 bg-[#0A192F] text-white',
}

const variantIcons: Record<ToastVariant, string> = {
  success: '\u2713',
  info: '\u2139',
  warning: '\u26A0',
}

// ── Single Toast ──────────────────────────────────────────────────────────────

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg min-w-[320px] max-w-[420px]',
        'transition-all duration-300 ease-out',
        toast.exiting
          ? 'opacity-0 translate-x-full'
          : 'opacity-100 translate-x-0 animate-slide-in-right',
        variantStyles[toast.variant]
      )}
      role="alert"
    >
      <span className="mt-0.5 text-sm font-bold shrink-0">
        {variantIcons[toast.variant]}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-0.5 text-white/60 hover:text-white transition-colors"
        aria-label="Fechar notificacao"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Toast Container ───────────────────────────────────────────────────────────

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ── useToast hook ─────────────────────────────────────────────────────────────

let toastIdCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const dismiss = useCallback((id: string) => {
    // Start exit animation
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)))
    // Remove after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 300)
    // Clean up timer
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `toast-${++toastIdCounter}`
      const toast: Toast = { id, message, variant }

      setToasts((prev) => {
        // Max 5 toasts at once
        const next = [...prev, toast]
        return next.length > 5 ? next.slice(-5) : next
      })

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        dismiss(id)
      }, 5000)
      timersRef.current.set(id, timer)

      return id
    },
    [dismiss]
  )

  // Clean up all timers on unmount
  useEffect(() => {
    const currentTimers = timersRef.current
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer))
      currentTimers.clear()
    }
  }, [])

  return { toasts, addToast, dismiss }
}
