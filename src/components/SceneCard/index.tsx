import React from 'react'
import { View, Text } from '@tarojs/components'
import { Scene } from '@/types'
import { userStates } from '@/data/states'
import styles from './index.module.scss'

interface SceneCardProps {
  scene: Scene
  isRecommended?: boolean
  onClick?: () => void
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, isRecommended, onClick }) => {
  const suitableTags = scene.suitableFor
    .map(stateId => userStates.find(s => s.id === stateId)?.name)
    .filter(Boolean)

  return (
    <View className={styles.sceneCard} onClick={onClick}>
      {isRecommended && (
        <Text className={styles.recommended}>推荐</Text>
      )}
      <View
        className={styles.iconWrapper}
        style={{ backgroundColor: `${scene.color}20` }}
      >
        <Text>{scene.icon}</Text>
      </View>
      <Text className={styles.sceneName}>{scene.name}</Text>
      <Text className={styles.sceneDesc}>{scene.description}</Text>
      <View className={styles.suitableTags}>
        {suitableTags.map((tag, index) => (
          <Text key={index} className={styles.tag}>
            适合{tag}
          </Text>
        ))}
      </View>
    </View>
  )
}

export default SceneCard
