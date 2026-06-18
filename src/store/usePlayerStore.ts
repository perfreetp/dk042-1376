import { create } from 'zustand'
import { PlaybackSettings, AudioMix, SleepRecord } from '@/types'
import { getSceneById } from '@/data/scenes'
import { getUserStateById, calculateAdjustedMix } from '@/data/states'
import dayjs from 'dayjs'

interface PlayerState extends PlaybackSettings {
  remainingTime: number
  elapsedTime: number
  setScene: (sceneId: string) => void
  setUserState: (userStateId: string) => void
  setDuration: (duration: number) => void
  setMix: (mix: Partial<AudioMix>) => void
  startPlayback: () => void
  pausePlayback: () => void
  stopPlayback: () => void
  updateElapsedTime: () => void
  startFade: () => void
  updateFadeVolume: () => void
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
  fadeStartTime: null,
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
      mix: adjustedMix
    })
    console.log('[PlayerStore] setScene', { sceneId, adjustedMix })
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
      isFading: false,
      fadeStartTime: null
    })
    console.log('[PlayerStore] startPlayback', { startTime: now, endTime })
  },

  pausePlayback: () => {
    set({ isPlaying: false })
    console.log('[PlayerStore] pausePlayback')
  },

  stopPlayback: () => {
    const state = get()
    if (state.startTime && state.endTime) {
      const scene = getSceneById(state.sceneId)
      const userState = getUserStateById(state.userStateId)
      const sleepRecord: SleepRecord = {
        id: `record-${Date.now()}`,
        date: dayjs().format('YYYY-MM-DD'),
        sceneId: state.sceneId,
        sceneName: scene?.name || '',
        userStateId: state.userStateId,
        userStateName: userState?.name || '',
        duration: state.duration,
        startTime: state.startTime,
        endTime: state.endTime
      }
      const existingRecords = JSON.parse(localStorage.getItem('sleepRecords') || '[]')
      localStorage.setItem('sleepRecords', JSON.stringify([sleepRecord, ...existingRecords].slice(0, 30)))
      console.log('[PlayerStore] stopPlayback - saved record', sleepRecord)
    }

    set({
      isPlaying: false,
      startTime: null,
      endTime: null,
      elapsedTime: 0,
      remainingTime: get().duration * 60,
      currentVolume: 1,
      isFading: false,
      fadeStartTime: null
    })
  },

  updateElapsedTime: () => {
    const state = get()
    if (!state.isPlaying || !state.startTime) return

    const now = Date.now()
    const elapsed = Math.floor((now - state.startTime) / 1000)
    const totalSeconds = state.duration * 60
    const remaining = Math.max(0, totalSeconds - elapsed)

    if (remaining <= 600 && !state.isFading) {
      get().startFade()
    }

    if (remaining <= 0) {
      get().stopPlayback()
      return
    }

    if (state.isFading) {
      get().updateFadeVolume()
    }

    set({
      elapsedTime: elapsed,
      remainingTime: remaining
    })
  },

  startFade: () => {
    set({
      isFading: true,
      fadeStartTime: Date.now()
    })
    console.log('[PlayerStore] startFade - 开始最后10分钟渐弱')
  },

  updateFadeVolume: () => {
    const state = get()
    if (!state.isFading || !state.fadeStartTime) return

    const fadeDuration = 10 * 60 * 1000
    const elapsed = Date.now() - state.fadeStartTime
    const progress = Math.min(1, elapsed / fadeDuration)
    const volume = Math.max(0, 1 - progress)

    set({ currentVolume: volume })
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
