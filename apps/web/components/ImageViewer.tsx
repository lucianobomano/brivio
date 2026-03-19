import React from 'react'
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'

interface ImageViewerProps {
    isOpen: boolean
    onClose: () => void
    images: string[]
    currentIndex: number
    onNavigate: (index: number) => void
}

export function ImageViewer({ isOpen, onClose, images, currentIndex, onNavigate }: ImageViewerProps) {
    if (!isOpen || !images.length) return null

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation()
        onNavigate((currentIndex - 1 + images.length) % images.length)
    }

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation()
        onNavigate((currentIndex + 1) % images.length)
    }

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl transition-all duration-300 animate-in fade-in"
            onClick={onClose}
        >
            {/* Background Aura Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-indigo/20 rounded-full blur-[120px] animate-pulse"
                    style={{ transition: 'all 0.8s ease' }}
                />
                <div
                    className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] animate-bounce"
                    style={{ animationDuration: '8s' }}
                />
            </div>

            {/* Header Controls */}
            <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10 pointer-events-none">
                <div className="text-white/50 text-[12px] font-bold tracking-[0.2em] uppercase pointer-events-auto">
                    {currentIndex + 1} <span className="mx-1">/</span> {images.length}
                </div>
                <button
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all hover:scale-110 pointer-events-auto"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Main Image Container */}
            <div
                className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center group"
                onClick={(e) => e.stopPropagation()}
            >
                <img
                    src={images[currentIndex]}
                    alt={`Image ${currentIndex + 1}`}
                    className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 animate-in zoom-in-95 duration-300"
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-[-80px] p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110 opacity-0 group-hover:opacity-100 hidden md:flex"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-[-80px] p-4 bg-white/5 hover:bg-white/10 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110 opacity-0 group-hover:opacity-100 hidden md:flex"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    </>
                )}
            </div>

            {/* Mobile Navigation Dots */}
            {images.length > 1 && (
                <div className="absolute bottom-10 flex gap-2">
                    {images.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation()
                                onNavigate(idx)
                            }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/20 hover:bg-white/40'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
