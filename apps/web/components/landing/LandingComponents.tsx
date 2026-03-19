'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'

export const MagneticButton = ({ children, className, ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) => {
    const ref = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })

    const handleMouse = (e: React.MouseEvent) => {
        const { clientX, clientY } = e
        const { height, width, left, top } = ref.current!.getBoundingClientRect()
        const middleX = clientX - (left + width / 2)
        const middleY = clientY - (top + height / 2)
        setPosition({ x: middleX, y: middleY })
    }

    const reset = () => setPosition({ x: 0, y: 0 })

    const { x, y } = position

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouse}
            onMouseLeave={reset}
            animate={{ x, y }}
            transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
            className={cn('relative inline-block', className)}
            {...props}
        >
            {children}
        </motion.div>
    )
}

export const TiltCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const mouseXSpring = useSpring(x)
    const mouseYSpring = useSpring(y)

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg'])
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg'])

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const width = rect.width
        const height = rect.height
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const xPct = mouseX / width - 0.5
        const yPct = mouseY / height - 0.5
        x.set(xPct)
        y.set(yPct)
    }

    const handleMouseLeave = () => {
        x.set(0)
        y.set(0)
    }

    return (
        <motion.div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className={cn('relative transition-all duration-200', className)}
        >
            <div style={{ transform: 'translateZ(20px)' }} className="h-full w-full">
                {children}
            </div>
        </motion.div>
    )
}

export const InfiniteMarquee = ({ items, speed = 40 }: { items: string[], speed?: number }) => {
    return (
        <div className="flex overflow-hidden select-none gap-20 py-10 border-y border-white/5 bg-black/50">
            <motion.div
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: speed, ease: 'linear', repeat: Infinity }}
                className="flex flex-shrink-0 items-center justify-around min-w-full gap-20"
            >
                {items.map((item, idx) => (
                    <span key={idx} className="text-4xl md:text-6xl font-bold tracking-tighter text-white/20 hover:text-white/40 transition-colors uppercase italic cursor-default">
                        {item}
                    </span>
                ))}
                {items.map((item, idx) => (
                    <span key={idx + items.length} className="text-4xl md:text-6xl font-bold tracking-tighter text-white/20 hover:text-white/40 transition-colors uppercase italic cursor-default">
                        {item}
                    </span>
                ))}
            </motion.div>
        </div>
    )
}

export const TextReveal = ({ text }: { text: string }) => {
    return (
        <div className="overflow-hidden">
            <motion.p
                initial={{ y: '100%' }}
                whileInView={{ y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
            >
                {text}
            </motion.p>
        </div>
    )
}

export const CustomCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <motion.div
            animate={{
                x: mousePosition.x - 10,
                y: mousePosition.y - 10,
                scale: 1
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 28, mass: 0.5 }}
            className="magnetic-cursor"
        />
    )
}
