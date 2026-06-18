import Taro from '@tarojs/taro'
import { AudioMix } from '@/types'

export interface AudioInstance {
  play: () => void
  pause: () => void
  stop: () => void
  setVolume: (volume: number) => void
  destroy: () => void
}

export const createAudioTrack = (type: keyof AudioMix, initialVolume: number = 0.5): AudioInstance => {
  const audioContext = Taro.createInnerAudioContext()

  const audioUrls: Record<keyof AudioMix, string> = {
    rain: 'https://assets.mixkit.co/active_storage/sfx/2515/2515.mp3',
    fan: 'https://assets.mixkit.co/active_storage/sfx/2529/2529.mp3',
    traffic: 'https://assets.mixkit.co/active_storage/sfx/2534/2534.mp3',
    voiceMask: 'https://assets.mixkit.co/active_storage/sfx/2540/2540.mp3'
  }

  audioContext.src = audioUrls[type]
  audioContext.loop = true
  audioContext.volume = initialVolume
  audioContext.autoplay = false

  const play = () => {
    try {
      audioContext.play()
      console.log('[AudioUtils] play', type)
    } catch (error) {
      console.error('[AudioUtils] play error', error)
    }
  }

  const pause = () => {
    try {
      audioContext.pause()
      console.log('[AudioUtils] pause', type)
    } catch (error) {
      console.error('[AudioUtils] pause error', error)
    }
  }

  const stop = () => {
    try {
      audioContext.stop()
      console.log('[AudioUtils] stop', type)
    } catch (error) {
      console.error('[AudioUtils] stop error', error)
    }
  }

  const setVolume = (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    audioContext.volume = clampedVolume
  }

  const destroy = () => {
    try {
      audioContext.destroy()
      console.log('[AudioUtils] destroy', type)
    } catch (error) {
      console.error('[AudioUtils] destroy error', error)
    }
  }

  return { play, pause, stop, setVolume, destroy }
}

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const calculateTrackVolume = (mixValue: number, masterVolume: number): number => {
  return (mixValue / 100) * masterVolume
}
