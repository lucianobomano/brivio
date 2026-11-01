"use client"

import React, { useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { TOP_BAR_CLEARANCE } from "./editorLayout"

export type FloatingPlacement = 'right-start' | 'right-center' | 'left-start' | 'bottom-center' | 'bottom-start' | 'top-center'
    /** Over the anchor, at the top of its inside (tools of an item that must not cover the bar above its block) */
    | 'inside-top'

/**
 * Renders a settings panel on its own top layer (a portal on <body>), placed next to the element it
 * belongs to. Panels drawn inside a block end up under the blocks, columns and sections that come after
 * it on the page (each one makes its own stacking layer); on the top layer they are always above content.
 *
 * Drop it where the panel used to be: the anchor is that spot's parent element. The panel follows it on
 * scroll / resize and stays inside the viewport.
 */
export function FloatingPanel({ placement = 'right-start', offset = 12, zIndex = 9500, clearance = TOP_BAR_CLEARANCE, panelProps, children }: {
    placement?: FloatingPlacement
    offset?: number
    zIndex?: number
    /** Space kept free at the top of the screen (the editor top bar); the shared link has none */
    clearance?: number
    /** Extra props for the floating element (e.g. hover handlers that keep a hover popover open) */
    panelProps?: React.HTMLAttributes<HTMLDivElement>
    children: React.ReactNode
}) {
    const markerRef = useRef<HTMLSpanElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)
    const [pos, setPos] = useState<{ top: number, left: number, side: 'top' | 'bottom' } | null>(null)

    useLayoutEffect(() => {
        const anchor = markerRef.current?.parentElement
        if (!anchor) return
        let frame = 0

        const update = () => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
                const a = anchor.getBoundingClientRect()
                const w = panelRef.current?.offsetWidth || 0
                const h = panelRef.current?.offsetHeight || 0
                let top = a.top
                let left = a.right + offset
                switch (placement) {
                    case 'right-center': top = a.top + a.height / 2 - h / 2; break
                    case 'left-start': left = a.left - w - offset; break
                    case 'bottom-center': top = a.bottom + offset; left = a.left + a.width / 2 - w / 2; break
                    case 'bottom-start': top = a.bottom + offset; left = a.left; break
                    case 'top-center': top = a.top - h - offset; left = a.left + a.width / 2 - w / 2; break
                    // Inside the anchor: when its top is scrolled away, it stays at the top of the visible part
                    case 'inside-top': top = Math.min(Math.max(a.top, clearance) + offset, a.bottom - h - offset); left = a.left + a.width / 2 - w / 2; break
                }
                // Above the anchor without room: show it under the anchor instead
                let side: 'top' | 'bottom' = placement === 'top-center' ? 'top' : 'bottom'
                if (placement === 'top-center' && top < clearance) { top = a.bottom + offset; side = 'bottom' }
                // Flip to the other side when there is no room, then keep it on screen
                if ((placement === 'right-start' || placement === 'right-center') && left + w > window.innerWidth - 8) left = a.left - w - offset
                const margin = 8
                left = Math.max(margin, Math.min(left, window.innerWidth - w - margin))
                // Never above the editor's top bar
                top = Math.max(clearance, Math.min(top, window.innerHeight - h - margin))
                setPos(prev => (prev && prev.side === side && Math.abs(prev.top - top) < 0.5 && Math.abs(prev.left - left) < 0.5) ? prev : { top, left, side })
            })
        }

        update()
        const ro = new ResizeObserver(update)
        ro.observe(anchor)
        if (panelRef.current) ro.observe(panelRef.current)
        window.addEventListener('scroll', update, true)
        window.addEventListener('resize', update)
        return () => {
            cancelAnimationFrame(frame)
            ro.disconnect()
            window.removeEventListener('scroll', update, true)
            window.removeEventListener('resize', update)
        }
    }, [placement, offset, clearance])

    return (
        <>
            <span ref={markerRef} aria-hidden style={{ display: 'none' }} />
            {typeof document !== 'undefined' && createPortal(
                <div
                    {...panelProps}
                    ref={panelRef}
                    // Which side of the anchor it ended up on (arrows can follow it)
                    data-side={pos?.side}
                    // Lets blocks tell their own floating panels apart from "clicking outside"
                    data-floating-panel=""
                    style={{
                        position: 'fixed',
                        top: pos?.top ?? 0,
                        left: pos?.left ?? 0,
                        zIndex,
                        // Hidden for the first frame, until it is measured and placed
                        visibility: pos ? 'visible' : 'hidden',
                    }}
                >
                    {children}
                </div>,
                document.body
            )}
        </>
    )
}

/** For panels that position themselves (position: fixed): only lifts them to the top layer */
export function TopLayer({ children }: { children: React.ReactNode }) {
    if (typeof document === 'undefined') return null
    return createPortal(children, document.body)
}
