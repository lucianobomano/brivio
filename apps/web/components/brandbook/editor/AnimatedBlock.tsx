"use client"

import React from "react"
import { motion, type TargetAndTransition, type Transition } from "framer-motion"

export interface AnimationProps {
    initial?: TargetAndTransition
    /** Plays once when scrolled into view */
    whileInView?: TargetAndTransition
    /** Plays on mount and keeps running (loops) */
    animate?: TargetAndTransition
    transition?: Transition
}

/** Motion props for an animation id (shared by blocks, sections and columns); null for none/unknown */
export const getAnimationProps = (animation?: string | null): AnimationProps | null => {
    switch (animation) {
        case 'ascender':
            return {
                initial: { opacity: 0, y: 40 },
                whileInView: { opacity: 1, y: 0 },
                transition: { duration: 0.8, ease: "easeOut" }
            }
        case 'panorama':
            return {
                initial: { opacity: 0, x: -100 },
                whileInView: { opacity: 1, x: 0 },
                transition: { duration: 1, ease: "easeOut" }
            }
        case 'da_direita':
            return {
                initial: { opacity: 0, x: 100 },
                whileInView: { opacity: 1, x: 0 },
                transition: { duration: 1, ease: "easeOut" }
            }
        case 'de_cima':
            return {
                initial: { opacity: 0, y: -40 },
                whileInView: { opacity: 1, y: 0 },
                transition: { duration: 0.8, ease: "easeOut" }
            }
        case 'surgir':
            return {
                initial: { opacity: 0, scale: 0.8 },
                whileInView: { opacity: 1, scale: 1 },
                transition: { duration: 0.6, ease: "easeOut" }
            }
        case 'aproximar':
            return {
                initial: { opacity: 0, scale: 1.15 },
                whileInView: { opacity: 1, scale: 1 },
                transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] }
            }
        case 'ressalto':
            return {
                initial: { opacity: 0, y: 100 },
                whileInView: { opacity: 1, y: 0 },
                transition: { type: "spring", stiffness: 100, damping: 10 }
            }
        case 'elastico':
            return {
                initial: { opacity: 0, scale: 0.3 },
                whileInView: { opacity: 1, scale: 1 },
                transition: { type: "spring", stiffness: 260, damping: 12 }
            }
        case 'limpar':
            return {
                initial: { clipPath: "inset(0 100% 0 0)" },
                whileInView: { clipPath: "inset(0 0% 0 0)" },
                transition: { duration: 1, ease: "easeInOut" }
            }
        case 'revelar':
            return {
                initial: { clipPath: "inset(100% 0 0 0)" },
                whileInView: { clipPath: "inset(0% 0 0 0)" },
                transition: { duration: 1, ease: [0.65, 0, 0.35, 1] }
            }
        case 'iris':
            return {
                initial: { clipPath: "circle(0% at 50% 50%)" },
                whileInView: { clipPath: "circle(75% at 50% 50%)" },
                transition: { duration: 1.1, ease: "easeInOut" }
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
                transition: { duration: 1.2, ease: "linear" }
            }
        case 'rodar':
            return {
                initial: { opacity: 0, rotate: -15, scale: 0.9 },
                whileInView: { opacity: 1, rotate: 0, scale: 1 },
                transition: { duration: 0.8 }
            }
        case 'virar':
            return {
                initial: { opacity: 0, rotateX: 80, transformPerspective: 900 },
                whileInView: { opacity: 1, rotateX: 0, transformPerspective: 900 },
                transition: { duration: 0.9, ease: "easeOut" }
            }
        case 'inclinar':
            return {
                initial: { opacity: 0, y: 30, skewY: 6 },
                whileInView: { opacity: 1, y: 0, skewY: 0 },
                transition: { duration: 0.8, ease: "easeOut" }
            }
        case 'sequencia':
            return {
                initial: { opacity: 0, y: 20 },
                whileInView: { opacity: 1, y: 0 },
                transition: { duration: 0.5 }
            }
        case 'pulsar':
            return {
                initial: { scale: 1 },
                animate: { scale: [1, 1.05, 1] },
                transition: { duration: 2, repeat: Infinity }
            }
        case 'flutuar':
            return {
                initial: { y: 0 },
                animate: { y: [0, -10, 0] },
                transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }
        default:
            return null
    }
}

export type AnimationEasing = 'smooth' | 'in-out' | 'linear' | 'spring'

/** Per-element tweaks on top of a preset; every field is optional and falls back to the preset */
export interface AnimationSettings {
    /** Seconds */
    duration?: number
    /** Seconds */
    delay?: number
    easing?: AnimationEasing
    /** Distance / rotation / zoom / blur strength in % of the preset (100 = as designed) */
    intensity?: number
    /** 'scroll' plays when the element enters the screen, 'load' as soon as the page opens */
    trigger?: 'scroll' | 'load'
    /** Play again every time the element re-enters the screen */
    replay?: boolean
}

