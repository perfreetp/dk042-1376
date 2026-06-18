import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { usePlayerStore } from '@/store/usePlayerStore'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import { useFeedbackStore } from '@/store/useFeedbackStore'
import { scenes, getSceneById } from '@/data/scenes'
import SceneCard from '@/components/SceneCard'
import { SleepRecord, SleepFeedback } from '@/types'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const HomePage: React.FC = () => {
  const [greeting, setGreeting] = useState('')
  const { setScene } = usePlayerStore()
  const { loadPreference, recommendedSceneId, getSleepRecords, getSleepFeedbacks, getAverageSleepDuration, feedbackCount } = usePreferenceStore()
  const { hasPendingFeedback, checkPendingFeedback } = useFeedbackStore()
  const [, forceUpdate] = useState(0)

  const refreshAll = useCallback(() => {
    loadPreference()
    checkPendingFeedback()
    forceUpdate(n => n + 1)

    const hour = dayjs().hour()
    if (hour >= 5 && hour < 12) {
      setGreeting('早上好')
    } else if (hour >= 12 && hour < 18) {
      setGreeting('下午好')
    } else {
      setGreeting('晚上好')
    }
  }, [loadPreference, checkPendingFeedback])

  useDidShow(() => {
    refreshAll()
  })

  React.useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const handleSceneClick = useCallback((sceneId: string) => {
    setScene(sceneId)
    Taro.navigateTo({
      url: '/pages/player/index'
    })
    console.log('[HomePage] 点击场景:', sceneId)
  }, [setScene])

  const handleQuickStart = useCallback(() => {
    const defaultSceneId = recommendedSceneId || 'rainy-night'
    handleSceneClick(defaultSceneId)
  }, [recommendedSceneId, handleSceneClick])

  const handleFeedbackClick = useCallback(() => {
    Taro.navigateTo({
      url: '/pages/feedback/index'
    })
  }, [])

  const handleHistoryClick = useCallback(() => {
    Taro.navigateTo({
      url: '/pages/history/index'
    })
  }, [])

  const quickStartScene = getSceneById(recommendedSceneId || 'rainy-night') || scenes[1]
  const records = getSleepRecords()
  const avgDuration = getAverageSleepDuration()

  const lastNightSummary = useMemo(() => {
    const feedbacks = getSleepFeedbacks()
    const feedbackMap: Record<string, SleepFeedback> = {}
    feedbacks.forEach(f => {
      feedbackMap[f.recordId] = f
    })

    const sorted = [...records].sort((a, b) => b.startTime - a.startTime)
    for (const record of sorted) {
      const feedback = record.feedbackId
        ? feedbacks.find(f => f.id === record.feedbackId)
        : feedbackMap[record.id]
      if (feedback) {
        const tags: { label: string; type: 'positive' | 'neutral' | 'default' }[] = []

        if (feedback.fasterAsleep === 'yes') {
          tags.push({ label: '入睡更快 ✓', type: 'positive' })
        } else if (feedback.fasterAsleep === 'somewhat') {
          tags.push({ label: '稍有帮助', type: 'neutral' })
        }

        if (feedback.wokeUp === 'never') {
          tags.push({ label: '安睡整晚 ✓', type: 'positive' })
        } else if (feedback.wokeUp === 'once') {
          tags.push({ label: '醒来一次', type: 'neutral' })
        } else if (feedback.wokeUp === 'multiple') {
          tags.push({ label: '多次醒来', type: 'default' })
        }

        if (feedback.soundHarsh === 'no') {
          tags.push({ label: '声音舒适 ✓', type: 'positive' })
        } else if (feedback.soundHarsh === 'somewhat') {
          tags.push({ label: '略有不适', type: 'neutral' })
        } else if (feedback.soundHarsh === 'yes') {
          tags.push({ label: '声音刺耳', type: 'default' })
        }

        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
        const isLastNight = record.sleepNight === yesterday

        return { record, feedback, tags, isLastNight }
      }
    }
    return null
  }, [records, getSleepFeedbacks])

  const formatSleepNight = (sleepNight: string) => {
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    if (sleepNight === yesterday) return '昨晚'
    const twoDaysAgo = dayjs().subtract(2, 'day').format('YYYY-MM-DD')
    if (sleepNight === twoDaysAgo) return '前天晚上'
    return dayjs(sleepNight).format('MM月DD日晚')
  }

  const handleLastNightClick = useCallback(() => {
    Taro.navigateTo({
      url: '/pages/history/index'
    })
  }, [])

  return (
    <ScrollView className={styles.homePage} scrollY>
      <View className={styles.greeting}>
        <Text className={styles.greetingTitle}>{greeting}</Text>
        <Text className={styles.greetingSubtitle}>今天过得怎么样？准备好休息了吗？</Text>
      </View>

      {hasPendingFeedback && (
        <View className={styles.pendingFeedback} onClick={handleFeedbackClick}>
          <View className={styles.feedbackContent}>
            <Text className={styles.feedbackTitle}>昨晚睡得怎么样？</Text>
            <Text className={styles.feedbackDesc}>花30秒完成反馈，下次更懂你</Text>
          </View>
          <Text className={styles.feedbackAction}>去反馈</Text>
        </View>
      )}

      {lastNightSummary && (
        <View className={styles.lastNightCard} onClick={handleLastNightClick}>
          <View className={styles.lastNightHeader}>
            <View className={styles.lastNightTitle}>
              <Text>{formatSleepNight(lastNightSummary.record.sleepNight)}睡眠摘要</Text>
              <Text className={styles.lastNightBadge}>已反馈</Text>
            </View>
            <Text className={styles.lastNightArrow}>›</Text>
          </View>
          <View className={styles.lastNightContent}>
            <View
              className={styles.lastNightIcon}
              style={{ backgroundColor: lastNightSummary.record.sceneId ? `${(getSceneById(lastNightSummary.record.sceneId)?.color || '#4a6cf7')}20` : 'rgba(74, 108, 247, 0.2)' }}
            >
              <Text>{getSceneById(lastNightSummary.record.sceneId)?.icon || '🌙'}</Text>
            </View>
            <View className={styles.lastNightInfo}>
              <Text className={styles.lastNightScene}>
                {lastNightSummary.record.sceneName} · {lastNightSummary.record.userStateName}
              </Text>
              <Text className={styles.lastNightMeta}>
                播放 {lastNightSummary.record.duration} 分钟 · {dayjs(lastNightSummary.record.startTime).format('HH:mm')} 开始
              </Text>
              <View className={styles.lastNightTags}>
                {lastNightSummary.tags.map((tag, idx) => (
                  <Text
                    key={idx}
                    className={`${styles.lastNightTag} ${styles[tag.type]}`}
                  >
                    {tag.label}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      <View className={styles.quickStart}>
        <View className={styles.quickStartHeader}>
          <View
            className={styles.quickStartIcon}
            style={{ backgroundColor: `${quickStartScene.color}20` }}
          >
            <Text>{quickStartScene.icon}</Text>
          </View>
          <View className={styles.quickStartInfo}>
            <Text className={styles.quickStartName}>
              {recommendedSceneId ? '为你推荐' : '快速开始'} · {quickStartScene.name}
            </Text>
            <Text className={styles.quickStartDesc}>{quickStartScene.description}</Text>
          </View>
        </View>
        <View className={styles.quickStartButton} onClick={handleQuickStart}>
          立即开始
        </View>
      </View>

      <View className={styles.statsCard}>
        <Text className={styles.statsTitle}>你的睡眠数据</Text>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{records.length}</Text>
            <Text className={styles.statLabel}>使用次数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{avgDuration || 0}</Text>
            <Text className={styles.statLabel}>平均时长</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{feedbackCount}</Text>
            <Text className={styles.statLabel}>反馈次数</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>选择睡眠场景</Text>
          <Text className={styles.sectionMore} onClick={handleHistoryClick}>
            历史记录
          </Text>
        </View>
        <View className={styles.scenesGrid}>
          {scenes.map(scene => (
            <SceneCard
              key={scene.id}
              scene={scene}
              isRecommended={scene.id === recommendedSceneId}
              onClick={() => handleSceneClick(scene.id)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

export default HomePage
