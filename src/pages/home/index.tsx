import React, { useState, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { usePlayerStore } from '@/store/usePlayerStore'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import { useFeedbackStore } from '@/store/useFeedbackStore'
import { scenes, getSceneById } from '@/data/scenes'
import SceneCard from '@/components/SceneCard'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const HomePage: React.FC = () => {
  const [greeting, setGreeting] = useState('')
  const { setScene } = usePlayerStore()
  const { loadPreference, recommendedSceneId, getSleepRecords, getAverageSleepDuration, feedbackCount } = usePreferenceStore()
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
