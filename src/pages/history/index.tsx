import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import { SleepRecord, SleepFeedback } from '@/types'
import dayjs from 'dayjs'
import {
  formatSleepNightLabel,
  buildFeedbackTags,
  getAverageDuration
} from '@/utils/sleep'
import { getSceneById } from '@/data/scenes'
import styles from './index.module.scss'

interface NightGroup {
  sleepNight: string
  label: string
  records: SleepRecord[]
}

const HistoryPage: React.FC = () => {
  const { getSleepRecords, getSleepFeedbacks } = usePreferenceStore()
  const router = useRouter()
  const [records, setRecords] = useState<SleepRecord[]>([])
  const [feedbacks, setFeedbacks] = useState<SleepFeedback[]>([])
  const [highlightRecordId, setHighlightRecordId] = useState<string | null>(null)

  const refreshData = useCallback(() => {
    setRecords(getSleepRecords())
    setFeedbacks(getSleepFeedbacks())
  }, [getSleepRecords, getSleepFeedbacks])

  useEffect(() => {
    const rid = (router.params && router.params.recordId) || null
    if (typeof rid === 'string' && rid) setHighlightRecordId(rid)
    refreshData()
  }, [router.params, refreshData])

  useDidShow(() => {
    refreshData()
  })

  const avgDuration = useMemo(() => getAverageDuration(records), [records])

  const getFeedbackForRecord = useCallback((record: SleepRecord): SleepFeedback | undefined => {
    if (record.feedbackId) return feedbacks.find(f => f.id === record.feedbackId)
    return feedbacks.find(f => f.recordId === record.id)
  }, [feedbacks])

  const nightGroups = useMemo((): NightGroup[] => {
    const byNight: Record<string, SleepRecord[]> = {}
    records.forEach(record => {
      const night = record.sleepNight || record.date
      if (!byNight[night]) byNight[night] = []
      byNight[night].push(record)
    })
    return Object.keys(byNight)
      .sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf())
      .map(night => ({
        sleepNight: night,
        label: formatSleepNightLabel(night),
        records: byNight[night].sort((a, b) => b.startTime - a.startTime)
      }))
  }, [records])

  const formatTime = (timestamp: number) => dayjs(timestamp).format('HH:mm')

  const summarizeNight = (nightRecords: SleepRecord[]) => {
    const totalMins = nightRecords.reduce((s, r) => s + r.duration, 0)
    const fedCount = nightRecords.filter(r => r.feedbackId).length
    const sceneIds = [...new Set(nightRecords.map(r => r.sceneId))]
    return {
      totalMins,
      sessions: nightRecords.length,
      fedCount,
      scenesLabel: sceneIds
        .map(id => getSceneById(id)?.name)
        .filter(Boolean)
        .slice(0, 2)
        .join(' · ')
    }
  }

  if (records.length === 0) {
    return (
      <ScrollView className={styles.historyPage} scrollY>
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>🌙</Text>
          <Text className={styles.emptyTitle}>暂无睡眠记录</Text>
          <Text className={styles.emptyDesc}>
            开始使用助眠白噪音后，你的睡眠记录将在这里显示
          </Text>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView className={styles.historyPage} scrollY scroll-into-view={highlightRecordId ? `record-${highlightRecordId}` : undefined}>
      <View className={styles.statsCard}>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{records.length}</Text>
            <Text className={styles.statLabel}>总使用次数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{avgDuration || 0}</Text>
            <Text className={styles.statLabel}>平均时长(分)</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{feedbacks.length}</Text>
            <Text className={styles.statLabel}>反馈次数</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>睡眠复盘</Text>
        </View>
        <View className={styles.recordList}>
          {nightGroups.map(group => {
            const summary = summarizeNight(group.records)
            return (
              <View key={group.sleepNight} className={styles.nightGroup}>
                <View className={styles.nightHeader}>
                  <Text className={styles.nightTitle}>{group.label}</Text>
                  <View className={styles.nightOverview}>
                    <Text className={styles.nightTag}>{summary.sessions} 次播放</Text>
                    {summary.fedCount > 0 && (
                      <Text className={styles.nightTag} style={{ background: 'rgba(61, 213, 152, 0.15)', color: '#3dd598' }}>
                        {summary.fedCount} 份反馈
                      </Text>
                    )}
                  </View>
                </View>
                <View className={styles.nightStats}>
                  <View className={styles.nightStat}>
                    <Text className={styles.nightStatValue}>{summary.totalMins} 分</Text>
                    <Text className={styles.nightStatLabel}>总时长</Text>
                  </View>
                  {summary.scenesLabel && (
                    <View className={styles.nightStat}>
                      <Text className={styles.nightStatValue} numberOfLines={1}>{summary.scenesLabel}</Text>
                      <Text className={styles.nightStatLabel}>使用场景</Text>
                    </View>
                  )}
                </View>
                <View className={styles.nightRecords}>
                  {group.records.map(record => {
                    const feedback = getFeedbackForRecord(record)
                    const tags = buildFeedbackTags(feedback)
                    const isHighlighted = highlightRecordId === record.id
                    const scene = getSceneById(record.sceneId)

                    return (
                      <View
                        key={record.id}
                        id={`record-${record.id}`}
                        className={`${styles.recordItem} ${isHighlighted ? styles.highlighted : ''}`}
                      >
                        <View className={styles.recordHeader}>
                          <View
                            className={styles.recordIcon}
                            style={{ backgroundColor: scene ? `${scene.color}20` : undefined }}
                          >
                            <Text>{scene?.icon || '🌙'}</Text>
                          </View>
                          <View className={styles.recordInfo}>
                            <Text className={styles.recordTitle}>
                              {record.sceneName} · {record.userStateName}
                            </Text>
                            <Text className={styles.recordMeta}>
                              {formatTime(record.startTime)} - {formatTime(record.endTime)}
                            </Text>
                          </View>
                        </View>
                        <View className={styles.recordBody}>
                          <View className={styles.recordDetail}>
                            <Text className={styles.detailValue}>{record.duration}</Text>
                            <Text className={styles.detailLabel}>分钟</Text>
                          </View>
                        </View>
                        <View className={styles.feedbackSection}>
                          <Text className={styles.feedbackTitle}>睡眠反馈</Text>
                          {feedback ? (
                            <View className={styles.feedbackTags}>
                              {tags.map((tag, i) => (
                                <Text
                                  key={i}
                                  className={`${styles.feedbackTag} ${styles[tag.type]}`}
                                >
                                  {tag.text}
                                </Text>
                              ))}
                            </View>
                          ) : (
                            <Text className={styles.noFeedback}>暂无反馈</Text>
                          )}
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}

export default HistoryPage
