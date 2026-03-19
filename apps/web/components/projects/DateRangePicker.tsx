"use client"

import * as React from "react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, startOfDay, getDay, differenceInDays } from "date-fns"
import { pt } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DateRangePickerProps {
    startDate?: Date
    due_date?: Date
    onSave: (range: { start?: Date; end?: Date }) => void
}

export function DateRangePicker({ startDate, due_date, onSave }: DateRangePickerProps) {
    const [currentMonth, setCurrentMonth] = React.useState(startDate || new Date())
    const [selection, setSelection] = React.useState<{ start?: Date; end?: Date }>({
        start: startDate,
        end: due_date
    })
    const [draggingPart, setDraggingPart] = React.useState<'start' | 'end' | null>(null)

    const handleMouseDown = (e: React.MouseEvent, date: Date) => {
        if (selection.start && isSameDay(date, selection.start)) {
            e.preventDefault()
            setDraggingPart('start')
        } else if (selection.end && isSameDay(date, selection.end)) {
            e.preventDefault()
            setDraggingPart('end')
        }
    }

    const handleMouseEnterDay = (date: Date) => {
        if (!draggingPart) return
        const day = startOfDay(date)

        if (draggingPart === 'start') {
            if (selection.end && day > selection.end) {
                setSelection({ start: selection.end, end: day })
                setDraggingPart('end')
            } else {
                setSelection(prev => ({ ...prev, start: day }))
            }
        } else if (draggingPart === 'end') {
            if (selection.start && day < selection.start) {
                setSelection({ start: day, end: selection.start })
                setDraggingPart('start')
            } else {
                setSelection(prev => ({ ...prev, end: day }))
            }
        }
    }

    React.useEffect(() => {
        const handleGlobalMouseUp = () => setDraggingPart(null)
        if (draggingPart) {
            window.addEventListener('mouseup', handleGlobalMouseUp)
        }
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
    }, [draggingPart])

    const nextMonth = addMonths(currentMonth, 1)

    const handleDateClick = (date: Date) => {
        const day = startOfDay(date)
        if (!selection.start || (selection.start && selection.end)) {
            setSelection({ start: day, end: undefined })
        } else if (day < selection.start) {
            setSelection({ start: day, end: selection.start })
        } else {
            setSelection({ ...selection, end: day })
        }
    }

    const clearRange = () => {
        setSelection({ start: undefined, end: undefined })
    }

    const renderMonth = (monthDate: Date) => {
        const start = startOfMonth(monthDate)
        const end = endOfMonth(monthDate)
        const days = eachDayOfInterval({ start, end })

        // Pad days at the start
        const startDayOfWeek = getDay(start) // 0 (Sun) to 6 (Sat)
        // We want MON to SUN, so adjust startDayOfWeek
        // Monday=1, ..., Sunday=0 (or 7)
        const adjustedStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

        const blanks = Array(adjustedStart).fill(null)

        const dayLabels = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"]

        return (
            <div className="flex-1 min-w-[300px]">
                <h3 className="text-center font-bold text-gray-700 dark:text-gray-300 mb-6 capitalize text-sm uppercase tracking-widest">
                    {format(monthDate, "MMMM", { locale: pt })}
                </h3>
                <div className="grid grid-cols-7 gap-y-1">
                    {dayLabels.map(label => (
                        <div key={label} className="text-center text-[10px] font-black text-gray-400 mb-4 tracking-tighter">
                            {label}
                        </div>
                    ))}
                    {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                    {days.map(day => {
                        const isSelected = (selection.start && isSameDay(day, selection.start)) || (selection.end && isSameDay(day, selection.end))
                        const isInRange = selection.start && selection.end && isWithinInterval(day, { start: selection.start, end: selection.end })
                        const isStart = selection.start && isSameDay(day, selection.start)
                        const isEnd = selection.end && isSameDay(day, selection.end)

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => !draggingPart && handleDateClick(day)}
                                onMouseDown={(e) => handleMouseDown(e, day)}
                                onMouseEnter={() => handleMouseEnterDay(day)}
                                className={cn(
                                    "h-10 w-full flex items-center justify-center text-sm transition-all relative",
                                    "hover:bg-gray-100 dark:hover:bg-white/5",
                                    isInRange && "bg-[#ff0054]/10 dark:bg-[#6366F1]/10 text-[#ff0054] dark:text-[#6366F1]",
                                    isSelected && "bg-[#ff0054] dark:bg-[#6366F1] text-white font-bold rounded-[4px] z-10",
                                    dayLabels[adjustDate(getDay(day))] === "DOM" && "text-red-400"
                                )}
                            >
                                {format(day, "d")}
                                {isStart && selection.end && (
                                    <div className="absolute left-1/2 right-0 top-0 bottom-0 bg-[#ff0054]/10 dark:bg-[#6366F1]/10 -z-10" />
                                )}
                                {isEnd && selection.start && (
                                    <div className="absolute left-0 right-1/2 top-0 bottom-0 bg-[#ff0054]/10 dark:bg-[#6366F1]/10 -z-10" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    function adjustDate(day: number) {
        return day === 0 ? 6 : day - 1
    }

    const nights = selection.start && selection.end ? differenceInDays(selection.end, selection.start) : 0

    return (
        <div className={cn(
            "p-8 bg-white dark:bg-[#0B0F1A] border border-gray-100 dark:border-white/10 rounded-[16px] shadow-2xl w-fit",
            draggingPart && "select-none"
        )}>
            <div className="flex gap-12 relative">
                <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="absolute left-[-20px] top-[40px] p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 transition-all"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-12">
                    {renderMonth(currentMonth)}
                    {renderMonth(nextMonth)}
                </div>

                <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="absolute right-[-20px] top-[40px] p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 transition-all"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <div className="mt-10 flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-6">
                <button
                    onClick={clearRange}
                    className="text-[#ff0054] dark:text-[#6366F1] font-bold text-sm hover:underline"
                >
                    Limpar
                </button>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="text-[14px] font-[300] text-gray-600 dark:text-gray-400">
                            {selection.start ? format(selection.start, "d MMM", { locale: pt }) : "---"}
                            {" — "}
                            {selection.end ? format(selection.end, "d MMM", { locale: pt }) : "---"}
                            {nights > 0 && ` (${nights} ${nights === 1 ? 'dia' : 'dias'})`}
                        </span>
                    </div>
                    <Button
                        onClick={() => onSave(selection)}
                        className="bg-[#ff0054] dark:bg-[#6366F1] hover:bg-[#e6004c] dark:hover:bg-[#4F46E5] text-white rounded-[8px] font-bold px-8 h-10"
                    >
                        Salvar
                    </Button>
                </div>
            </div>
        </div>
    )
}
