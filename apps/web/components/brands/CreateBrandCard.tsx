
"use client"

import { Plus } from "lucide-react"
import { useState, useRef } from "react"
import { CreateBrandModal } from "./CreateBrandModal"
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion"

export interface CreateBrandCardProps {
    userName?: string
    brandsCount?: number
}

export function CreateBrandCard({ userName, brandsCount = 0 }: CreateBrandCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Mouse position state
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Smooth spring animation for mouse movement
    const springConfig = { damping: 20, stiffness: 200 }
    const moveX = useSpring(mouseX, springConfig)
    const moveY = useSpring(mouseY, springConfig)

    function handleMouseMove({ clientX, clientY }: React.MouseEvent) {
        if (!ref.current) return
        const { left, top, width, height } = ref.current.getBoundingClientRect()
        // Calculate centered relative position (-1 to 1)
        const x = (clientX - left) / width - 0.5
        const y = (clientY - top) / height - 0.5

        mouseX.set(x * 20) // Movement range in pixels
        mouseY.set(y * 20)
    }

    function handleMouseLeave() {
        mouseX.set(0)
        mouseY.set(0)
    }

    return (
        <>
            <div
                ref={ref}
                onClick={() => setIsOpen(true)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="relative w-[265px] h-[360px] rounded-2xl overflow-hidden cursor-pointer group bg-[#311C99]"
            >
                {/* Fluid Gradient Background Container */}
                <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-700 ease-out">

                    {/* Top Right - Red/Pink (#FF0054) - Moves opposite to mouse */}
                    <motion.div
                        className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] rounded-full blur-[80px] opacity-90"
                        style={{ background: '#FF0054', x: useMotionTemplate`calc(${moveX}px * -2)`, y: useMotionTemplate`calc(${moveY}px * -2)` }}
                        animate={{
                            scale: [1, 1.1, 0.9, 1],
                            x: [0, 20, -10, 0],
                            y: [0, -15, 10, 0],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Top Left - Purple (#88007F) - Moves with mouse */}
                    <motion.div
                        className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] rounded-full blur-[60px] opacity-80"
                        style={{ background: '#88007F', x: useMotionTemplate`calc(${moveX}px * 1.5)`, y: useMotionTemplate`calc(${moveY}px * 1.5)` }}
                        animate={{
                            scale: [1, 1.2, 0.95, 1],
                            x: [0, -20, 15, 0],
                            y: [0, 10, -20, 0],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 1
                        }}
                    />

                    {/* Bottom Right - Dark Blue (#311C99) - Moves fast opposite */}
                    <motion.div
                        className="absolute bottom-0 right-0 w-[60%] h-[60%] rounded-full blur-[60px] opacity-90"
                        style={{ background: '#311C99', x: useMotionTemplate`calc(${moveX}px * -1)`, y: useMotionTemplate`calc(${moveY}px * -1)` }}
                        animate={{
                            scale: [0.9, 1.1, 0.9, 0.9],
                            x: [0, -15, 10, 0],
                            y: [0, 20, -15, 0],
                        }}
                        transition={{
                            duration: 9,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 2
                        }}
                    />

                    {/* Bottom Left - Teal/Green (#06D6A0) - Moves fast with mouse */}
                    <motion.div
                        className="absolute -bottom-[20%] -left-[20%] w-[80%] h-[80%] rounded-full blur-[70px] opacity-90"
                        style={{ background: '#06D6A0', x: useMotionTemplate`calc(${moveX}px * 1.8)`, y: useMotionTemplate`calc(${moveY}px * 1.8)` }}
                        animate={{
                            scale: [1.1, 0.9, 1.15, 1.1],
                            x: [0, 25, -20, 0],
                            y: [0, -10, 15, 0],
                        }}
                        transition={{
                            duration: 11,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.5
                        }}
                    />

                    {/* Overlay to smooth blending */}
                    <div className="absolute inset-0 bg-white/5 mix-blend-overlay" />
                </div>

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center text-white z-10 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                        <Plus className="w-8 h-8" strokeWidth={2.5} />
                    </div>
                    <span className="text-lg font-medium">Novo projecto</span>
                </div>
            </div>

            <CreateBrandModal open={isOpen} onOpenChange={setIsOpen} userName={userName} brandsCount={brandsCount} />
        </>
    )
}
