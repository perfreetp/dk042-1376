import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useFeedbackStore } from '@/store/useFeedbackStore'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import { getSceneById } from '@/data/scenes'
import { getUserStateById } from '@/data/states'
import FeedbackQuestion from '@/components/FeedbackQuestion'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const FeedbackPage: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false)
  const {
    currentFeedback,
    isSubmitting,
    initFeedback,
    setFasterAsleep,
    setWokeUp,
    setSoundHarsh,
    submitFeedback,
    resetCurrentFeedback
  } = useFeedbackStore()

  const { feedbackCount, getSleepRecords } = usePreferenceStore()

  useEffect(() => {
    const records = getSleepRecords()
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    const yesterdayRecord = records.find((r: { date: string }) => r.date === yesterday)

    if (yesterdayRecord) {
      initFeedback(
        yesterdayRecord.sceneId,
        yesterdayRecord.userStateId,
        yesterdayRecord.duration
      )
    } else {
      initFeedback('rainy-night', 'anxiety', 45)
    }

    return () => {
      resetCurrentFeedback()
    }
  }, [initFeedback, resetCurrentFeedback, getSleepRecords])

  const questionConfigs = useMemo(() => [
    {
      key: 'fasterAsleep',
      question: '昨晚是否比平时更快睡着？',
      options: [
        { value: 'yes', label: '是的，快了很多', icon: '✅' },
        { value: 'somewhat', label: '稍微快了一点', icon: '🙂' },
        { value: 'no', label: '没有太大区别', icon: '😐' }
      ]
    },
    {
      key: 'wokeUp',
      question: '昨晚是否有半夜醒来？',
      options: [
        { value: 'never', label: '完全没有', icon: '😴' },
        { value: 'once', label: '醒来一次', icon: '🌙' },
        { value: 'multiple', label: '醒来多次', icon: '😫' }
      ]
    },
    {
      key: 'soundHarsh',
      question: '昨晚的声音是否觉得刺耳？',
      options: [
        { value: 'no', label: '完全不会，很舒服', icon: '🎵' },
        { value: 'somewhat', label: '有一点，但可以接受', icon: '🤔' },
        { value: 'yes', label: '是的，不太适应', icon: '🙉' }
      ]
    }
  ], [])

  const handleAnswerSelect = useCallback((questionKey: string) => (value: string) => {
    switch (questionKey) {
      case 'fasterAsleep':
        setFasterAsleep(value as 'yes' | 'no' | 'somewhat')
        break
      case 'wokeUp':
        setWokeUp(value as 'never' | 'once' | 'multiple')
        break
      case 'soundHarsh':
        setSoundHarsh(value as 'yes' | 'no' | 'somewhat')
        break
    }
  }, [setFasterAsleep, setWokeUp, setSoundHarsh])

  const isComplete = useMemo(() => {
    return currentFeedback &&
      currentFeedback.fasterAsleep &&
      currentFeedback.wokeUp &&
      currentFeedback.soundHarsh
  }, [currentFeedback])

  const answeredCount = useMemo(() => {
    if (!currentFeedback) return 0
    let count = 0
    if (currentFeedback.fasterAsleep) count++
    if (currentFeedback.wokeUp) count++
    if (currentFeedback.soundHarsh) count++
    return count
  }, [currentFeedback])

  const handleSubmit = useCallback(async () => {
    if (!isComplete) return

    const success = await submitFeedback()
    if (success) {
      setShowSuccess(true)
      console.log('[FeedbackPage] 反馈提交成功')
    } else {
      Taro.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    }
  }, [isComplete, submitFeedback])

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false)
    Taro.navigateBack()
  }, [])

  const scene = currentFeedback?.sceneId ? getSceneById(currentFeedback.sceneId) : null
  const state = currentFeedback?.userStateId ? getUserStateById(currentFeedback.userStateId) : null

  const getSelectedValue = (key: string): string | null => {
    if (!currentFeedback) return null
    return (currentFeedback as any)[key] || null
  }

  return (
    <ScrollView className={styles.feedbackPage} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>昨晚睡得怎么样？</Text>
        <Text className={styles.subtitle}>
          花30秒完成反馈，帮助我们更好地了解你的睡眠习惯
        </Text>
      </View>

      <View className={styles.progressSection}>
        <View className={styles.progressLabel}>
          <Text>已完成 {answeredCount}/3</Text>
          <Text>{Math.round(answeredCount / 3 * 100)}%</Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={styles.progressFill}
            style={{ width: `${answeredCount / 3 * 100}%` }}
          />
        </View>
      </View>

      {(scene || state) && (
        <View className={styles.sessionInfo}>
          <Text className={styles.infoTitle}>你昨晚使用的方案</Text>
          <View className={styles.infoContent}>
            <View
              className={styles.infoIcon}
              style={{ backgroundColor: scene ? `${scene.color}20` : 'rgba(74, 108, 247, 0.2)' }}
            >
              <Text>{scene?.icon || '🌙'}</Text>
            </View>
            <View className={styles.infoText}>
              <Text className={styles.infoScene}>
                {scene?.name || '未知场景'}
                {state && ` · ${state.name}`}
              </Text>
              <Text className={styles.infoMeta}>
                播放时长 {currentFeedback?.duration || 0} 分钟 · 昨晚
              </Text>
            </View>
          </View>
        </View>
      )}

      <View className={styles.questions}>
        {questionConfigs.map(config => (
          <FeedbackQuestion
            key={config.key}
            question={config.question}
            options={config.options}
            selectedValue={getSelectedValue(config.key)}
            onSelect={handleAnswerSelect(config.key)}
          />
        ))}
      </View>

      <View className={styles.bottomBar}>
        <View
          className={`${styles.submitButton} ${!isComplete ? styles.disabled : ''}`}
          onClick={isComplete && !isSubmitting ? handleSubmit : undefined}
        >
          {isSubmitting ? '提交中...' : '提交反馈'}
        </View>
      </View>

      {showSuccess && (
        <View className={styles.successOverlay}>
          <View className={styles.successIcon}>
            <Text>✨</Text>
          </View>
          <Text className={styles.successTitle}>感谢你的反馈！</Text>
          <Text className={styles.successDesc}>
            {feedbackCount + 1 >= 3
              ? '我们已经根据你的3次反馈，为你推荐了最适合的睡眠场景。'
              : `再完成 ${3 - (feedbackCount + 1)} 次反馈，我们将为你推荐专属睡眠方案。`}
          </Text>
          <View className={styles.successButton} onClick={handleSuccessClose}>
            完成
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default FeedbackPage
