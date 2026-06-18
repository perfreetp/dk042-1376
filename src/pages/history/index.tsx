import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { usePreferenceStore } from '@/store/usePreferenceStore'
import { SleepRecord, SleepFeedback } from '@/types'
import dayjs from 'dayjs'
import styles from './index.module.scss'

const HistoryPage: React.FC = () => {
  const { getSleepRecords, getSleepFeedbacks, getAverageSleepDuration } = usePreferenceStore()
  const [records, setRecords] = useState<SleepRecord[]>([])
  const [feedbacks, setFeedbacks] = useState<SleepFeedback[]>([])

  useEffect(() => {
    setRecords(getSleepRecords())
    setFeedbacks(getSleepFeedbacks())
  }, [getSleepRecords, getSleepFeedbacks])

  const avgDuration = useMemo(() => getAverageSleepDuration(), [getAverageSleepDuration])

  const getFeedbackForRecord = useCallback((recordId: string, recordDate: string) => {
    return feedbacks.find(f => f.date === recordDate)
  }, [feedbacks])

  const getFeedbackLabels = useCallback((feedback: SleepFeedback | undefined) => {
    if (!feedback) return []
    const labels: string[] = []

    if (feedback.fasterAsleep === 'yes') labels.push('入睡更快 ✓')
    else if (feedback.fasterAsleep === 'somewhat') labels.push('稍有帮助')

    if (feedback.wokeUp === 'never') labels.push('安睡整晚 ✓')
    else if (feedback.wokeUp === 'once') labels.push('醒来一次')
    else if (feedback.wokeUp === 'multiple') labels.push('多次醒来')

    if (feedback.soundHarsh === 'no') labels.push('声音舒适 ✓')
    else if (feedback.soundHarsh === 'somewhat') labels.push('略有不适')

    return labels
  }, [])

  const groupedRecords = useMemo(() => {
    const groups: Record<string, SleepRecord[]> = {}
    records.forEach(record => {
      const dateLabel = record.date === dayjs().format('YYYY-MM-DD')
        ? '今天'
        : record.date === dayjs().subtract(1, 'day').format('YYYY-MM-DD')
          ? '昨天'
          : dayjs(record.date).format('YYYY年MM月DD日')

      if (!groups[dateLabel]) {
        groups[dateLabel] = []
      }
      groups[dateLabel].push(record)
    })
    return groups
  }, [records])

  const formatTime = (timestamp: number) => {
    return dayjs(timestamp).format('HH:mm')
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
    <ScrollView className={styles.historyPage} scrollY>
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
          <Text className={styles.sectionTitle}>睡眠记录</Text>
        </View>
        <View className={styles.recordList}>
          {Object.entries(groupedRecords).map(([dateLabel, dateRecords]) => (
            <View key={dateLabel} className={styles.dateGroup}>
              <Text className={styles.dateHeader}>{dateLabel}</Text>
              {dateRecords.map(record => {
                const feedback = getFeedbackForRecord(record.id, record.date)
                const feedbackLabels = getFeedbackLabels(feedback)

                return (
                  <View key={record.id} className={styles.recordItem}>
                    <View className={styles.recordHeader}>
                      <View className={styles.recordIcon}>
                        <Text>{'🌙'}</Text>
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
                          {feedbackLabels.map((label, index) => (
                            <Text key={index} className={styles.feedbackTag}>
                              {label}
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
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

export default HistoryPage
