import React from 'react'
import { View, Text, Slider } from '@tarojs/components'
import styles from './index.module.scss'

interface AudioSliderProps {
  icon: string
  name: string
  color: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

const AudioSlider: React.FC<AudioSliderProps> = ({
  icon,
  name,
  color,
  value,
  onChange,
  disabled = false
}) => {
  const handleChange = (e: any) => {
    if (!disabled) {
      onChange(e.detail.value)
    }
  }

  return (
    <View className={styles.audioSlider}>
      <View className={styles.sliderHeader}>
        <View className={styles.trackInfo}>
          <View
            className={styles.trackIcon}
            style={{ backgroundColor: `${color}20` }}
          >
            <Text>{icon}</Text>
          </View>
          <Text className={styles.trackName}>{name}</Text>
        </View>
        <Text className={styles.trackValue}>{value}%</Text>
      </View>
      <View className={styles.sliderWrapper}>
        <View className={styles.sliderTrack}>
          <View
            className={styles.sliderFill}
            style={{
              width: `${value}%`,
              backgroundColor: color
            }}
          />
        </View>
        <Slider
          className={styles.sliderInput}
          min={0}
          max={100}
          value={value}
          step={1}
          onChange={handleChange}
          activeColor='transparent'
          backgroundColor='transparent'
          blockSize={24}
          disabled={disabled}
        />
        <View
          className={styles.sliderThumb}
          style={{
            left: `${value}%`,
            border: `4rpx solid ${color}`
          }}
        />
      </View>
    </View>
  )
}

export default AudioSlider
