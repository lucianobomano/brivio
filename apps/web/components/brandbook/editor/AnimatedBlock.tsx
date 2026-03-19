"use client"

import React from "react"
import { motion } from "framer-motion"

interface AnimatedBlockProps {
    animation?: string | null
    children: React.ReactNode
    isEnabled?: boolean
}

export const AnimatedBlock = ({ animation, children, isEnabled = true }: AnimatedBlockProps) => {
    if (!animation || animation === 'none' || !isEnabled) return <>{children}</>

    const getAnimationProps = () => {
        switch (animation) {
            case 'ascender':
                return {
                    initial: { opacity: 0, y: 40 },
                    whileInView: { opacity: 1, y: 0 },
                    transition: { duration: 0.8, ease: "easeOut" as any }
                }
            case 'panorama':
                return {
                    initial: { opacity: 0, x: -100 },
                    whileInView: { opacity: 1, x: 0 },
                    transition: { duration: 1, ease: "easeOut" as any }
                }
            case 'surgir':
                return {
                    initial: { opacity: 0, scale: 0.8 },
                    whileInView: { opacity: 1, scale: 1 },
                    transition: { duration: 0.6, ease: "easeOut" as any }
                }
            case 'ressalto':
                return {
                    initial: { opacity: 0, y: 100 },
                    whileInView: { opacity: 1, y: 0 },
                    transition: { type: "spring", stiffness: 100, damping: 10 }
                }
            case 'limpar':
                return {
                    initial: { clipPath: "inset(0 100% 0 0)" },
                    whileInView: { clipPath: "inset(0 0% 0 0)" },
                    transition: { duration: 1, ease: "easeInOut" as any }
                }
            case 'desfocagem':
                return {
                    initial: { opacity: 0, filter: "blur(10px)" },
                    whileInView: { opacity: 1, filter: "blur(0px)" },
                    transition: { duration: 0.8 }
                }
            case 'de_baixo':
                return {
                    initial: { opacity: 0, y: 20 },
                    whileInView: { opacity: 1, y: 0 },
                    transition: { duration: 0.5 }
                }
            case 'deriva':
                return {
                    initial: { opacity: 0, x: 20, y: 10 },
                    whileInView: { opacity: 1, x: 0, y: 0 },
                    transition: { duration: 1.2, ease: "linear" as any }
                }
            case 'rodar':
                return {
                    initial: { opacity: 0, rotate: -15, scale: 0.9 },
                    whileInView: { opacity: 1, rotate: 0, scale: 1 },
                    transition: { duration: 0.8 }
                }
            case 'pulsar':
                return {
                    initial: { scale: 1 },
                    animate: { scale: [1, 1.05, 1] },
                    transition: { duration: 2, repeat: Infinity }
                }
            case 'sequencia':
                return {
                    variants: {
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    },
                    initial: "hidden",
                    whileInView: "visible",
                    transition: { duration: 0.5, staggerChildren: 0.2 }
                }
            default:
                return {}
        }
    }

    const animProps = getAnimationProps()

    return (
        <motion.div
            {...animProps}
            viewport={{ once: true, amount: 0.2 }}
            className="w-full"
        >
            {children}
        </motion.div>
    )
}
