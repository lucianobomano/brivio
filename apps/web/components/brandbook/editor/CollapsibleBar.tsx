"use client"

import React, { useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Context bars start folded into a small «+» circle (less clutter while editing); a click opens the bar,
 * and the «–» at its end folds it again. Used by every block bar of the brandbook and proposal editors.
 * The bar grows out of the circle to both sides (and shrinks back into it). Clicks never take the focus
 * away from the text being edited.
 */
type Phase = "closed" | "opening" | "open" | "closing"

// Fully open / folded to a sliver in the middle (the circle's place)
const OPEN_CLIP = "inset(0% 0% 0% 0% round 8px)"
const FOLDED_CLIP = "inset(0% 50% 0% 50% round 999px)"

export function CollapsibleBar({ children, className, label = "ferramentas" }: { children: React.ReactNode, className?: string, label?: string }) {
    const [phase, setPhase] = useState<Phase>("closed")
    const reduce = useReducedMotion()
    const keepFocus = (e: React.MouseEvent | React.PointerEvent) => { e.preventDefault(); e.stopPropagation() }

    if (phase === "closed") {
        return (
            <motion.button
                type="button"
                title={`Mostrar ${label}`}
                aria-label={`Mostrar ${label}`}
                data-collapsed-bar=""
                initial={reduce ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onMouseDown={keepFocus}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setPhase(reduce ? "open" : "opening") }}
                className={cn("w-8 h-8 rounded-full bg-[#15161B] border border-[#333] shadow-lg flex items-center justify-center text-white hover:bg-[#FF0054] hover:border-[#FF0054] transition-colors shrink-0", className)}
            >
                <Plus className="w-4 h-4" />
            </motion.button>
        )
    }

    const animating = phase === "opening" || phase === "closing"
    return (
        <motion.div
            className={cn("relative inline-flex items-center gap-1.5 w-max", className)}
            initial={reduce ? false : { clipPath: FOLDED_CLIP, opacity: 0.4 }}
            animate={
                phase === "closing" ? { clipPath: [OPEN_CLIP, FOLDED_CLIP], opacity: [1, 0.4] }
                    : phase === "opening" ? { clipPath: OPEN_CLIP, opacity: 1 }
                        // Once open, nothing is clipped: menus that drop out of the bar (font size, colours…) stay visible
                        : { clipPath: "none", opacity: 1 }
            }
            transition={animating ? { duration: phase === "closing" ? 0.2 : 0.32, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
            onAnimationComplete={() => setPhase(p => p === "closing" ? "closed" : p === "opening" ? "open" : p)}
        >
            {children}
            <button
                type="button"
                title={`Recolher ${label}`}
                aria-label={`Recolher ${label}`}
                onMouseDown={keepFocus}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setPhase(reduce ? "closed" : "closing") }}
                className="w-6 h-6 rounded-full bg-[#15161B] border border-[#333] shadow-lg flex items-center justify-center text-[#97A1B3] hover:text-white hover:bg-[#FF0054] hover:border-[#FF0054] transition-colors shrink-0"
            >
                <Minus className="w-3 h-3" />
            </button>
        </motion.div>
    )
}
