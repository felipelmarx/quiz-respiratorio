'use client'

import { useEffect, useRef } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface RealtimeBadgeProps {
  userId: string | null
  userRole: 'admin' | 'instructor' | null
}

export function RealtimeBadge({ userId, userRole }: RealtimeBadgeProps) {
  const { newResponses, latestResponse, resetCount } = useRealtime({
    userId,
    userRole,
  })
  const { toasts, addToast, dismiss } = useToast()
  const prevLatestRef = useRef<string | null>(null)

  // Show toast when a new response arrives
  useEffect(() => {
    if (!latestResponse) return
    // Avoid duplicate toasts for the same response
    if (prevLatestRef.current === latestResponse.id) return
    prevLatestRef.current = latestResponse.id

    const score = latestResponse.total_score
    addToast(
      `Nova resposta recebida! Score: ${score}/33`,
      'info'
    )
  }, [latestResponse, addToast])

  return (
    <>
      {/* Toast notifications portal */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {/* Badge — only visible when there are new responses */}
      {newResponses > 0 && (
        <button
          onClick={resetCount}
          title={`${newResponses} nova${newResponses > 1 ? 's' : ''} resposta${newResponses > 1 ? 's' : ''}`}
          className={cn(
            'relative inline-flex items-center justify-center',
            'h-5 min-w-[20px] rounded-full px-1.5',
            'bg-[#C6A868] text-[#0A192F] text-[11px] font-bold',
            'animate-pulse-gold',
            'transition-transform hover:scale-110'
          )}
        >
          {newResponses > 99 ? '99+' : newResponses}
        </button>
      )}
    </>
  )
}
