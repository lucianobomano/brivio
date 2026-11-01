'use client'

/**
 * Light / dark theme of the public pages (landing, sign in, sign up): light by default, the visitor's choice
 * remembered in this browser. Pages put the `lp` class on their root with `data-theme`, and render
 * THEME_SCRIPT first inside it so a dark choice applies before the first paint.
 */

import React, { useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Theme = 'light' | 'dark'
const THEME_KEY = 'brivio.landingTheme'
const THEME_EVENT = 'brivio-landing-theme'

/** Applies the remembered theme before the first paint (no flash of the light page for dark visitors) */
export const THEME_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='dark')document.currentScript.parentElement.setAttribute('data-theme','dark')}catch(e){}`

const readTheme = (): Theme => { try { return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light' } catch { return 'light' } }
const subscribeTheme = (onChange: () => void) => {
    window.addEventListener(THEME_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => { window.removeEventListener(THEME_EVENT, onChange); window.removeEventListener('storage', onChange) }
}

/** The visitor's theme, remembered in this browser (light when nothing is stored, and on the server) */
export function useLandingTheme() {
    const theme = useSyncExternalStore(subscribeTheme, readTheme, () => 'light' as Theme)
    const toggle = () => {
        try { localStorage.setItem(THEME_KEY, theme === 'light' ? 'dark' : 'light') } catch { }
        window.dispatchEvent(new Event(THEME_EVENT))
    }
    return { theme, toggle }
}

export const ThemeToggle = ({ theme, onToggle }: { theme: Theme, onToggle: () => void }) => (
    <button
        type="button"
        onClick={onToggle}
        aria-label={theme === 'light' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'}
        title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
        className="relative w-[60px] h-8 rounded-full border border-[color:var(--lp-line-strong)] bg-[color:var(--lp-surface)] shrink-0"
    >
        <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className={cn(
                'absolute top-[3px] w-6 h-6 rounded-full bg-[color:var(--lp-bg-2)] shadow-sm flex items-center justify-center',
                theme === 'light' ? 'left-[3px]' : 'left-[31px]'
            )}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={theme}
                    initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.2 }}
                >
                    {theme === 'light' ? <Sun className="w-3.5 h-3.5 text-[#F59E0B]" /> : <Moon className="w-3.5 h-3.5 text-[#A5B4FC]" />}
                </motion.span>
            </AnimatePresence>
        </motion.span>
    </button>
)
