import { create } from 'zustand'
import { PlaybackSettings, AudioMix, SleepRecord } from '@/types'
import { getSceneById } from '@/data/scenes'
import { getUserStateById, calculateAdjustedMix } from '@/data/states'
import dayjs from 'dayjs'

const FADE_DURATION_SECONDS = 10 * 60

interface PlayerState extends PlaybackSettings {
  remainingTime: number
  elapsedTime: number
  setScene: (sceneId: string) => void
  setUserState: (userStateId: string) => void
  setDuration: (duration: number) => void
  setMix: (mix: Partial<AudioMix>) => void
  startPlayback: () => void
  pausePlayback: () => void
  resumePlayback: () => void
  stopPlayback: () => void
  updateElapsedTime: () => void
  reset: () => void
}

const initialState: PlaybackSettings = {
  sceneId: 'rainy-night',
  userStateId: 'anxiety',
  duration: 45,
  mix: {
    rain: 80,
    fan: 30,
    traffic: 10,
    voiceMask: 20
  },
  startTime: null,
  endTime: null,
  isPlaying: false,
  isFading: false,
  currentVolume: 1
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  ...initialState,
  remainingTime: 45 * 60,
  elapsedTime: 0,

  setScene: (sceneId: string) => {
    const scene = getSceneById(sceneId)
    if (!scene) return
    const userState = getUserStateById(get().userStateId)
    const adjustedMix = userState
      ? calculateAdjustedMix(scene.defaultMix, userState.mixAdjustment) as AudioMix
      : scene.defaultMix

    set({
      sceneId,
      mix: adjustedMix,
      startTime: null,
      endTime: null,
      elapsedTime: 0,
      remainingTime: get().duration * 60,
      isPlaying: false,
      isFading: false,
      currentVolume: 1
    })
    console.log('[PlayerStore] setScene 重置为新会话', { sceneId, adjustedMix })
  },

  setUserState: (userStateId: string) => {
    const userState = getUserStateById(userStateId)
    if (!userState) return
    const scene = getSceneById(get().sceneId)
    const adjustedMix = scene
      ? calculateAdjustedMix(scene.defaultMix, userState.mixAdjustment) as AudioMix
      : get().mix

    set({
      userStateId,
      duration: userState.recommendedDuration,
      mix: adjustedMix,
      remainingTime: userState.recommendedDuration * 60
    })
    console.log('[PlayerStore] setUserState', { userStateId, adjustedMix })
  },

  setDuration: (duration: number) => {
    set({
      duration,
      remainingTime: duration * 60
    })
    console.log('[PlayerStore] setDuration', { duration })
  },

  setMix: (mix: Partial<AudioMix>) => {
    set(state => ({
      mix: { ...state.mix, ...mix }
    }))
  },

  startPlayback: () => {
    const now = Date.now()
    const endTime = now + get().duration * 60 * 1000
    set({
      isPlaying: true,
      startTime: now,
      endTime,
      elapsedTime: 0,
      remainingTime: get().duration * 60,
      currentVolume: 1,
      isFading: false
    })
    console.log('[PlayerStore] startPlayback 全新开始', { startTime: now, endTime })
  },

  pausePlayback: () => {
    set({ isPlaying: false })
    console.log('[PlayerStore] pausePlayback 保留当前进度', {
      elapsedTime: get().elapsedTime,
      remainingTime: get().remainingTime
    })
  },

  resumePlayback: () => {
    const state = get()
    if (state.isPlaying) return
    if (state.elapsedTime >= state.duration * 60) return

    const now = Date.now()
    const newStartTime = now - state.elapsedTime * 1000
    const newEndTime = newStartTime + state.duration * 60 * 1000
    set({
      isPlaying: true,
      startTime: newStartTime,
      endTime: newEndTime
    })
    console.log('[PlayerStore] resumePlayback 继续播放', {
      newStartTime,
      newEndTime,
      continueFrom: state.elapsedTime
    })
  },

  stopPlayback: () => {
    const state = get()
    if (state.startTime && state.endTime) {
      const scene = getSceneById(state.sceneId)
      const userState = getUserStateById(state.userStateId)

      const startHour = dayjs(state.startTime).hour()
      const sleepNight = startHour < 12
        ? dayjs(state.startTime).subtract(1, 'day').format('YYYY-MM-DD')
        : dayjs(state.startTime).format('YYYY-MM-DD')

      const sleepRecord: SleepRecord = {
        id: `record-${Date.now()}`,
        date: dayjs().format('YYYY-MM-DD'),
        sleepNight,
        sceneId: state.sceneId,
        sceneName: scene?.name || '',
        userStateId: state.userStateId,
        userStateName: userState?.name || '',
        duration: state.duration,
        startTime: state.startTime,
        endTime: Date.now()
      }
      const existingRecords = JSON.parse(localStorage.getItem('sleepRecords') || '[]')
      localStorage.setItem('sleepRecords', JSON.stringify([sleepRecord, ...existingRecords].slice(0, 30)))
      console.log('[PlayerStore] stopPlayback 已保存记录', sleepRecord, { sleepNight, startHour })
    }

    set({
      isPlaying: false,
      startTime: null,
      endTime: null,
      elapsedTime: 0,
      remainingTime: get().duration * 60,
      currentVolume: 1,
      isFading: false
    })
  },

  updateElapsedTime: () => {
    const state = get()
    if (!state.isPlaying || !state.startTime) return

    const now = Date.now()
    const elapsed = Math.floor((now - state.startTime) / 1000)
    const totalSeconds = state.duration * 60
    const remaining = Math.max(0, totalSeconds - elapsed)

    const fadeStartThreshold = Math.max(0, totalSeconds - FADE_DURATION_SECONDS)
    const shouldFade = totalSeconds > FADE_DURATION_SECONDS && elapsed >= fadeStartThreshold

    let volume = 1
    if (shouldFade) {
      const fadeElapsed = elapsed - fadeStartThreshold
      const fadeProgress = Math.min(1, fadeElapsed / FADE_DURATION_SECONDS)
      volume = Math.max(0, 1 - fadeProgress)
    }

    if (remaining <= 0) {
      get().stopPlayback()
      return
    }

    set({
      elapsedTime: elapsed,
      remainingTime: remaining,
      isFading: shouldFade,
      currentVolume: volume
    })
  },

  reset: () => {
    set({
      ...initialState,
      remainingTime: initialState.duration * 60,
      elapsedTime: 0
    })
    console.log('[PlayerStore] reset')
  }
}))
