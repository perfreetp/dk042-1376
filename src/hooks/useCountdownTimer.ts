import { useEffect, useRef } from 'react'

interface UseCountdownTimerProps {
  isRunning: boolean
  onTick: () => void
  interval?: number
}

export const useCountdownTimer = ({
  isRunning,
  onTick,
  interval = 1000
}: UseCountdownTimerProps) => {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        onTick()
      }, interval)
      console.log('[useCountdownTimer] 开始计时')
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
        console.log('[useCountdownTimer] 停止计时')
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRunning, onTick, interval])

  return {
    isRunning
  }
}
