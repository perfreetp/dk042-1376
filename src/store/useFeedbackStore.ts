import { create } from 'zustand'
import { SleepFeedback, SleepRecord } from '@/types'
import dayjs from 'dayjs'
import { normalizeSleepRecords } from '@/utils/sleep'

interface FeedbackState {
  currentFeedback: Partial<SleepFeedback> | null
  isSubmitting: boolean
  hasPendingFeedback: boolean
  pendingRecord: SleepRecord | null
  checkPendingFeedback: () => boolean
  getPendingRecord: () => SleepRecord | null
  initFeedbackFromRecord: (record: SleepRecord) => void
  setFasterAsleep: (value: 'yes' | 'no' | 'somewhat') => void
  setWokeUp: (value: 'never' | 'once' | 'multiple') => void
  setSoundHarsh: (value: 'yes' | 'no' | 'somewhat') => void
  submitFeedback: () => Promise<boolean>
  resetCurrentFeedback: () => void
}

const generateId = () => `feedback-${Date.now()}`

const readRecords = (): SleepRecord[] => {
  try {
    const raw: SleepRecord[] = JSON.parse(localStorage.getItem('sleepRecords') || '[]')
    return normalizeSleepRecords(raw)
  } catch {
    return []
  }
}

const writeRecords = (records: SleepRecord[]) => {
  localStorage.setItem('sleepRecords', JSON.stringify(records.slice(0, 30)))
}

const readFeedbacks = (): SleepFeedback[] => {
  try {
    return JSON.parse(localStorage.getItem('sleepFeedbacks') || '[]')
  } catch {
    return []
  }
}

const writeFeedbacks = (feedbacks: SleepFeedback[]) => {
  localStorage.setItem('sleepFeedbacks', JSON.stringify(feedbacks))
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  currentFeedback: null,
  isSubmitting: false,
  hasPendingFeedback: false,
  pendingRecord: null,

  checkPendingFeedback: (): boolean => {
    const records = readRecords()
    const feedbacks = readFeedbacks()
    const feedbackedRecordIds = new Set(feedbacks.map(f => f.recordId))

    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

    const pending = records
      .filter(r => r.sleepNight === yesterday)
      .filter(r => !feedbackedRecordIds.has(r.id) && !r.feedbackId)
      .sort((a, b) => b.startTime - a.startTime)

    const hasPending = pending.length > 0
    const pendingRecord = pending[0] || null
    set({ hasPendingFeedback: hasPending, pendingRecord })

    console.log('[FeedbackStore] checkPendingFeedback 按 sleepNight 匹配昨晚', {
      yesterday,
      hasPending,
      pendingRecordId: pendingRecord?.id
    })
    return hasPending
  },

  getPendingRecord: (): SleepRecord | null => {
    return get().pendingRecord
  },

  initFeedbackFromRecord: (record: SleepRecord) => {
    set({
      currentFeedback: {
        recordId: record.id,
        sceneId: record.sceneId,
        userStateId: record.userStateId,
        duration: record.duration,
        date: record.date
      }
    })
    console.log('[FeedbackStore] initFeedbackFromRecord', { recordId: record.id })
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
        !state.currentFeedback.recordId ||
        !state.currentFeedback.fasterAsleep) {
      console.error('[FeedbackStore] submitFeedback 反馈不完整（缺少 fasterAsleep）')
      return false
    }

    set({ isSubmitting: true })

    try {
      const feedback: SleepFeedback = {
        ...state.currentFeedback,
        id: generateId(),
        createdAt: Date.now()
      } as SleepFeedback

      const allFeedbacks = [feedback, ...readFeedbacks()]
      writeFeedbacks(allFeedbacks)

      const records = readRecords()
      const updatedRecords = records.map(r =>
        r.id === feedback.recordId ? { ...r, feedbackId: feedback.id } : r
      )
      writeRecords(updatedRecords)

      const preferenceStore = JSON.parse(localStorage.getItem('userPreference') || '{}')
      const recentFeedbacks = allFeedbacks.slice(0, 3)
      preferenceStore.feedbackCount = (preferenceStore.feedbackCount || 0) + 1
      preferenceStore.recentFeedbacks = recentFeedbacks

      if (recentFeedbacks.length >= 3) {
        const sceneScores: Record<string, number> = {}
        recentFeedbacks.forEach((fb: SleepFeedback) => {
          let score = 0
          score += fb.fasterAsleep === 'yes' ? 2 : fb.fasterAsleep === 'somewhat' ? 1 : 0
          if (fb.wokeUp) {
            score += fb.wokeUp === 'never' ? 2 : fb.wokeUp === 'once' ? 1 : 0
          }
          if (fb.soundHarsh) {
            score += fb.soundHarsh === 'no' ? 2 : fb.soundHarsh === 'somewhat' ? 1 : 0
          }
          sceneScores[fb.sceneId] = (sceneScores[fb.sceneId] || 0) + score
        })

        const sceneIds = Object.keys(sceneScores)
        if (sceneIds.length > 0) {
          let bestSceneId = sceneIds[0]
          let bestScore = sceneScores[bestSceneId]
          sceneIds.forEach(sceneId => {
            if (sceneScores[sceneId] > bestScore) {
              bestScore = sceneScores[sceneId]
              bestSceneId = sceneId
            }
          })
          preferenceStore.recommendedSceneId = bestSceneId
          console.log('[FeedbackStore] 三次反馈后推荐场景', { bestSceneId, bestScore, sceneScores })
        }
      }

      localStorage.setItem('userPreference', JSON.stringify(preferenceStore))

      set({
        currentFeedback: null,
        isSubmitting: false,
        hasPendingFeedback: false,
        pendingRecord: null
      })

      console.log('[FeedbackStore] submitFeedback 成功', feedback)
      return true
    } catch (error) {
      console.error('[FeedbackStore] submitFeedback 失败', error)
      set({ isSubmitting: false })
      return false
    }
  },

  resetCurrentFeedback: () => {
    set({
      currentFeedback: null,
      isSubmitting: false
    })
  }
}))
