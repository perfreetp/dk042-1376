import { useEffect, useRef, useCallback } from 'react'
import { AudioMix } from '@/types'
import { createAudioTrack, AudioInstance, calculateTrackVolume } from '@/utils/audio'

interface UseAudioPlayerProps {
  mix: AudioMix
  masterVolume: number
  isPlaying: boolean
}

export const useAudioPlayer = ({ mix, masterVolume, isPlaying }: UseAudioPlayerProps) => {
  const audioTracksRef = useRef<Record<keyof AudioMix, AudioInstance | null>>({
    rain: null,
    fan: null,
    traffic: null,
    voiceMask: null
  })

  const initAudioTracks = useCallback(() => {
    const trackTypes: (keyof AudioMix)[] = ['rain', 'fan', 'traffic', 'voiceMask']
    trackTypes.forEach(type => {
      if (!audioTracksRef.current[type]) {
        const initialVolume = calculateTrackVolume(mix[type], masterVolume)
        audioTracksRef.current[type] = createAudioTrack(type, initialVolume)
        console.log('[useAudioPlayer] init track:', type, 'volume:', initialVolume)
      }
    })
  }, [mix, masterVolume])

  const updateVolumes = useCallback(() => {
    const trackTypes: (keyof AudioMix)[] = ['rain', 'fan', 'traffic', 'voiceMask']
    trackTypes.forEach(type => {
      const track = audioTracksRef.current[type]
      if (track) {
        const volume = calculateTrackVolume(mix[type], masterVolume)
        track.setVolume(volume)
      }
    })
  }, [mix, masterVolume])

  const playAll = useCallback(() => {
    initAudioTracks()
    const trackTypes: (keyof AudioMix)[] = ['rain', 'fan', 'traffic', 'voiceMask']
    trackTypes.forEach(type => {
      const track = audioTracksRef.current[type]
      if (track && mix[type] > 0) {
        track.play()
      }
    })
    console.log('[useAudioPlayer] playAll')
  }, [initAudioTracks, mix])

  const pauseAll = useCallback(() => {
    const trackTypes: (keyof AudioMix)[] = ['rain', 'fan', 'traffic', 'voiceMask']
    trackTypes.forEach(type => {
      const track = audioTracksRef.current[type]
      if (track) {
        track.pause()
      }
    })
    console.log('[useAudioPlayer] pauseAll')
  }, [])

  const stopAll = useCallback(() => {
    const trackTypes: (keyof AudioMix)[] = ['rain', 'fan', 'traffic', 'voiceMask']
    trackTypes.forEach(type => {
      const track = audioTracksRef.current[type]
      if (track) {
        track.stop()
      }
    })
    console.log('[useAudioPlayer] stopAll')
  }, [])

  const destroyAll = useCallback(() => {
    const trackTypes: (keyof AudioMix)[] = ['rain', 'fan', 'traffic', 'voiceMask']
    trackTypes.forEach(type => {
      const track = audioTracksRef.current[type]
      if (track) {
        track.destroy()
        audioTracksRef.current[type] = null
      }
    })
    console.log('[useAudioPlayer] destroyAll')
  }, [])

  useEffect(() => {
    updateVolumes()
  }, [updateVolumes])

  useEffect(() => {
    if (isPlaying) {
      playAll()
    } else {
      pauseAll()
    }
  }, [isPlaying, playAll, pauseAll])

  useEffect(() => {
    return () => {
      destroyAll()
    }
  }, [destroyAll])

  return {
    playAll,
    pauseAll,
    stopAll,
    updateVolumes
  }
}