const EASINGS: Record<Exclude<AnimationEasing, 'spring'>, Transition['ease']> = {
    smooth: [0.16, 1, 0.3, 1],
    'in-out': "easeInOut",
    linear: "linear",
}

/** Preset duration (s), shown as the default in the settings */
export const getPresetDuration = (animation?: string | null) => {
    const transition = getAnimationProps(animation)?.transition as { duration?: number } | undefined
    return transition?.duration ?? 0.8
}

const scaleTarget = (target: TargetAndTransition | undefined, k: number): TargetAndTransition | undefined => {
    if (!target || k === 1) return target
    const out: Record<string, unknown> = { ...target }
    const mul = (v: unknown, f: (n: number) => number) =>
        Array.isArray(v) ? v.map(n => (typeof n === 'number' ? f(n) : n)) : (typeof v === 'number' ? f(v) : v)
    for (const key of ['x', 'y', 'rotate', 'rotateX', 'skewY']) {
        if (key in out) out[key] = mul(out[key], n => n * k)
    }
    if ('scale' in out) out.scale = mul(out.scale, n => 1 + (n - 1) * k)
    if (typeof out.filter === 'string') {
        out.filter = (out.filter as string).replace(/blur\(([\d.]+)px\)/, (_, px) => `blur(${Number(px) * k}px)`)
    }
    return out as TargetAndTransition
}

/** Preset props with the element's own settings applied */
export const getConfiguredAnimationProps = (animation?: string | null, settings?: AnimationSettings | null): AnimationProps | null => {
    const preset = getAnimationProps(animation)
    if (!preset || !settings) return preset

    const k = Math.max(0, (settings.intensity ?? 100) / 100)
    let transition: Transition = { ...(preset.transition || {}) }
    if (settings.easing === 'spring') {
        transition = { ...transition, type: "spring", bounce: 0.35, ease: undefined }
    } else if (settings.easing) {
        // Spring presets carry no duration; use the one the settings show as default
        transition = { ...transition, type: "tween", ease: EASINGS[settings.easing], duration: (transition as { duration?: number }).duration ?? 0.8 }
    }
    if (settings.duration !== undefined) {
        // Springs defined by stiffness/damping ignore duration, so switch them to a duration-based spring
        transition = transition.type === "spring"
            ? { ...transition, stiffness: undefined, damping: undefined, duration: settings.duration, bounce: (transition as { bounce?: number }).bounce ?? 0.35 }
            : { ...transition, duration: settings.duration }
    }
    if (settings.delay) transition = { ...transition, delay: settings.delay }

    const props: AnimationProps = {
        initial: scaleTarget(preset.initial, k),
        whileInView: preset.whileInView,
        animate: scaleTarget(preset.animate, k),
        transition,
    }
    // Play on load: the entrance runs on mount instead of when scrolled into view
    if (settings.trigger === 'load' && props.whileInView) {
        props.animate = props.whileInView
        props.whileInView = undefined
    }
    return props
}

export const getAnimationViewport = (settings?: AnimationSettings | null) =>
    ({ once: !settings?.replay, amount: 0.2 }) as const

const shift = (target: TargetAndTransition | undefined, x: number, y: number): TargetAndTransition | undefined => {
    if (!target) return target
    const value = (v: unknown, base: number) =>
        Array.isArray(v) ? v.map(n => (typeof n === 'number' ? n + base : n)) : (typeof v === 'number' ? v + base : base)
    return { ...target, x: value(target.x, x), y: value(target.y, y) } as TargetAndTransition
}

/** Same animation, played around an element that already sits at an x/y offset (free-flow columns) */
export const offsetAnimationProps = (props: AnimationProps, x: number, y: number): AnimationProps => ({
    ...props,
    initial: shift(props.initial, x, y),
    whileInView: shift(props.whileInView, x, y),
    animate: shift(props.animate, x, y),
})

interface AnimatedBlockProps {
    animation?: string | null
    settings?: AnimationSettings | null
    children: React.ReactNode
    isEnabled?: boolean
}

export const AnimatedBlock = ({ animation, settings, children, isEnabled = true, className }: AnimatedBlockProps & { className?: string }) => {
    const animProps = isEnabled ? getConfiguredAnimationProps(animation, settings) : null
    if (!animProps) return <>{children}</>

    return (
        <motion.div
            {...animProps}
            viewport={getAnimationViewport(settings)}
            className={className ? `w-full ${className}` : "w-full"}
        >
            {children}
        </motion.div>
    )
}
