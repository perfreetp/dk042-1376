import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { useFeedbackStore } from '@/store/useFeedbackStore'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import { getSceneById } from '@/data/scenes'
import { getUserStateById } from '@/data/states'
import FeedbackQuestion from '@/components/FeedbackQuestion'
import styles from './index.module.scss'

const FeedbackPage: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false)
  const [showOptional, setShowOptional] = useState(false)
  const {
    pendingRecord,
    currentFeedback,
    isSubmitting,
    initFeedbackFromRecord,
    setFasterAsleep,
    setWokeUp,
    setSoundHarsh,
    submitFeedback,
    resetCurrentFeedback,
    checkPendingFeedback
  } = useFeedbackStore()

  const { feedbackCount } = usePreferenceStore()

  useDidShow(() => {
    checkPendingFeedback()
  })

  useEffect(() => {
    checkPendingFeedback()
  }, [checkPendingFeedback])

  useEffect(() => {
    if (pendingRecord && !currentFeedback && !showSuccess) {
      initFeedbackFromRecord(pendingRecord)
    }
  }, [pendingRecord, currentFeedback, initFeedbackFromRecord, showSuccess])

  useEffect(() => {
    return () => {
      resetCurrentFeedback()
    }
  }, [resetCurrentFeedback])

  const requiredQuestion = useMemo(() => ({
    key: 'fasterAsleep',
    question: '昨晚是否比平时更快睡着？',
    options: [
      { value: 'yes', label: '是的，快了很多', icon: '✅' },
      { value: 'somewhat', label: '稍微快了一点', icon: '🙂' },
      { value: 'no', label: '没有太大区别', icon: '😐' }
    ]
  }), [])

  const optionalQuestions = useMemo(() => [
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

  const canSubmit = useMemo(() => {
    return !!(currentFeedback && currentFeedback.fasterAsleep)
  }, [currentFeedback])

  const optionalAnswered = useMemo(() => {
    if (!currentFeedback) return 0
    let count = 0
    if (currentFeedback.wokeUp) count++
    if (currentFeedback.soundHarsh) count++
    return count
  }, [currentFeedback])

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

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
  }, [canSubmit, submitFeedback])

  const handleSuccessClose = useCallback(() => {
    setShowSuccess(false)
    Taro.switchTab({
      url: '/pages/home/index'
    })
  }, [])

  const handleBackHome = useCallback(() => {
    Taro.switchTab({
      url: '/pages/home/index'
    })
  }, [])

  const scene = currentFeedback?.sceneId ? getSceneById(currentFeedback.sceneId) : null
  const state = currentFeedback?.userStateId ? getUserStateById(currentFeedback.userStateId) : null

  const getSelectedValue = (key: string): string | null => {
    if (!currentFeedback) return null
    const val = (currentFeedback as Record<string, unknown>)[key]
    return (val as string) || null
  }

  const showEmptyState = !pendingRecord && !showSuccess

  if (showEmptyState) {
    return (
      <ScrollView className={styles.feedbackPage} scrollY>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📭</Text>
          <Text className={styles.emptyTitle}>没有可反馈的睡眠记录</Text>
          <Text className={styles.emptyDesc}>
            昨晚还没有播放过的记录哦。今晚使用助眠白噪音入睡后，次日就可以来这里反馈睡眠情况，帮助我们为你推荐更合适的场景。
          </Text>
          <View className={styles.homeButton} onClick={handleBackHome}>
            回首页
          </View>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView className={styles.feedbackPage} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>昨晚睡得怎么样？</Text>
        <Text className={styles.subtitle}>
          回答一个必答问题就能提交，其他信息选填
        </Text>
      </View>

      <View className={styles.progressSection}>
        <View className={styles.progressLabel}>
          <Text>必答 1/1 {optionalAnswered > 0 && `· 选填 ${optionalAnswered}/2`}</Text>
          <Text>{canSubmit ? '可以提交' : '请先作答必答题'}</Text>
        </View>
        <View className={styles.progressBar}>
          <View
            className={styles.progressFill}
            style={{ width: canSubmit ? '100%' : '0%' }}
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
        <FeedbackQuestion
          question={requiredQuestion.question}
          options={requiredQuestion.options}
          selectedValue={getSelectedValue(requiredQuestion.key)}
          onSelect={handleAnswerSelect(requiredQuestion.key)}
        />

        <View className={styles.optionalSection}>
          <View
            className={styles.optionalHeader}
            onClick={() => setShowOptional(v => !v)}
          >
            <View className={styles.optionalTitle}>
              <Text>更多睡眠细节（选填）</Text>
              <Text className={styles.optionalTag}>帮助我们更懂你</Text>
            </View>
            <Text className={classnames(styles.optionalToggle, showOptional && styles.expanded)}>
              ▾
            </Text>
          </View>
          {showOptional && (
            <View className={styles.optionalContent}>
              {optionalQuestions.map(config => (
                <FeedbackQuestion
                  key={config.key}
                  question={config.question}
                  options={config.options}
                  selectedValue={getSelectedValue(config.key)}
                  onSelect={handleAnswerSelect(config.key)}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View
          className={`${styles.submitButton} ${!canSubmit ? styles.disabled : ''}`}
          onClick={canSubmit && !isSubmitting ? handleSubmit : undefined}
        >
          {isSubmitting ? '提交中...' : '提交反馈'}
        </View>
        <Text className={styles.bottomHint}>
          选填信息可以帮我们更精准推荐，但不会影响提交
        </Text>
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
