import dayjs from 'dayjs'
import { SleepRecord, SleepFeedback, SleepScene } from '@/types'
import { getSceneById } from '@/data/scenes'

export const deriveSleepNight = (startTime: number, fallbackDate?: string): string => {
  if (startTime) {
    const hour = dayjs(startTime).hour()
    return hour < 12
      ? dayjs(startTime).subtract(1, 'day').format('YYYY-MM-DD')
      : dayjs(startTime).format('YYYY-MM-DD')
  }
  if (fallbackDate) {
    return fallbackDate
  }
  return dayjs().format('YYYY-MM-DD')
}

export const normalizeSleepRecord = (record: SleepRecord): SleepRecord => {
  if (record.sleepNight) return record
  return {
    ...record,
    sleepNight: deriveSleepNight(record.startTime, record.date)
  }
}

export const normalizeSleepRecords = (records: SleepRecord[]): SleepRecord[] => {
  return records.map(normalizeSleepRecord)
}

export const formatSleepNightLabel = (sleepNight: string): string => {
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  if (sleepNight === yesterday) return '昨晚'
  const twoDaysAgo = dayjs().subtract(2, 'day').format('YYYY-MM-DD')
  if (sleepNight === twoDaysAgo) return '前天晚上'
  const today = dayjs().format('YYYY-MM-DD')
  if (sleepNight === today) return '今天凌晨'
  return dayjs(sleepNight).format('MM月DD日晚')
}

export const buildFeedbackTags = (feedback: SleepFeedback | undefined): Array<{ text: string; type: 'positive' | 'neutral' | 'negative' }> => {
  if (!feedback) return []
  const tags: Array<{ text: string; type: 'positive' | 'neutral' | 'negative' }> = []

  if (feedback.fasterAsleep === 'yes') tags.push({ text: '入睡更快', type: 'positive' })
  else if (feedback.fasterAsleep === 'somewhat') tags.push({ text: '稍有帮助', type: 'neutral' })
  else tags.push({ text: '效果不明显', type: 'negative' })

  if (feedback.wokeUp === 'never') tags.push({ text: '安睡整晚', type: 'positive' })
  else if (feedback.wokeUp === 'once') tags.push({ text: '醒来一次', type: 'neutral' })
  else if (feedback.wokeUp === 'multiple') tags.push({ text: '多次醒来', type: 'negative' })

  if (feedback.soundHarsh === 'no') tags.push({ text: '声音舒适', type: 'positive' })
  else if (feedback.soundHarsh === 'somewhat') tags.push({ text: '略有不适', type: 'neutral' })
  else if (feedback.soundHarsh === 'yes') tags.push({ text: '声音刺耳', type: 'negative' })

  return tags
}

export const getAverageDuration = (records: SleepRecord[]): number => {
  if (records.length === 0) return 0
  const total = records.reduce((sum, r) => sum + r.duration, 0)
  return Math.round(total / records.length)
}

export const getMostUsedScene = (records: SleepRecord[]): { scene: SleepScene; count: number } | null => {
  if (records.length === 0) return null
  const counts: Record<string, number> = {}
  records.forEach(r => {
    counts[r.sceneId] = (counts[r.sceneId] || 0) + 1
  })
  let maxId: string | null = null
  let maxCount = 0
  Object.entries(counts).forEach(([id, c]) => {
    if (c > maxCount) { maxCount = c; maxId = id }
  })
  if (!maxId) return null
  const scene = getSceneById(maxId)
  return scene ? { scene, count: maxCount } : null
}

export const getRecommendedSettingsForScene = (sceneId: string, records: SleepRecord[], feedbacks: SleepFeedback[]) => {
  const sceneFeedbacks = feedbacks.filter(f => f.sceneId === sceneId)
  if (sceneFeedbacks.length === 0) return { duration: 45, userStateId: null as string | null }

  const positiveForScene = sceneFeedbacks.filter(
    f => f.fasterAsleep === 'yes' || f.fasterAsleep === 'somewhat'
  )
  const sceneRecords = records.filter(r => r.sceneId === sceneId)

  let recommendedDuration = 45
  if (positiveForScene.length > 0) {
    const posRecordIds = positiveForScene.map(f => f.recordId)
    const posRecords = sceneRecords.filter(r => posRecordIds.includes(r.id))
    if (posRecords.length > 0) {
      recommendedDuration = Math.round(
        posRecords.reduce((s, r) => s + r.duration, 0) / posRecords.length
      )
    }
  } else if (sceneRecords.length > 0) {
    recommendedDuration = Math.round(
      sceneRecords.reduce((s, r) => s + r.duration, 0) / sceneRecords.length
    )
  }

  let recommendedStateId: string | null = null
  if (positiveForScene.length > 0) {
    const stateCounts: Record<string, number> = {}
    positiveForScene.forEach(f => {
      if (f.userStateId) {
        stateCounts[f.userStateId] = (stateCounts[f.userStateId] || 0) + 1
      }
    })
    let maxState: string | null = null
    let maxSC = 0
    Object.entries(stateCounts).forEach(([sid, c]) => {
      if (c > maxSC) { maxSC = c; maxState = sid }
    })
    recommendedStateId = maxState
  }

  return { duration: recommendedDuration, userStateId: recommendedStateId }
}
