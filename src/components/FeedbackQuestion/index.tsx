import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface FeedbackOption {
  value: string
  label: string
  icon: string
}

interface FeedbackQuestionProps {
  question: string
  options: FeedbackOption[]
  selectedValue: string | null
  onSelect: (value: string) => void
}

const FeedbackQuestion: React.FC<FeedbackQuestionProps> = ({
  question,
  options,
  selectedValue,
  onSelect
}) => {
  return (
    <View className={styles.feedbackQuestion}>
      <Text className={styles.questionTitle}>{question}</Text>
      <View className={styles.options}>
        {options.map(option => (
          <View
            key={option.value}
            className={classnames(
              styles.option,
              selectedValue === option.value && styles.active
            )}
            onClick={() => onSelect(option.value)}
          >
            <View className={styles.optionIcon}>
              <Text>{option.icon}</Text>
            </View>
            <Text className={styles.optionText}>{option.label}</Text>
            <View className={styles.optionCheck}>✓</View>
          </View>
        ))}
      </View>
    </View>
  )
}

export default FeedbackQuestion
