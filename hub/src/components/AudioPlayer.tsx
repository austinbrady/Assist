'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './AudioPlayer.module.css'

interface AudioPlayerProps {
  audioPath: string
  metadata?: {
    title?: string
    artist?: string
    album?: string
    duration?: number
    [key: string]: any
  }
}

export function AudioPlayer({ audioPath, metadata }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Load audio file as blob to handle authentication
  useEffect(() => {
    const loadAudio = async () => {
      if (!audioPath) return
      
      setLoading(true)
      const MIDDLEWARE_URL = process.env.NEXT_PUBLIC_MIDDLEWARE_URL || 'http://localhost:4199'
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('assisant_ai_token') || '' : ''
      
      try {
        const response = await fetch(
          `${MIDDLEWARE_URL}/api/filesystem/read?path=${encodeURIComponent(audioPath)}&stream=true`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        )
        
        if (response.ok) {
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          setAudioUrl(url)
        } else {
          console.error('Failed to load audio file:', response.statusText)
        }
      } catch (error) {
        console.error('Error loading audio:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAudio()
    
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioPath])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [audioUrl])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = parseFloat(e.target.value)
    audio.volume = newVolume
    setVolume(newVolume)
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading || !audioUrl) {
    return (
      <div className={styles.audioPlayer}>
        <div className={styles.loading}>Loading audio...</div>
      </div>
    )
  }

  return (
    <div className={styles.audioPlayer}>
      <div className={styles.metadata}>
        <h3 className={styles.title}>{metadata?.title || audioPath.split('/').pop() || 'Unknown'}</h3>
        {metadata?.artist && (
          <p className={styles.artist}>{metadata.artist}</p>
        )}
        {metadata?.album && (
          <p className={styles.album}>{metadata.album}</p>
        )}
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration)
          }
        }}
        preload="metadata"
      />

      <div className={styles.controls}>
        <button
          onClick={togglePlay}
          className={styles.playButton}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>

        <div className={styles.progressContainer}>
          <span className={styles.time}>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className={styles.progressBar}
          />
          <span className={styles.time}>{formatTime(duration)}</span>
        </div>

        <div className={styles.volumeContainer}>
          <span className={styles.volumeIcon}>🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className={styles.volumeBar}
          />
        </div>
      </div>

      {metadata && Object.keys(metadata).length > 0 && (
        <div className={styles.metadataDetails}>
          <h4>Metadata</h4>
          <ul>
            {Object.entries(metadata).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {String(value)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
