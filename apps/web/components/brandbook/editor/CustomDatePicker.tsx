"use client"

import React, { useState } from "react"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    eachDayOfInterval,
    setMonth,
    setYear,
    getYear,
    getMonth
} from "date-fns"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface CustomDatePickerProps {
    value: Date | null
    onChange: (date: Date) => void
    onClose: () => void
}

export function CustomDatePicker({ value, onChange, onClose }: CustomDatePickerProps) {
    const [viewDate, setViewDate] = useState(value || new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(value)

    // View Mode: 'calendar' | 'month' | 'year'
    const [viewMode, setViewMode] = useState<'calendar' | 'month' | 'year'>('calendar')

    const headerFormat = "MMMM"
    const yearFormat = "yyyy"

    const nextMonth = () => setViewDate(addMonths(viewDate, 1))
    const prevMonth = () => setViewDate(subMonths(viewDate, 1))

    const handleDayClick = (day: Date) => {
        setSelectedDate(day)
    }

    const handleSetDate = () => {
        if (selectedDate) {
            onChange(selectedDate)
        }
        onClose()
    }

    // Grid Generation
    const monthStart = startOfMonth(viewDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    })

    const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

    // Years for Year Picker (current - 10 to current + 10)
    const currentYear = getYear(new Date())
    const years = Array.from({ length: 20 }, (_, i) => currentYear - 5 + i)

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    return (
        <div className="w-[320px] bg-[#1E1E24] rounded-2xl shadow-2xl border border-[#333] p-4 flex gap-4 overflow-hidden">
            {/* Main Calendar Area */}
            <div className="flex-1 flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'month' ? 'calendar' : 'month')}
                            className={cn(
                                "flex items-center gap-1 text-[14px] font-medium transition-colors hover:text-white",
                                viewMode === 'month' ? "text-[#ff0054]" : "text-white"
                            )}
                        >
                            {format(viewDate, headerFormat)} <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </button>
                        <button
                            onClick={() => setViewMode(viewMode === 'year' ? 'calendar' : 'year')}
                            className={cn(
                                "flex items-center gap-1 text-[14px] font-medium transition-colors hover:text-white",
                                viewMode === 'year' ? "text-[#ff0054]" : "text-[#999]"
                            )}
                        >
                            {format(viewDate, yearFormat)} <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={prevMonth}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Body Content */}
                <div className="relative h-[240px]">
                    <AnimatePresence mode="wait">
                        {viewMode === 'calendar' && (
                            <motion.div
                                key="calendar"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0"
                            >
                                {/* Weekdays */}
                                <div className="grid grid-cols-7 mb-2">
                                    {weekDays.map(day => (
                                        <div key={day} className="text-center text-[12px] font-medium text-white/90">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-y-1">
                                    {calendarDays.map((day) => {
                                        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                                        const isCurrentMonth = isSameMonth(day, viewDate)

                                        return (
                                            <div
                                                key={day.toISOString()}
                                                className="flex justify-center items-center h-8"
                                            >
                                                <button
                                                    onClick={() => handleDayClick(day)}
                                                    className={cn(
                                                        "w-7 h-7 rounded-full flex items-center justify-center text-[13px] transition-all relative",
                                                        !isCurrentMonth && "text-[#555]",
                                                        isCurrentMonth && !isSelected && "text-[#ccc] hover:bg-white/10 hover:text-white",
                                                        isSelected && "bg-[#ff0054] text-white shadow-lg shadow-[#ff0054]/30"
                                                    )}
                                                >
                                                    {format(day, "d")}
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {viewMode === 'month' && (
                            <motion.div
                                key="months"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="absolute inset-0 overflow-y-auto scrollbar-hide"
                            >
                                <div className="grid grid-cols-1 gap-1">
                                    {months.map((m, i) => (
                                        <button
                                            key={m}
                                            onClick={() => {
                                                setViewDate(setMonth(viewDate, i))
                                                setViewMode('calendar')
                                            }}
                                            className={cn(
                                                "w-full text-left px-4 py-2 rounded-lg text-[13px] transition-colors",
                                                getMonth(viewDate) === i ? "bg-[#ff0054] text-white" : "text-[#ccc] hover:bg-white/5"
                                            )}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {viewMode === 'year' && (
                            <motion.div
                                key="years"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute inset-0 overflow-y-auto scrollbar-hide"
                            >
                                <div className="grid grid-cols-1 gap-1">
                                    {years.map(y => (
                                        <button
                                            key={y}
                                            onClick={() => {
                                                setViewDate(setYear(viewDate, y))
                                                setViewMode('calendar')
                                            }}
                                            className={cn(
                                                "w-full text-left px-4 py-2 rounded-lg text-[13px] transition-colors",
                                                getYear(viewDate) === y ? "bg-[#ff0054] text-white" : "text-[#ccc] hover:bg-white/5"
                                            )}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#333]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#ccc] hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSetDate}
                        className="px-6 py-2 rounded-lg text-[13px] font-medium bg-[#ff0054] text-white hover:bg-[#ff0054]/90 transition-colors shadow-lg shadow-[#ff0054]/20"
                    >
                        Set Date
                    </button>
                </div>

            </div>

            {/* Side Lists (Visual Match Strategy: Render visible lists if we want strict match, 
                but switcher above is cleaner for space. 
                Wait, reference image had side lists visible. 
                I will stick to the switcher for now as it fits better in a small popover unless requested specifically to expand width.
                The image shows Years and Months as separate columns NEXT to calendar?
                Ah, looking closely at image: 
                It's ONE container. The "Years" list is effectively visible or selectable. 
                Actually, the image shows "2021" selected in a column and "April" selected in another column.
                This suggests a 3-column layout? No, standard usually has Calendar, OR Month/Year.
                The image shows the "Month/Year" view ACTIVE.
                I implemented toggling. This works well.
             */}
        </div>
    )
}
