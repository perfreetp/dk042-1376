import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { UserState } from '@/types'
import styles from './index.module.scss'

interface StateSelectorProps {
  states: UserState[]
  selectedId: string
  onSelect: (stateId: string) => void
  title?: string
}

const StateSelector: React.FC<StateSelectorProps> = ({
  states,
  selectedId,
  onSelect,
  title = '你现在的状态是？'
}) => {
  return (
    <View className={styles.stateSelector}>
      <Text className={styles.sectionTitle}>{title}</Text>
      <View className={styles.stateList}>
        {states.map(state => (
          <View
            key={state.id}
            className={classnames(styles.stateItem, selectedId === state.id && styles.active)}
            onClick={() => onSelect(state.id)}
          >
            <View className={styles.stateIcon}>
              <Text>{state.icon}</Text>
            </View>
            <View className={styles.stateContent}>
              <Text className={styles.stateName}>{state.name}</Text>
              <Text className={styles.stateDesc}>{state.description}</Text>
            </View>
            <View className={styles.stateCheck}>✓</View>
          </View>
        ))}
      </View>
    </View>
  )
}

export default StateSelector
