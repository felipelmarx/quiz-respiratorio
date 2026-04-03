'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface QuizResponsePayload {
  id: string
  lead_id: string | null
  instructor_id: string | null
  answers: Record<string, unknown>
  scores: Record<string, number>
  total_score: number
  profile: string
  created_at: string
}

interface UseRealtimeOptions {
  /** Current user's ID (from auth) */
  userId: string | null
  /** Current user's role */
  userRole: 'admin' | 'instructor' | null
  /** Whether realtime is enabled */
  enabled?: boolean
}

interface UseRealtimeReturn {
  newResponses: number
  latestResponse: QuizResponsePayload | null
  resetCount: () => void
}

/**
 * Subscribe to real-time INSERT events on the quiz_responses table.
 * - Admins see all inserts.
 * - Instructors only see inserts where instructor_id matches their user ID.
 * Debounces rapid bursts (500ms) so we don't overwhelm the UI with toasts.
 */
export function useRealtime({
  userId,
  userRole,
  enabled = true,
}: UseRealtimeOptions): UseRealtimeReturn {
  const [newResponses, setNewResponses] = useState(0)
  const [latestResponse, setLatestResponse] = useState<QuizResponsePayload | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pendingCountRef = useRef(0)
  const pendingPayloadRef = useRef<QuizResponsePayload | null>(null)

  const resetCount = useCallback(() => {
    setNewResponses(0)
  }, [])

  useEffect(() => {
    if (!enabled || !userId || !userRole) return

    const supabase = createClient()

    // Build the channel subscription based on role
    const channelName = `quiz-responses-${userId}`

    let channel: RealtimeChannel

    if (userRole === 'admin') {
      // Admins subscribe to all inserts
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'quiz_responses',
          },
          (payload) => handleNewResponse(payload.new as QuizResponsePayload)
        )
    } else {
      // Instructors: filter by their instructor_id
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'quiz_responses',
            filter: `instructor_id=eq.${userId}`,
          },
          (payload) => handleNewResponse(payload.new as QuizResponsePayload)
        )
    }

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('[useRealtime] Channel subscription error')
      }
    })

    channelRef.current = channel

    function handleNewResponse(payload: QuizResponsePayload) {
      // Debounce: accumulate count and keep latest payload
      pendingCountRef.current += 1
      pendingPayloadRef.current = payload

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        const count = pendingCountRef.current
        const latest = pendingPayloadRef.current
        pendingCountRef.current = 0
        pendingPayloadRef.current = null

        setNewResponses((prev) => prev + count)
        if (latest) {
          setLatestResponse(latest)
        }
      }, 500)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, userRole, enabled])

  return { newResponses, latestResponse, resetCount }
}
