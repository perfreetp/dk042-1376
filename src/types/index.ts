export interface Scene {
  id: string
  name: string
  description: string
  icon: string
  color: string
  defaultMix: AudioMix
  suitableFor: string[]
}

export interface UserState {
  id: string
  name: string
  description: string
  icon: string
  recommendedDuration: number
  mixAdjustment: Partial<AudioMix>
}

export interface AudioMix {
  rain: number
  fan: number
  traffic: number
  voiceMask: number
}

export interface DurationOption {
  value: number
  label: string
  description: string
}

export interface PlaybackSettings {
  sceneId: string
  userStateId: string
  duration: number
  mix: AudioMix
  startTime: number | null
  endTime: number | null
  isPlaying: boolean
  isFading: boolean
  fadeStartTime: number | null
  currentVolume: number
}

export interface SleepFeedback {
  id: string
  date: string
  sceneId: string
  userStateId: string
  duration: number
  fasterAsleep: 'yes' | 'no' | 'somewhat'
  wokeUp: 'never' | 'once' | 'multiple'
  soundHarsh: 'yes' | 'no' | 'somewhat'
  createdAt: number
}

export interface SleepRecord {
  id: string
  date: string
  sceneId: string
  sceneName: string
  userStateId: string
  userStateName: string
  duration: number
  startTime: number
  endTime: number
  feedback?: SleepFeedback
}

export interface UserPreference {
  defaultSceneId: string
  feedbackCount: number
  recentFeedbacks: SleepFeedback[]
  recommendedSceneId: string | null
}

export interface AudioTrack {
  type: keyof AudioMix
  name: string
  icon: string
  color: string
}
