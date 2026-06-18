import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import { DurationOption } from '@/types'
import styles from './index.module.scss'

interface DurationSelectorProps {
  options: DurationOption[]
  selectedValue: number
  onSelect: (value: number) => void
  title?: string
}

const DurationSelector: React.FC<DurationSelectorProps> = ({
  options,
  selectedValue,
  onSelect,
  title = '选择播放时长'
}) => {
  return (
    <View className={styles.durationSelector}>
      <Text className={styles.sectionTitle}>{title}</Text>
      <View className={styles.durationList}>
        {options.map(option => (
          <View
            key={option.value}
            className={classnames(
              styles.durationItem,
              selectedValue === option.value && styles.active
            )}
            onClick={() => onSelect(option.value)}
          >
            <Text className={styles.durationValue}>{option.value}</Text>
            <Text className={styles.durationLabel}>{option.label}</Text>
            <Text className={styles.durationDesc}>{option.description}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export default DurationSelector
