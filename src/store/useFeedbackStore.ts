import { create } from 'zustand'
import { SleepFeedback } from '@/types'
import dayjs from 'dayjs'

interface FeedbackState {
  currentFeedback: Partial<SleepFeedback> | null
  isSubmitting: boolean
  hasPendingFeedback: boolean
  initFeedback: (sceneId: string, userStateId: string, duration: number) => void
  setFasterAsleep: (value: 'yes' | 'no' | 'somewhat') => void
  setWokeUp: (value: 'never' | 'once' | 'multiple') => void
  setSoundHarsh: (value: 'yes' | 'no' | 'somewhat') => void
  submitFeedback: () => Promise<boolean>
  resetCurrentFeedback: () => void
  checkPendingFeedback: () => boolean
}

const generateId = () => `feedback-${Date.now()}`

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  currentFeedback: null,
  isSubmitting: false,
  hasPendingFeedback: false,

  initFeedback: (sceneId: string, userStateId: string, duration: number) => {
    set({
      currentFeedback: {
        sceneId,
        userStateId,
        duration,
        date: dayjs().format('YYYY-MM-DD')
      }
    })
    console.log('[FeedbackStore] initFeedback', { sceneId, userStateId, duration })
  },

  setFasterAsleep: (value: 'yes' | 'no' | 'somewhat') => {
    set(state => ({
      currentFeedback: state.currentFeedback
        ? { ...state.currentFeedback, fasterAsleep: value }
        : null
    }))
  },

  setWokeUp: (value: 'never' | 'once' | 'multiple') => {
    set(state => ({
      currentFeedback: state.currentFeedback
        ? { ...state.currentFeedback, wokeUp: value }
        : null
    }))
  },

  setSoundHarsh: (value: 'yes' | 'no' | 'somewhat') => {
    set(state => ({
      currentFeedback: state.currentFeedback
        ? { ...state.currentFeedback, soundHarsh: value }
        : null
    }))
  },

  submitFeedback: async (): Promise<boolean> => {
    const state = get()
    if (!state.currentFeedback ||
        !state.currentFeedback.fasterAsleep ||
        !state.currentFeedback.wokeUp ||
        !state.currentFeedback.soundHarsh) {
      console.error('[FeedbackStore] submitFeedback - 反馈不完整')
      return false
    }

    set({ isSubmitting: true })

    try {
      const feedback: SleepFeedback = {
        ...state.currentFeedback,
        id: generateId(),
        createdAt: Date.now()
      } as SleepFeedback

      const existingFeedbacks = JSON.parse(localStorage.getItem('sleepFeedbacks') || '[]')
      const allFeedbacks = [feedback, ...existingFeedbacks]
      localStorage.setItem('sleepFeedbacks', JSON.stringify(allFeedbacks))

      const preferenceStore = JSON.parse(localStorage.getItem('userPreference') || '{}')
      const recentFeedbacks = allFeedbacks.slice(0, 3)
      preferenceStore.feedbackCount = (preferenceStore.feedbackCount || 0) + 1
      preferenceStore.recentFeedbacks = recentFeedbacks

      if (recentFeedbacks.length >= 3) {
        const sceneScores: Record<string, number> = {}
        recentFeedbacks.forEach((fb: SleepFeedback) => {
          const score =
            (fb.fasterAsleep === 'yes' ? 2 : fb.fasterAsleep === 'somewhat' ? 1 : 0) +
            (fb.wokeUp === 'never' ? 2 : fb.wokeUp === 'once' ? 1 : 0) +
            (fb.soundHarsh === 'no' ? 2 : fb.soundHarsh === 'somewhat' ? 1 : 0)
          sceneScores[fb.sceneId] = (sceneScores[fb.sceneId] || 0) + score
        })

        let bestSceneId = Object.keys(sceneScores)[0]
        let bestScore = sceneScores[bestSceneId]
        Object.keys(sceneScores).forEach(sceneId => {
          if (sceneScores[sceneId] > bestScore) {
            bestScore = sceneScores[sceneId]
            bestSceneId = sceneId
          }
        })

        preferenceStore.recommendedSceneId = bestSceneId
        console.log('[FeedbackStore] 三次反馈后推荐场景:', { bestSceneId, bestScore, sceneScores })
      }

      localStorage.setItem('userPreference', JSON.stringify(preferenceStore))

      set({
        currentFeedback: null,
        isSubmitting: false,
        hasPendingFeedback: false
      })

      console.log('[FeedbackStore] submitFeedback - 成功', feedback)
      return true
    } catch (error) {
      console.error('[FeedbackStore] submitFeedback - 失败', error)
      set({ isSubmitting: false })
      return false
    }
  },

  resetCurrentFeedback: () => {
    set({
      currentFeedback: null,
      isSubmitting: false
    })
  },

  checkPendingFeedback: (): boolean => {
    const records = JSON.parse(localStorage.getItem('sleepRecords') || '[]')
    const feedbacks = JSON.parse(localStorage.getItem('sleepFeedbacks') || '[]')
    const feedbackDates = new Set(feedbacks.map((f: SleepFeedback) => f.date))

    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    const hasYesterdayRecord = records.some((r: { date: string }) => r.date === yesterday)
    const hasYesterdayFeedback = feedbackDates.has(yesterday)

    const hasPending = hasYesterdayRecord && !hasYesterdayFeedback
    set({ hasPendingFeedback: hasPending })

    return hasPending
  }
}))
