"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <div className="w-10 h-10" />
    }

    const isDark = theme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="group relative flex h-10 w-16 items-center rounded-full bg-bg-3 p-1 transition-colors hover:bg-bg-3/80 focus:outline-none"
            aria-label="Toggle theme"
        >
            <motion.div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-0 shadow-lg"
                animate={{
                    x: isDark ? 24 : 0,
                }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                }}
            >
                <AnimatePresence mode="wait">
                    {isDark ? (
                        <motion.div
                            key="moon"
                            initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Moon className="h-4 w-4 text-accent-indigo" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="sun"
                            initial={{ scale: 0.5, opacity: 0, rotate: 90 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0, rotate: -90 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Sun className="h-4 w-4 text-[#FFB800]" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <div className="absolute right-2 flex items-center">
                {!isDark && <Moon className="h-3 w-3 text-text-tertiary transition-colors group-hover:text-text-secondary" />}
            </div>
            <div className="absolute left-2 flex items-center">
                {isDark && <Sun className="h-3 w-3 text-text-tertiary transition-colors group-hover:text-text-secondary" />}
            </div>
        </button>
    )
}
