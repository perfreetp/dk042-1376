import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { usePlayerStore } from '@/store/usePlayerStore'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import { useFeedbackStore } from '@/store/useFeedbackStore'
import { scenes, getSceneById } from '@/data/scenes'
import SceneCard from '@/components/SceneCard'
import { SleepRecord, SleepFeedback } from '@/types'
import {
  formatSleepNightLabel,
  buildFeedbackTags,
  getAverageDuration,
  getMostUsedScene
} from '@/utils/sleep'
import dayjs from 'dayjs'
import styles from './index.module.scss'

interface LastNightSummary {
  record: SleepRecord
  feedback: SleepFeedback
  tags: Array<{ label: string; type: 'positive' | 'neutral' | 'negative' }>
  durationCompare: { text: string; better: boolean } | null
  isMostUsedScene: boolean
  mostUsedSceneName: string | null
  isLastNight: boolean
}

const HomePage: React.FC = () => {
  const [greeting, setGreeting] = useState('')
  const { setScene } = usePlayerStore()
  const {
    loadPreference,
    recommendedSceneId,
    getSleepRecords,
    getSleepFeedbacks,
    feedbackCount
  } = usePreferenceStore()
  const { hasPendingFeedback, checkPendingFeedback } = useFeedbackStore()
  const [refreshTick, setRefreshTick] = useState(0)

  const refreshAll = useCallback(() => {
    loadPreference()
    checkPendingFeedback()
    setRefreshTick(n => n + 1)

    const hour = dayjs().hour()
    if (hour >= 5 && hour < 12) setGreeting('早上好')
    else if (hour >= 12 && hour < 18) setGreeting('下午好')
    else setGreeting('晚上好')
  }, [loadPreference, checkPendingFeedback])

  useDidShow(() => { refreshAll() })

  React.useEffect(() => { refreshAll() }, [refreshAll])

  const handleSceneClick = useCallback((sceneId: string) => {
    setScene(sceneId)
    Taro.navigateTo({ url: '/pages/player/index' })
  }, [setScene])

  const handleQuickStart = useCallback(() => {
    handleSceneClick(recommendedSceneId || 'rainy-night')
  }, [recommendedSceneId, handleSceneClick])

  const handleFeedbackClick = useCallback(() => {
    Taro.navigateTo({ url: '/pages/feedback/index' })
  }, [])

  const records = useMemo(() => getSleepRecords(), [getSleepRecords, refreshTick])
  const feedbacks = useMemo(() => getSleepFeedbacks(), [getSleepFeedbacks, refreshTick])
  const avgDuration = useMemo(() => getAverageDuration(records), [records])
  const mostUsed = useMemo(() => getMostUsedScene(records), [records])

  const quickStartScene = getSceneById(recommendedSceneId || 'rainy-night') || scenes[1]

  const lastNightSummary: LastNightSummary | null = useMemo(() => {
    if (records.length === 0) return null

    const feedbackMap: Record<string, SleepFeedback> = {}
    feedbacks.forEach(f => { feedbackMap[f.recordId] = f })

    const sorted = [...records].sort((a, b) => b.startTime - a.startTime)
    for (const record of sorted) {
      const feedback = record.feedbackId
        ? feedbacks.find(f => f.id === record.feedbackId)
        : feedbackMap[record.id]
      if (!feedback) continue

      const tags = buildFeedbackTags(feedback).map(t => ({
        label: t.text + (t.type === 'positive' ? ' ✓' : ''),
        type: t.type
      }))

      let durationCompare: { text: string; better: boolean } | null = null
      if (avgDuration > 0) {
        const diff = record.duration - avgDuration
        if (Math.abs(diff) >= 5) {
          if (diff > 0) {
            durationCompare = { text: `比平均多 ${diff} 分钟`, better: true }
          } else {
            durationCompare = { text: `比平均少 ${-diff} 分钟`, better: false }
          }
        } else {
          durationCompare = { text: '与平均时长相当', better: true }
        }
      }

      const isMostUsed = !!mostUsed && mostUsed.scene.id === record.sceneId
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

      return {
        record,
        feedback,
        tags,
        durationCompare,
        isMostUsedScene: isMostUsed,
        mostUsedSceneName: mostUsed?.scene.name || null,
        isLastNight: record.sleepNight === yesterday
      }
    }
    return null
  }, [records, feedbacks, avgDuration, mostUsed])

  const handleLastNightClick = useCallback(() => {
    if (!lastNightSummary) return
    const params = lastNightSummary.record.id
      ? `?recordId=${lastNightSummary.record.id}`
      : ''
    Taro.navigateTo({ url: `/pages/history/index${params}` })
  }, [lastNightSummary])

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
              <Text>{formatSleepNightLabel(lastNightSummary.record.sleepNight)}睡眠摘要</Text>
              <Text className={styles.lastNightBadge}>已反馈</Text>
            </View>
            <Text className={styles.lastNightArrow}>›</Text>
          </View>
          <View className={styles.lastNightContent}>
            <View
              className={styles.lastNightIcon}
              style={{ backgroundColor: `${(getSceneById(lastNightSummary.record.sceneId)?.color || '#4a6cf7')}20` }}
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
          {(lastNightSummary.durationCompare || lastNightSummary.mostUsedSceneName) && (
            <View className={styles.lastNightCompare}>
              {lastNightSummary.durationCompare && (
                <View className={`${styles.compareItem} ${lastNightSummary.durationCompare.better ? styles.highlight : ''}`}>
                  <Text className={styles.value}>{lastNightSummary.durationCompare.text}</Text>
                  <Text className={styles.label}>时长对比</Text>
                </View>
              )}
              {lastNightSummary.mostUsedSceneName && (
                <View className={`${styles.compareItem} ${lastNightSummary.isMostUsedScene ? styles.highlight : ''}`}>
                  <Text className={styles.value}>
                    {lastNightSummary.isMostUsedScene ? '你最常用的场景' : `常用场景是「${lastNightSummary.mostUsedSceneName}」`}
                  </Text>
                  <Text className={styles.label}>使用习惯</Text>
                </View>
              )}
            </View>
          )}
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
            <Text className={styles.statLabel}>平均时长(分)</Text>
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
          <Text className={styles.sectionMore} onClick={() => Taro.navigateTo({ url: '/pages/history/index' })}>
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
