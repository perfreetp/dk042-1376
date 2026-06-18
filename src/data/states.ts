import { UserState } from '@/types'

export const userStates: UserState[] = [
  {
    id: 'anxiety',
    name: '焦虑',
    description: '心里烦躁，难以平静',
    icon: '😰',
    recommendedDuration: 45,
    mixAdjustment: {
      rain: 20,
      fan: 10,
      traffic: -10,
      voiceMask: 20
    }
  },
  {
    id: 'overthinking',
    name: '脑子停不下来',
    description: '思绪万千，无法停止思考',
    icon: '🤯',
    recommendedDuration: 60,
    mixAdjustment: {
      rain: 10,
      fan: 20,
      traffic: 10,
      voiceMask: 10
    }
  },
  {
    id: 'noise',
    name: '被邻居声影响',
    description: '外界噪音干扰，无法集中休息',
    icon: '🔊',
    recommendedDuration: 60,
    mixAdjustment: {
      rain: 0,
      fan: 20,
      traffic: -20,
      voiceMask: 40
    }
  }
]

export const getUserStateById = (id: string): UserState | undefined => {
  return userStates.find(state => state.id === id)
}

export const calculateAdjustedMix = (
  baseMix: Record<string, number>,
  adjustment: Partial<Record<string, number>>
): Record<string, number> => {
  const result = { ...baseMix }
  Object.keys(adjustment).forEach(key => {
    const adj = adjustment[key] || 0
    result[key] = Math.max(0, Math.min(100, (result[key] || 0) + adj))
  })
  return result
}
