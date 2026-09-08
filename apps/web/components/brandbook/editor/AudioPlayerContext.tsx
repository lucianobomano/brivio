"use client"

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react"

export interface AudioTrack {
    id?: string
    url: string
    title: string
    caption?: string
    blockTitle?: string
    style?: any
    blockId?: string
    index?: number
}

export interface AudioPlayerContextType {
    activeTrack: AudioTrack | null
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
    isMuted: boolean
    isLoop: boolean
    playbackRate: number
    playlist: AudioTrack[]
    accentColor: string
    playTrack: (track: AudioTrack, playlist?: AudioTrack[]) => void
    pauseTrack: () => void
    resumeTrack: () => void
    togglePlayPause: (track?: AudioTrack, playlist?: AudioTrack[]) => void
    seek: (time: number) => void
    setVolume: (volume: number) => void
    toggleMute: () => void
    toggleLoop: () => void
    setPlaybackRate: (rate: number) => void
    nextTrack: () => void
    prevTrack: () => void
    closePlayer: () => void
    updateTrackCaption: (url: string, newCaption: string) => void
}

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null)

interface AudioPlayerProviderProps {
    children: React.ReactNode
    accentColor?: string
}

export function AudioPlayerProvider({ children, accentColor = '#FF0054' }: AudioPlayerProviderProps) {
    const [activeTrack, setActiveTrack] = useState<AudioTrack | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolumeState] = useState(0.8)
    const [isMuted, setIsMuted] = useState(false)
    const [isLoop, setIsLoop] = useState(false)
    const [playbackRate, setPlaybackRateState] = useState(1)
    const [playlist, setPlaylist] = useState<AudioTrack[]>([])

    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Ensure audio element exists
    useEffect(() => {
        if (typeof window === 'undefined') return

        const audio = new Audio()
        audio.preload = 'metadata'
        audio.volume = volume
        audioRef.current = audio

        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)
        const handleTimeUpdate = () => {
            if (audio) {
                setCurrentTime(audio.currentTime)
            }
        }
        const handleDurationChange = () => {
            if (audio && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setDuration(audio.duration)
            }
        }
        const handleLoadedMetadata = () => {
            if (audio && !isNaN(audio.duration) && isFinite(audio.duration)) {
                setDuration(audio.duration)
            }
        }
        const handleEnded = () => {
            if (audio.loop) return
            // Auto play next in playlist if available
            setPlaylist(currentPlaylist => {
                if (currentPlaylist.length > 1) {
                    setActiveTrack(currentTrack => {
                        if (!currentTrack) return null
                        const currentIndex = currentPlaylist.findIndex(t => t.url === currentTrack.url)
                        if (currentIndex !== -1 && currentIndex < currentPlaylist.length - 1) {
                            const next = currentPlaylist[currentIndex + 1]
                            setTimeout(() => {
                                playTrack(next, currentPlaylist)
                            }, 300)
                            return currentTrack
                        }
                        setIsPlaying(false)
                        return currentTrack
                    })
                } else {
                    setIsPlaying(false)
                }
                return currentPlaylist
            })
        }

        const handleError = (e: any) => {
            console.warn('[AudioPlayer] Audio playback error:', e)
            setIsPlaying(false)
        }

        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)
        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('durationchange', handleDurationChange)
        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)

        return () => {
            audio.pause()
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('durationchange', handleDurationChange)
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('error', handleError)
            audioRef.current = null
        }
    }, [])

    const playTrack = useCallback((track: AudioTrack, trackList?: AudioTrack[]) => {
        const audio = audioRef.current
        if (!audio || !track?.url) return

        if (trackList && trackList.length > 0) {
            setPlaylist(trackList)
        }

        const isSameTrack = activeTrack?.url === track.url
        if (isSameTrack && audio.src) {
            audio.play().catch(err => console.warn('[AudioPlayer] Play failed:', err))
            setIsPlaying(true)
            return
        }

        setActiveTrack(track)
        setCurrentTime(0)
        setDuration(0)

        const shouldLoop = track.style?.isLoop ?? isLoop
        setIsLoop(shouldLoop)
        audio.loop = shouldLoop

        audio.src = track.url
        audio.currentTime = 0
        audio.playbackRate = playbackRate

        audio.play().then(() => {
            setIsPlaying(true)
        }).catch(err => {
            console.warn('[AudioPlayer] Play failed:', err)
            setIsPlaying(false)
        })
    }, [activeTrack, isLoop, playbackRate])

    const pauseTrack = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
        }
    }, [])

    const resumeTrack = useCallback(() => {
        if (audioRef.current && activeTrack) {
            audioRef.current.play().catch(err => console.warn('[AudioPlayer] Resume failed:', err))
            setIsPlaying(true)
        }
    }, [activeTrack])

    const togglePlayPause = useCallback((track?: AudioTrack, trackList?: AudioTrack[]) => {
        if (track && (!activeTrack || activeTrack.url !== track.url)) {
            playTrack(track, trackList)
            return
        }

        if (isPlaying) {
            pauseTrack()
        } else {
            if (activeTrack) {
                resumeTrack()
            } else if (track) {
                playTrack(track, trackList)
            }
        }
    }, [activeTrack, isPlaying, playTrack, pauseTrack, resumeTrack])

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            const clampedTime = Math.max(0, Math.min(time, duration || 0))
            audioRef.current.currentTime = clampedTime
            setCurrentTime(clampedTime)
        }
    }, [duration])

    const setVolume = useCallback((newVolume: number) => {
        const clamped = Math.max(0, Math.min(1, newVolume))
        setVolumeState(clamped)
        if (audioRef.current) {
            audioRef.current.volume = clamped
            if (clamped > 0 && isMuted) {
                audioRef.current.muted = false
                setIsMuted(false)
            }
        }
    }, [isMuted])

    const toggleMute = useCallback(() => {
        if (audioRef.current) {
            const nextMuted = !isMuted
            audioRef.current.muted = nextMuted
            setIsMuted(nextMuted)
        }
    }, [isMuted])

    const toggleLoop = useCallback(() => {
        if (audioRef.current) {
            const nextLoop = !isLoop
            audioRef.current.loop = nextLoop
            setIsLoop(nextLoop)
        }
    }, [isLoop])

    const setPlaybackRate = useCallback((rate: number) => {
        setPlaybackRateState(rate)
        if (audioRef.current) {
            audioRef.current.playbackRate = rate
        }
    }, [])

    const nextTrack = useCallback(() => {
        if (!activeTrack) return
        if (playlist.length > 1) {
            const currentIndex = playlist.findIndex(t => t.url === activeTrack.url)
            const nextIndex = (currentIndex + 1) % playlist.length
            playTrack(playlist[nextIndex], playlist)
        } else if (audioRef.current) {
            // Skip 10 seconds forward
            seek(currentTime + 10)
        }
    }, [activeTrack, playlist, playTrack, currentTime, seek])

    const prevTrack = useCallback(() => {
        if (!activeTrack) return
        if (currentTime > 3) {
            seek(0)
            return
        }
        if (playlist.length > 1) {
            const currentIndex = playlist.findIndex(t => t.url === activeTrack.url)
            const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length
            playTrack(playlist[prevIndex], playlist)
        } else if (audioRef.current) {
            seek(Math.max(0, currentTime - 10))
        }
    }, [activeTrack, playlist, playTrack, currentTime, seek])

    const closePlayer = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            audioRef.current.src = ""
        }
        setActiveTrack(null)
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(0)
    }, [])

    const updateTrackCaption = useCallback((url: string, newCaption: string) => {
        setActiveTrack(prev => {
            if (prev && prev.url === url) {
                return { ...prev, caption: newCaption, title: newCaption || prev.title }
            }
            return prev
        })
        setPlaylist(prev => prev.map(t => t.url === url ? { ...t, caption: newCaption, title: newCaption || t.title } : t))
    }, [])

    return (
        <AudioPlayerContext.Provider
            value={{
                activeTrack,
                isPlaying,
                currentTime,
                duration,
                volume,
                isMuted,
                isLoop,
                playbackRate,
                playlist,
                accentColor,
                playTrack,
                pauseTrack,
                resumeTrack,
                togglePlayPause,
                seek,
                setVolume,
                toggleMute,
                toggleLoop,
                setPlaybackRate,
                nextTrack,
                prevTrack,
                closePlayer,
                updateTrackCaption
            }}
        >
            {children}
        </AudioPlayerContext.Provider>
    )
}

export function useAudioPlayer() {
    const context = useContext(AudioPlayerContext)
    return context
}
