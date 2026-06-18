import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import { useFeedbackStore } from '@/store/useFeedbackStore'
import { getSceneById } from '@/data/scenes'
import styles from './index.module.scss'

const MinePage: React.FC = () => {
  const {
    loadPreference,
    recommendedSceneId,
    feedbackCount,
    getSleepRecords,
    getAverageSleepDuration,
    getMostUsedScene
  } = usePreferenceStore()
  const { hasPendingFeedback, checkPendingFeedback } = useFeedbackStore()
  const [refreshKey, setRefreshKey] = useState(0)

  useDidShow(() => {
    loadPreference()
    checkPendingFeedback()
    setRefreshKey(k => k + 1)
  })

  React.useEffect(() => {
    loadPreference()
    setRefreshKey(k => k + 1)
  }, [loadPreference])

  const records = useMemo(() => getSleepRecords(), [getSleepRecords, refreshKey])
  const avgDuration = useMemo(() => getAverageSleepDuration(), [getAverageSleepDuration, refreshKey])
  const mostUsedSceneId = useMemo(() => getMostUsedScene(), [getMostUsedScene, refreshKey])

  const handleHistoryClick = useCallback(() => {
    Taro.navigateTo({
      url: '/pages/history/index'
    })
  }, [])

  const handleFeedbackClick = useCallback(() => {
    Taro.navigateTo({
      url: '/pages/feedback/index'
    })
  }, [])

  const handleSettingsClick = useCallback(() => {
    Taro.showToast({
      title: '设置功能开发中',
      icon: 'none'
    })
  }, [])

  const mostUsedScene = mostUsedSceneId ? getSceneById(mostUsedSceneId) : null
  const recommendedScene = recommendedSceneId ? getSceneById(recommendedSceneId) : null
  const progressPercent = Math.min(100, (feedbackCount % 3) / 3 * 100)

  return (
    <ScrollView className={styles.minePage} scrollY>
      <View className={styles.profileCard}>
        <View className={styles.profileHeader}>
          <View className={styles.avatar}>
            <Text>😴</Text>
          </View>
          <View className={styles.profileInfo}>
            <Text className={styles.userName}>睡眠伙伴</Text>
            <Text className={styles.userDesc}>
              已使用 {records.length} 次，正在建立你的睡眠档案
            </Text>
          </View>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{records.length}</Text>
            <Text className={styles.statLabel}>总使用次数</Text>
          </View>
          <View className={styles.statCard}>
            <Text className={styles.statValue}>{avgDuration || 0}</Text>
            <Text className={styles.statLabel}>平均时长(分)</Text>
          </View>
        </View>
      </View>

      {feedbackCount < 3 && (
        <View className={styles.recommendationCard}>
          <Text className={styles.recommendationTitle}>💡 个性化推荐</Text>
          <Text className={styles.recommendationDesc}>
            完成 {3 - feedbackCount} 次睡眠反馈后，系统将根据你的睡眠习惯推荐最适合的场景配置。
          </Text>
          <View className={styles.feedbackProgress}>
            <Text className={styles.progressText}>
              已完成 {feedbackCount}/3 次反馈
            </Text>
            <View className={styles.progressBar}>
              <View
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </View>
          </View>
        </View>
      )}

      {recommendedScene && feedbackCount >= 3 && (
        <View className={styles.recommendationCard}>
          <Text className={styles.recommendationTitle}>✨ 你的专属推荐</Text>
          <Text className={styles.recommendationDesc}>
            基于你的 {feedbackCount} 次睡眠反馈，系统为你推荐「{recommendedScene.name}」
            作为默认睡眠场景。
          </Text>
          {mostUsedScene && (
            <Text className={styles.recommendationDesc} style={{ marginTop: '16rpx' }}>
              你最常使用的是「{mostUsedScene.name}」，已使用 {records.filter(r => r.sceneId === mostUsedSceneId).length} 次。
            </Text>
          )}
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>功能</Text>
        <View className={styles.menuList}>
          <View className={styles.menuItem} onClick={handleHistoryClick}>
            <View className={styles.menuIcon}>
              <Text>📊</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuName}>睡眠历史</Text>
              <Text className={styles.menuDesc}>查看你的睡眠记录和反馈</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={handleFeedbackClick}>
            <View className={styles.menuIcon}>
              <Text>📝</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuName}>睡眠反馈</Text>
              <Text className={styles.menuDesc}>
                {hasPendingFeedback ? '有待完成的反馈' : '暂无待反馈记录'}
              </Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
          <View className={styles.menuItem} onClick={handleSettingsClick}>
            <View className={styles.menuIcon}>
              <Text>⚙️</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuName}>设置</Text>
              <Text className={styles.menuDesc}>应用设置和偏好</Text>
            </View>
            <Text className={styles.menuArrow}>›</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>关于</Text>
        <View className={styles.menuList}>
          <View className={styles.menuItem}>
            <View className={styles.menuIcon}>
              <Text>🎧</Text>
            </View>
            <View className={styles.menuContent}>
              <Text className={styles.menuName}>助眠白噪音</Text>
              <Text className={styles.menuDesc}>v1.0.0</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default MinePage
