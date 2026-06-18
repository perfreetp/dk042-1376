import { create } from 'zustand'
import { UserPreference, SleepRecord, SleepFeedback } from '@/types'
import dayjs from 'dayjs'

interface PreferenceState extends UserPreference {
  loadPreference: () => void
  getSleepRecords: () => SleepRecord[]
  getSleepFeedbacks: () => SleepFeedback[]
  getAverageSleepDuration: () => number
  getMostUsedScene: () => string | null
}

const initialPreference: UserPreference = {
  defaultSceneId: 'rainy-night',
  feedbackCount: 0,
  recentFeedbacks: [],
  recommendedSceneId: null
}

export const usePreferenceStore = create<PreferenceState>((set, get) => ({
  ...initialPreference,

  loadPreference: () => {
    try {
      const stored = localStorage.getItem('userPreference')
      if (stored) {
        const preference = JSON.parse(stored)
        set(preference)
        console.log('[PreferenceStore] loadPreference - 已加载', preference)
      }
    } catch (error) {
      console.error('[PreferenceStore] loadPreference - 失败', error)
    }
  },

  getSleepRecords: (): SleepRecord[] => {
    try {
      return JSON.parse(localStorage.getItem('sleepRecords') || '[]')
    } catch (error) {
      console.error('[PreferenceStore] getSleepRecords - 失败', error)
      return []
    }
  },

  getSleepFeedbacks: (): SleepFeedback[] => {
    try {
      return JSON.parse(localStorage.getItem('sleepFeedbacks') || '[]')
    } catch (error) {
      console.error('[PreferenceStore] getSleepFeedbacks - 失败', error)
      return []
    }
  },

  getAverageSleepDuration: (): number => {
    const records = get().getSleepRecords()
    if (records.length === 0) return 0

    const total = records.reduce((sum, record) => sum + record.duration, 0)
    return Math.round(total / records.length)
  },

  getMostUsedScene: (): string | null => {
    const records = get().getSleepRecords()
    if (records.length === 0) return null

    const sceneCounts: Record<string, number> = {}
    records.forEach(record => {
      sceneCounts[record.sceneId] = (sceneCounts[record.sceneId] || 0) + 1
    })

    let mostUsed: string | null = null
    let maxCount = 0
    Object.entries(sceneCounts).forEach(([sceneId, count]) => {
      if (count > maxCount) {
        maxCount = count
        mostUsed = sceneId
      }
    })

    return mostUsed
  }
}))
