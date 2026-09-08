"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useAudioPlayer } from "./AudioPlayerContext"
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Repeat, X, Music } from "lucide-react"
import { cn } from "@/lib/utils"

function formatTime(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
}

export function AudioPlayerBar() {
    const audioContext = useAudioPlayer()

    if (!audioContext || !audioContext.activeTrack) {
        return null
    }

    return <AudioPlayerBarContent audioContext={audioContext} />
}

function AudioPlayerBarContent({ audioContext }: { audioContext: NonNullable<ReturnType<typeof useAudioPlayer>> }) {
    const [isHoveringVolume, setIsHoveringVolume] = useState(false)
    const [isDraggingSeek, setIsDraggingSeek] = useState(false)
    const [seekPreviewTime, setSeekPreviewTime] = useState<number | null>(null)
    const progressBarRef = useRef<HTMLDivElement>(null)

    const {
        activeTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isLoop,
        playbackRate,
        playlist,
        accentColor = '#FF0054',
        togglePlayPause,
        seek,
        setVolume,
        toggleMute,
        toggleLoop,
        setPlaybackRate,
        nextTrack,
        prevTrack,
        closePlayer
    } = audioContext

    const displayTime = seekPreviewTime !== null ? seekPreviewTime : currentTime
    const progressPercent = duration > 0 ? Math.min(100, (displayTime / duration) * 100) : 0

    // Handle scrubber click / drag
    const handleSeekChange = (clientX: number) => {
        if (!progressBarRef.current || duration <= 0) return
        const rect = progressBarRef.current.getBoundingClientRect()
        const clickX = clientX - rect.left
        const ratio = Math.max(0, Math.min(1, clickX / rect.width))
        const newTime = ratio * duration
        setSeekPreviewTime(newTime)
        return newTime
    }

    const handleMouseDownSeek = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDraggingSeek(true)
        const newTime = handleSeekChange(e.clientX)
        if (newTime !== undefined) {
            seek(newTime)
        }
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingSeek) {
                const newTime = handleSeekChange(e.clientX)
                if (newTime !== undefined) {
                    seek(newTime)
                }
            }
        }

        const handleMouseUp = () => {
            if (isDraggingSeek) {
                setIsDraggingSeek(false)
                setSeekPreviewTime(null)
            }
        }

        if (isDraggingSeek) {
            window.addEventListener("mousemove", handleMouseMove)
            window.addEventListener("mouseup", handleMouseUp)
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [isDraggingSeek, duration, seek])

    // Cycle playback rate: 1x -> 1.25x -> 1.5x -> 2x -> 1x
    const handleCycleSpeed = () => {
        const speeds = [1, 1.25, 1.5, 2]
        const currentIndex = speeds.indexOf(playbackRate)
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length]
        setPlaybackRate(nextSpeed)
    }

    const trackTitle = activeTrack.caption || activeTrack.title || "Áudio"
    const trackSubtitle = activeTrack.blockTitle || "Identidade Sonora"
    const itemBg = activeTrack.style?.backgroundColor || accentColor || "#FF0054"
    const itemImage = activeTrack.style?.backgroundImage

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[95%] sm:w-[90%] max-w-[840px] pointer-events-auto">
            {/* Custom keyframes for waveform equalizer */}
            <style>{`
                @keyframes eq1 {
                    0%, 100% { height: 4px; }
                    50% { height: 16px; }
                }
                @keyframes eq2 {
                    0%, 100% { height: 16px; }
                    50% { height: 6px; }
                }
                @keyframes eq3 {
                    0%, 100% { height: 8px; }
                    50% { height: 18px; }
                }
                @keyframes eq4 {
                    0%, 100% { height: 14px; }
                    50% { height: 4px; }
                }
                .animate-eq-1 { animation: eq1 0.8s ease-in-out infinite; }
                .animate-eq-2 { animation: eq2 1.1s ease-in-out infinite 0.15s; }
                .animate-eq-3 { animation: eq3 0.9s ease-in-out infinite 0.3s; }
                .animate-eq-4 { animation: eq4 1.2s ease-in-out infinite 0.1s; }
            `}</style>

            <div className="bg-[#15161B]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.65)] rounded-2xl p-3 px-4 sm:px-5 flex items-center justify-between gap-3 sm:gap-5 text-white animate-in slide-in-from-bottom-5 duration-300">
                {/* Left: Artwork + Track Info */}
                <div className="flex items-center gap-3 min-w-0 max-w-[200px] sm:max-w-[240px] shrink-0">
                    <div
                        className="w-11 h-11 rounded-xl overflow-hidden relative flex items-center justify-center shrink-0 border border-white/10 shadow-inner"
                        style={{
                            background: itemImage ? `url(${itemImage}) center/cover no-repeat` : itemBg
                        }}
                    >
                        {isPlaying ? (
                            <div className="flex items-end justify-center gap-[2.5px] h-5 w-5 z-10 drop-shadow">
                                <span className="w-[3px] bg-white rounded-full animate-eq-1" />
                                <span className="w-[3px] bg-white rounded-full animate-eq-2" />
                                <span className="w-[3px] bg-white rounded-full animate-eq-3" />
                                <span className="w-[3px] bg-white rounded-full animate-eq-4" />
                            </div>
                        ) : (
                            <Music className="w-5 h-5 text-white/90 drop-shadow" />
                        )}
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-white truncate leading-tight" title={trackTitle}>
                            {trackTitle}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate leading-tight mt-0.5" title={trackSubtitle}>
                            {trackSubtitle}
                        </span>
                    </div>
                </div>

                {/* Center: Controls + Scrubber */}
                <div className="flex-1 flex flex-col items-center gap-1.5 max-w-[440px]">
                    {/* Controls Row */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={prevTrack}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                            title={playlist.length > 1 ? "Faixa anterior" : "Recuar 10s"}
                        >
                            <SkipBack className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => togglePlayPause()}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 shadow-md shrink-0"
                            style={{ backgroundColor: accentColor || '#FF0054' }}
                            title={isPlaying ? "Pausar" : "Reproduzir"}
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                            ) : (
                                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />
                            )}
                        </button>

                        <button
                            onClick={nextTrack}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                            title={playlist.length > 1 ? "Próxima faixa" : "Avançar 10s"}
                        >
                            <SkipForward className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Scrubber / Progress Bar Row */}
                    <div className="w-full flex items-center gap-2">
                        <span className="text-[11px] font-mono text-gray-400 w-8 text-right shrink-0 select-none">
                            {formatTime(displayTime)}
                        </span>

                        <div
                            ref={progressBarRef}
                            onMouseDown={handleMouseDownSeek}
                            className="flex-1 h-3 flex items-center cursor-pointer group/seek relative py-1"
                            title="Navegar no áudio"
                        >
                            {/* Track background */}
                            <div className="w-full h-1 sm:h-1.5 bg-white/15 group-hover/seek:bg-white/25 rounded-full overflow-hidden relative transition-colors">
                                {/* Fill */}
                                <div
                                    className="h-full rounded-full transition-all duration-75"
                                    style={{
                                        width: `${progressPercent}%`,
                                        backgroundColor: accentColor || '#FF0054'
                                    }}
                                />
                            </div>

                            {/* Scrubber thumb */}
                            <div
                                className={cn(
                                    "absolute w-3.5 h-3.5 bg-white rounded-full shadow-md -translate-x-1/2 transition-opacity pointer-events-none",
                                    isDraggingSeek ? "opacity-100 scale-110" : "opacity-0 group-hover/seek:opacity-100"
                                )}
                                style={{ left: `${progressPercent}%` }}
                            />
                        </div>

                        <span className="text-[11px] font-mono text-gray-400 w-8 text-left shrink-0 select-none">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Right: Loop + Speed + Volume + Close */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {/* Loop Toggle */}
                    <button
                        onClick={toggleLoop}
                        className={cn(
                            "p-1.5 rounded-full transition-colors relative hidden xs:flex items-center justify-center",
                            isLoop
                                ? "text-white bg-white/15"
                                : "text-gray-400 hover:text-white hover:bg-white/10"
                        )}
                        title={isLoop ? "Repetição ativada" : "Repetição desativada"}
                    >
                        <Repeat className="w-4 h-4" />
                        {isLoop && (
                            <span
                                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: accentColor || '#FF0054' }}
                            />
                        )}
                    </button>

                    {/* Speed Selector */}
                    <button
                        onClick={handleCycleSpeed}
                        className="px-1.5 py-1 text-[11px] font-mono text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors hidden sm:block"
                        title="Velocidade de reprodução"
                    >
                        {playbackRate}x
                    </button>

                    {/* Volume Control */}
                    <div
                        className="relative flex items-center"
                        onMouseEnter={() => setIsHoveringVolume(true)}
                        onMouseLeave={() => setIsHoveringVolume(false)}
                    >
                        <button
                            onClick={toggleMute}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            title={isMuted ? "Desativar mudo" : "Silenciar"}
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="w-4 h-4 text-red-400" />
                            ) : volume < 0.5 ? (
                                <Volume1 className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </button>

                        {/* Volume slider */}
                        <div className={cn(
                            "overflow-hidden transition-all duration-200 flex items-center",
                            isHoveringVolume ? "w-16 sm:w-20 opacity-100 ml-1" : "w-0 opacity-0"
                        )}>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={isMuted ? 0 : volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#FF0054]"
                                style={{ accentColor: accentColor || '#FF0054' }}
                                title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                            />
                        </div>
                    </div>

                    <div className="w-[1px] h-5 bg-white/15 mx-1 hidden sm:block" />

                    {/* Close Button */}
                    <button
                        onClick={closePlayer}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Fechar reprodutor"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
