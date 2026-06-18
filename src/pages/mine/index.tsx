import React, { useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import { useFeedbackStore } from '@/store/useFeedbackStore'
import { usePlayerStore } from '@/store/usePlayerStore'
import { getSceneById } from '@/data/scenes'
import { getUserStateById } from '@/data/states'
import { SleepFeedback } from '@/types'
import {
  getAverageDuration,
  getMostUsedScene,
  getRecommendedSettingsForScene
} from '@/utils/sleep'
import styles from './index.module.scss'

const scoreFeedback = (f: SleepFeedback): number => {
  let s = 0
  s += f.fasterAsleep === 'yes' ? 2 : f.fasterAsleep === 'somewhat' ? 1 : 0
  if (f.wokeUp) s += f.wokeUp === 'never' ? 2 : f.wokeUp === 'once' ? 1 : 0
  if (f.soundHarsh) s += f.soundHarsh === 'no' ? 2 : f.soundHarsh === 'somewhat' ? 1 : 0
  return s
}

const MinePage: React.FC = () => {
  const {
    loadPreference,
    recommendedSceneId,
    feedbackCount,
    getSleepRecords,
    getSleepFeedbacks
  } = usePreferenceStore()
  const { hasPendingFeedback, checkPendingFeedback } = useFeedbackStore()
  const { setScene, setUserState, setDuration } = usePlayerStore()
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
  const feedbacks = useMemo(() => getSleepFeedbacks(), [getSleepFeedbacks, refreshKey])
  const avgDuration = useMemo(() => getAverageDuration(records), [records])
  const mostUsed = useMemo(() => getMostUsedScene(records), [records])

  const handleHistoryClick = useCallback(() => {
    Taro.navigateTo({ url: '/pages/history/index' })
  }, [])

  const handleFeedbackClick = useCallback(() => {
    Taro.navigateTo({ url: '/pages/feedback/index' })
  }, [])

  const handleSettingsClick = useCallback(() => {
    Taro.showToast({ title: '设置功能开发中', icon: 'none' })
  }, [])

  const mostUsedScene = mostUsed?.scene || null
  const recommendedScene = recommendedSceneId ? getSceneById(recommendedSceneId) : null
  const progressPercent = Math.min(100, (feedbackCount % 3) / 3 * 100)

  const recommendedSettings = useMemo(() => {
    if (!recommendedSceneId) return null
    return getRecommendedSettingsForScene(recommendedSceneId, records, feedbacks)
  }, [recommendedSceneId, records, feedbacks])

  const recommendedUserState = recommendedSettings?.userStateId
    ? getUserStateById(recommendedSettings.userStateId)
    : null

  const sceneCompare = useMemo(() => {
    if (!recommendedScene) return null
    const recRecords = records.filter(r => r.sceneId === recommendedScene.id)
    const recFeedbacks = feedbacks.filter(f => f.sceneId === recommendedScene.id)
    const recScore = recFeedbacks.length
      ? (recFeedbacks.reduce((s, f) => s + scoreFeedback(f), 0) / recFeedbacks.length).toFixed(1)
      : '-'
    const recAvg = recRecords.length
      ? Math.round(recRecords.reduce((s, r) => s + r.duration, 0) / recRecords.length)
      : 0

    let mostUsedInfo = null as null | {
      sceneName: string
      count: number
      avgDuration: number
      avgScore: string
    }
    if (mostUsedScene && mostUsed && mostUsedScene.id !== recommendedScene.id) {
      const muRecords = records.filter(r => r.sceneId === mostUsedScene.id)
      const muFeedbacks = feedbacks.filter(f => f.sceneId === mostUsedScene.id)
      const muScore = muFeedbacks.length
        ? (muFeedbacks.reduce((s, f) => s + scoreFeedback(f), 0) / muFeedbacks.length).toFixed(1)
        : '-'
      const muAvg = muRecords.length
        ? Math.round(muRecords.reduce((s, r) => s + r.duration, 0) / muRecords.length)
        : 0
      mostUsedInfo = {
        sceneName: mostUsedScene.name,
        count: mostUsed.count,
        avgDuration: muAvg,
        avgScore: muScore
      }
    }

    return {
      recommended: {
        count: recRecords.length,
        avgDuration: recAvg,
        avgScore: recScore
      },
      mostUsed: mostUsedInfo
    }
  }, [recommendedScene, mostUsedScene, mostUsed, records, feedbacks])

  const recommendationReasons = useMemo(() => {
    if (!recommendedSceneId || feedbacks.length === 0) return []
    const sceneFeedbacks = feedbacks.filter(f => f.sceneId === recommendedSceneId).slice(0, 3)
    if (sceneFeedbacks.length === 0) return []

    const reasons: { icon: string; text: string }[] = []
    const fasterYes = sceneFeedbacks.filter(f => f.fasterAsleep === 'yes').length
    const fasterSomewhat = sceneFeedbacks.filter(f => f.fasterAsleep === 'somewhat').length
    if (fasterYes > 0) {
      reasons.push({ icon: '✅', text: `最近${fasterYes}次使用，入睡都比平时快` })
    } else if (fasterSomewhat > 0) {
      reasons.push({ icon: '🙂', text: `最近${fasterSomewhat}次都有轻微帮助` })
    }
    const neverWoke = sceneFeedbacks.filter(f => f.wokeUp === 'never').length
    if (neverWoke > 0) {
      reasons.push({ icon: '😴', text: `${neverWoke}次都安睡整晚，没有中途醒来` })
    }
    const soundComfortable = sceneFeedbacks.filter(f => f.soundHarsh === 'no').length
    if (soundComfortable > 0) {
      reasons.push({ icon: '🎵', text: `声音舒适度在${soundComfortable}次反馈中都得到好评` })
    }
    return reasons.slice(0, 3)
  }, [recommendedSceneId, feedbacks])

  const handleStartRecommended = useCallback(() => {
    if (!recommendedSceneId) return
    setScene(recommendedSceneId)
    if (recommendedSettings?.userStateId) {
      setUserState(recommendedSettings.userStateId)
    }
    if (recommendedSettings?.duration) {
      setDuration(recommendedSettings.duration)
    }
    Taro.navigateTo({ url: '/pages/player/index' })
  }, [recommendedSceneId, recommendedSettings, setScene, setUserState, setDuration])

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
            <Text className={styles.progressText}>已完成 {feedbackCount}/3 次反馈</Text>
            <View className={styles.progressBar}>
              <View className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </View>
          </View>
        </View>
      )}

      {recommendedScene && feedbackCount >= 3 && sceneCompare && (
        <View className={styles.recommendationCard}>
          <View className={styles.recommendationHeader}>
            <View
              className={styles.recommendationIcon}
              style={{ backgroundColor: `${recommendedScene.color}30` }}
            >
              <Text>{recommendedScene.icon}</Text>
            </View>
            <View className={styles.recommendationInfo}>
              <Text className={styles.recommendationTitle}>✨ 你的专属推荐</Text>
              <Text className={styles.recommendationScene}>「{recommendedScene.name}」</Text>
            </View>
          </View>
          <Text className={styles.recommendationDesc}>
            基于你的 {feedbackCount} 次睡眠反馈，这是综合得分最高的场景。
          </Text>

          {recommendationReasons.length > 0 && (
            <View className={styles.recommendationReasons}>
              <Text className={styles.reasonsTitle}>推荐理由</Text>
              <View className={styles.reasonsList}>
                {recommendationReasons.map((r, idx) => (
                  <View key={idx} className={styles.reasonItem}>
                    <Text className={styles.icon}>{r.icon}</Text>
                    <Text>{r.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className={styles.recommendationCompare}>
            <Text className={styles.compareTitle}>与常用场景对比</Text>
            <View className={styles.compareRow}>
              <View className={`${styles.compareBlock} ${styles.recommended}`}>
                <Text className={styles.label}>推荐 · {recommendedScene.name}</Text>
                <Text className={styles.value}>综合 {sceneCompare.recommended.avgScore}/6 分</Text>
                <Text className={styles.sub}>
                  {sceneCompare.recommended.count} 次 · 平均 {sceneCompare.recommended.avgDuration} 分钟
                </Text>
              </View>
              {sceneCompare.mostUsed ? (
                <View className={styles.compareBlock}>
                  <Text className={styles.label}>常用 · {sceneCompare.mostUsed.sceneName}</Text>
                  <Text className={styles.value}>综合 {sceneCompare.mostUsed.avgScore}/6 分</Text>
                  <Text className={styles.sub}>
                    {sceneCompare.mostUsed.count} 次 · 平均 {sceneCompare.mostUsed.avgDuration} 分钟
                  </Text>
                </View>
              ) : (
                <View className={styles.compareBlock}>
                  <Text className={styles.label}>常用场景</Text>
                  <Text className={styles.value}>与推荐相同</Text>
                  <Text className={styles.sub}>继续保持这个好习惯</Text>
                </View>
              )}
            </View>
          </View>

          {recommendedSettings && (
            <View className={styles.recommendedSettings}>
              <Text className={styles.settingsTitle}>为你预设的配置</Text>
              <View className={styles.settingsRow}>
                <View className={styles.settingItem}>
                  <Text className={styles.label}>推荐时长</Text>
                  <Text className={styles.value}>{recommendedSettings.duration} 分钟</Text>
                </View>
                <View className={styles.settingItem}>
                  <Text className={styles.label}>推荐状态</Text>
                  <Text className={styles.value}>
                    {recommendedUserState ? recommendedUserState.name : '自动匹配'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <View className={styles.recommendationStart} onClick={handleStartRecommended}>
            立即使用推荐场景
          </View>
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
