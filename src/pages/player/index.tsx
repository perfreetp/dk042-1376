import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { usePlayerStore } from '@/store/usePlayerStore'
import { audioTracks, durationOptions, getSceneById } from '@/data/scenes'
import { userStates, getUserStateById } from '@/data/states'
import AudioSlider from '@/components/AudioSlider'
import StateSelector from '@/components/StateSelector'
import DurationSelector from '@/components/DurationSelector'
import { useAudioPlayer } from '@/hooks/useAudioPlayer'
import { useCountdownTimer } from '@/hooks/useCountdownTimer'
import { formatTime } from '@/utils/audio'
import styles from './index.module.scss'

const PlayerPage: React.FC = () => {
  const [showStateSelector, setShowStateSelector] = useState(false)
  const {
    sceneId,
    userStateId,
    duration,
    mix,
    isPlaying,
    isFading,
    currentVolume,
    remainingTime,
    elapsedTime,
    startTime,
    setUserState,
    setDuration,
    setMix,
    startPlayback,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    updateElapsedTime
  } = usePlayerStore()

  const currentScene = useMemo(() => getSceneById(sceneId), [sceneId])
  const currentState = useMemo(() => getUserStateById(userStateId), [userStateId])

  const sessionStarted = startTime !== null
  const isPaused = sessionStarted && !isPlaying

  useAudioPlayer({
    mix,
    masterVolume: currentVolume,
    isPlaying
  })

  useCountdownTimer({
    isRunning: isPlaying,
    onTick: updateElapsedTime
  })

  useEffect(() => {
    return () => {
      if (isPlaying) {
        pausePlayback()
      }
    }
  }, [isPlaying, pausePlayback])

  const handleStateSelect = useCallback((stateId: string) => {
    setUserState(stateId)
    setShowStateSelector(false)
  }, [setUserState])

  const handleMixChange = useCallback((type: keyof typeof mix) => (value: number) => {
    setMix({ [type]: value })
  }, [setMix])

  const handleStart = useCallback(() => {
    startPlayback()
    console.log('[PlayerPage] 全新开始播放', { sceneId, userStateId, duration })
  }, [startPlayback, sceneId, userStateId, duration])

  const handlePause = useCallback(() => {
    pausePlayback()
    console.log('[PlayerPage] 暂停播放，保留进度', { elapsedTime, remainingTime })
  }, [pausePlayback, elapsedTime, remainingTime])

  const handleResume = useCallback(() => {
    resumePlayback()
    console.log('[PlayerPage] 继续播放，从', elapsedTime, '秒处接续')
  }, [resumePlayback, elapsedTime])

  const handleStop = useCallback(() => {
    Taro.showModal({
      title: '确认停止',
      content: '确定要停止播放吗？将保存本次睡眠记录。',
      confirmText: '停止',
      cancelText: '继续',
      success: (res) => {
        if (res.confirm) {
          stopPlayback()
          Taro.navigateBack()
        }
      }
    })
  }, [stopPlayback])

  const progressPercent = useMemo(() => {
    const totalSeconds = duration * 60
    return totalSeconds > 0 ? (elapsedTime / totalSeconds) * 100 : 0
  }, [elapsedTime, duration])

  if (!currentScene || !currentState) {
    return (
      <View className={styles.playerPage}>
        <Text>加载中...</Text>
      </View>
    )
  }

  return (
    <ScrollView className={styles.playerPage} scrollY>
      <View className={styles.sceneHeader}>
        <View
          className={styles.sceneIcon}
          style={{ backgroundColor: `${currentScene.color}20` }}
        >
          <Text>{currentScene.icon}</Text>
        </View>
        <View className={styles.sceneInfo}>
          <Text className={styles.sceneName}>{currentScene.name}</Text>
          <Text className={styles.sceneDesc}>{currentScene.description}</Text>
        </View>
      </View>

      {!sessionStarted && (
        <>
          <View className={styles.stateSelector}>
            <View className={styles.sectionHeader}>
              <Text className={styles.sectionTitle}>当前状态</Text>
              <Text
                className={styles.editButton}
                onClick={() => setShowStateSelector(!showStateSelector)}
              >
                {showStateSelector ? '收起' : '切换'}
              </Text>
            </View>
            {!showStateSelector ? (
              <View className={styles.selectedState}>
                <View className={styles.selectedStateIcon}>
                  <Text>{currentState.icon}</Text>
                </View>
                <View className={styles.selectedStateInfo}>
                  <Text className={styles.selectedStateName}>{currentState.name}</Text>
                  <Text className={styles.selectedStateDesc}>{currentState.description}</Text>
                </View>
              </View>
            ) : (
              <StateSelector
                states={userStates}
                selectedId={userStateId}
                onSelect={handleStateSelect}
                title=""
              />
            )}
          </View>

          <DurationSelector
            options={durationOptions}
            selectedValue={duration}
            onSelect={setDuration}
          />

          <View className={styles.mixSection}>
            <Text className={styles.mixTitle}>调节混音</Text>
            {audioTracks.map(track => (
              <AudioSlider
                key={track.type}
                icon={track.icon}
                name={track.name}
                color={track.color}
                value={mix[track.type]}
                onChange={handleMixChange(track.type)}
              />
            ))}
          </View>

          <View className={styles.bottomBar}>
            <View className={styles.startButton} onClick={handleStart}>
              开始播放
            </View>
          </View>
        </>
      )}

      {(isPlaying || isPaused) && (
        <>
          <View className={styles.timerSection}>
            <Text className={styles.timerDisplay}>{formatTime(remainingTime)}</Text>
            <Text className={styles.timerLabel}>
              {isPaused ? '已暂停 · ' : ''}
              还剩 {Math.ceil(remainingTime / 60)} 分钟
            </Text>
            {isFading && (
              <View className={styles.fadeIndicator}>
                <Text className={styles.icon}>🌙</Text>
                <Text>正在渐弱中...</Text>
              </View>
            )}
            {!isFading && remainingTime > 600 && (
              <Text className={styles.volumeIndicator}>
                最后10分钟将自动渐弱音量
              </Text>
            )}
            <View className={styles.progressBar}>
              <View
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </View>
            <View className={styles.progressLabels}>
              <Text>{formatTime(elapsedTime)}</Text>
              <Text>{formatTime(duration * 60)}</Text>
            </View>
          </View>

          <View className={styles.mixSection}>
            <Text className={styles.mixTitle}>实时调节</Text>
            {audioTracks.map(track => (
              <AudioSlider
                key={track.type}
                icon={track.icon}
                name={track.name}
                color={track.color}
                value={mix[track.type]}
                onChange={handleMixChange(track.type)}
              />
            ))}
          </View>

          <View className={styles.controls}>
            <View className={styles.controlButton} onClick={handleStop}>
              <Text>⏹️</Text>
            </View>
            {isPlaying && (
              <View
                className={`${styles.controlButton} ${styles.playButton}`}
                onClick={handlePause}
              >
                <Text>⏸️</Text>
              </View>
            )}
            {isPaused && (
              <View
                className={`${styles.controlButton} ${styles.playButton}`}
                onClick={handleResume}
              >
                <Text>▶️</Text>
              </View>
            )}
            <View
              className={styles.controlButton}
              onClick={() => {
                Taro.showToast({
                  title: `当前音量 ${Math.round(currentVolume * 100)}%`,
                  icon: 'none'
                })
              }}
            >
              <Text>{isFading ? '🔈' : '🔊'}</Text>
            </View>
          </View>

          <View className={styles.section}>
            <View className={styles.stateSelector}>
              <View className={styles.sectionHeader}>
                <Text className={styles.sectionTitle}>播放信息</Text>
              </View>
              <View className={styles.selectedState}>
                <View className={styles.selectedStateIcon}>
                  <Text>{currentState.icon}</Text>
                </View>
                <View className={styles.selectedStateInfo}>
                  <Text className={styles.selectedStateName}>
                    {currentScene.name} · {currentState.name}
                  </Text>
                  <Text className={styles.selectedStateDesc}>
                    播放时长 {duration} 分钟
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  )
}

export default PlayerPage
