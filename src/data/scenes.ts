import { Scene, DurationOption, AudioTrack } from '@/types'

export const scenes: Scene[] = [
  {
    id: 'commute-relax',
    name: '通勤后放松',
    description: '舒缓一天的通勤疲劳，让身心慢慢沉静下来',
    icon: '🌆',
    color: '#4a6cf7',
    defaultMix: {
      rain: 40,
      fan: 60,
      traffic: 20,
      voiceMask: 30
    },
    suitableFor: ['anxiety', 'overthinking', 'noise']
  },
  {
    id: 'rainy-night',
    name: '雨夜入睡',
    description: '轻柔雨声包裹，仿佛回到温暖的被窝',
    icon: '🌧️',
    color: '#8b7cf3',
    defaultMix: {
      rain: 80,
      fan: 30,
      traffic: 10,
      voiceMask: 20
    },
    suitableFor: ['anxiety', 'overthinking']
  },
  {
    id: 'ac-noise',
    name: '空调房降噪',
    description: '稳定白噪音，隔绝外界干扰，专注休息',
    icon: '❄️',
    color: '#3dd598',
    defaultMix: {
      rain: 20,
      fan: 80,
      traffic: 10,
      voiceMask: 60
    },
    suitableFor: ['noise', 'overthinking']
  },
  {
    id: 'nap-recovery',
    name: '午休恢复',
    description: '20分钟高效午休，快速恢复精力',
    icon: '☀️',
    color: '#ff9f43',
    defaultMix: {
      rain: 30,
      fan: 50,
      traffic: 15,
      voiceMask: 40
    },
    suitableFor: ['overthinking', 'anxiety']
  }
]

export const durationOptions: DurationOption[] = [
  {
    value: 30,
    label: '30分钟',
    description: '快速入眠模式'
  },
  {
    value: 45,
    label: '45分钟',
    description: '标准睡眠模式'
  },
  {
    value: 60,
    label: '60分钟',
    description: '深度放松模式'
  }
]

export const audioTracks: AudioTrack[] = [
  {
    type: 'rain',
    name: '雨声',
    icon: '🌧️',
    color: '#4a6cf7'
  },
  {
    type: 'fan',
    name: '风扇声',
    icon: '🌀',
    color: '#8b7cf3'
  },
  {
    type: 'traffic',
    name: '远处车流',
    icon: '🚗',
    color: '#3dd598'
  },
  {
    type: 'voiceMask',
    name: '人声遮蔽',
    icon: '🔊',
    color: '#ff9f43'
  }
]

export const getSceneById = (id: string): Scene | undefined => {
  return scenes.find(scene => scene.id === id)
}

export const getDurationOption = (value: number): DurationOption | undefined => {
  return durationOptions.find(opt => opt.value === value)
}
