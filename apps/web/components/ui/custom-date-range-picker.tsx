"use client"

import * as React from "react"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    isBefore,
    isAfter,
    startOfWeek,
    endOfWeek,
    differenceInDays,
    parseISO,
} from "date-fns"
import { pt } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomDateRangePickerProps {
    initialStartDate?: string
    initialEndDate?: string
    onSave: (startDate: string, endDate: string) => void
    onClose: () => void
}

export function CustomDateRangePicker({
    initialStartDate,
    initialEndDate,
    onSave,
    onClose
}: CustomDateRangePickerProps) {
    const [currentMonth, setCurrentMonth] = React.useState(() => {
        return initialStartDate ? parseISO(initialStartDate) : new Date()
    })
    
    const [startDate, setStartDate] = React.useState<Date | null>(
        initialStartDate ? parseISO(initialStartDate) : null
    )
    const [endDate, setEndDate] = React.useState<Date | null>(
        initialEndDate ? parseISO(initialEndDate) : null
    )
    const [hoverDate, setHoverDate] = React.useState<Date | null>(null)

    const nextMonth = addMonths(currentMonth, 1)

    const handleDateClick = (date: Date) => {
        if (!startDate) {
            setStartDate(date)
            setEndDate(null)
        } else if (startDate && !endDate) {
            if (isBefore(date, startDate)) {
                setStartDate(date)
            } else {
                setEndDate(date)
            }
        } else if (startDate && endDate) {
            setStartDate(date)
            setEndDate(null)
        }
    }

    const handleHover = (date: Date) => {
        if (startDate && !endDate) {
            setHoverDate(date)
        }
    }

    const handleMouseLeave = () => {
        setHoverDate(null)
    }

    const renderMonth = (monthToRender: Date) => {
        const start = startOfMonth(monthToRender)
        const end = endOfMonth(monthToRender)
        // Adjust startOfWeek to make Monday the first day (weekStartsOn: 1)
        const startDateOfWeek = startOfWeek(start, { weekStartsOn: 1 })
        const endDateOfWeek = endOfWeek(end, { weekStartsOn: 1 })

        const days = eachDayOfInterval({
            start: startDateOfWeek,
            end: endDateOfWeek
        })

        const weekDays = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"]

        return (
            <div className="flex flex-col gap-4">
                <div className="flex justify-center items-center h-8">
                    <span className="text-[14px] font-bold text-white capitalize tracking-wide">
                        {format(monthToRender, "LLLL", { locale: pt })}
                    </span>
                </div>

                <div className="grid grid-cols-7 gap-y-2 gap-x-0">
                    {weekDays.map((day, i) => (
                        <div key={day} className="h-8 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-[#97A1B3] tracking-widest">{day}</span>
                        </div>
                    ))}
                    
                    {days.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, monthToRender)
                        const isSelectedStart = startDate && isSameDay(day, startDate)
                        const isSelectedEnd = endDate && isSameDay(day, endDate)
                        const isSunday = day.getDay() === 0 // 0 is Sunday in JS Date
                        
                        let isBetween = false
                        let isHoverBetween = false
                        
                        if (startDate && endDate) {
                            isBetween = isWithinInterval(day, { start: startDate, end: endDate }) && !isSelectedStart && !isSelectedEnd
                        } else if (startDate && hoverDate) {
                            const start = isBefore(startDate, hoverDate) ? startDate : hoverDate
                            const end = isBefore(startDate, hoverDate) ? hoverDate : startDate
                            isHoverBetween = isWithinInterval(day, { start, end }) && !isSameDay(day, startDate) && !isSameDay(day, hoverDate)
                        }

                        if (!isCurrentMonth) {
                            return <div key={`empty-${idx}`} className="w-[40px] h-[40px]" />
                        }

                        // Determine background classes for range connections
                        let bgClass = "bg-transparent"
                        let textClass = "text-[#97A1B3]"
                        let roundedClass = "rounded-full"

                        if (isSelectedStart) {
                            bgClass = "bg-[#615fff]"
                            textClass = "text-white"
                            if (endDate || hoverDate) {
                                roundedClass = "rounded-l-[8px]"
                            } else {
                                roundedClass = "rounded-[8px]"
                            }
                        } else if (isSelectedEnd) {
                            bgClass = "bg-[#615fff]"
                            textClass = "text-white"
                            roundedClass = "rounded-r-[8px]"
                        } else if (isBetween || isHoverBetween) {
                            bgClass = "bg-[#615fff]/20"
                            textClass = "text-white"
                            roundedClass = "rounded-none"
                        } else if (isSunday) {
                            textClass = "text-[#ff4545]" // Red for Sundays
                        } else {
                            textClass = "text-white"
                        }

                        // Adjust rounding for start/end of weeks if they are in between
                        if (isBetween || isHoverBetween) {
                            if (day.getDay() === 1) roundedClass = "rounded-l-[8px]" // Monday
                            if (day.getDay() === 0) roundedClass = "rounded-r-[8px]" // Sunday
                        }

                        return (
                            <div 
                                key={day.toISOString()} 
                                className={cn("w-[40px] h-[40px] flex items-center justify-center transition-colors cursor-pointer", bgClass, roundedClass)}
                                onClick={() => handleDateClick(day)}
                                onMouseEnter={() => handleHover(day)}
                            >
                                <span className={cn("text-[14px] font-medium", textClass)}>
                                    {format(day, "d")}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    const durationDays = (startDate && endDate) ? differenceInDays(endDate, startDate) + 1 : 0
    let durationText = ""
    if (startDate && endDate) {
        durationText = `${format(startDate, "d MMM", { locale: pt })} — ${format(endDate, "d MMM", { locale: pt })} (${durationDays} dias)`
    } else if (startDate) {
        durationText = format(startDate, "d MMM", { locale: pt })
    }

    return (
        <div 
            className="w-[740px] bg-[#111216] rounded-[16px] border border-[#27282D] shadow-2xl p-6 select-none font-inter"
            onMouseLeave={handleMouseLeave}
        >
            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                .font-inter { font-family: 'Inter', sans-serif; }
            `}} />
            
            {/* Calendar Headers & Navigation */}
            <div className="relative flex justify-between items-start mb-6">
                <button 
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center text-[#97A1B3] hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="w-1/2 px-8">
                    {renderMonth(currentMonth)}
                </div>
                
                <div className="w-1/2 px-8">
                    {renderMonth(nextMonth)}
                </div>

                <button 
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="absolute right-0 top-1 w-6 h-6 flex items-center justify-center text-[#97A1B3] hover:text-white transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-[#27282D] mt-2">
                <button 
                    onClick={() => {
                        setStartDate(null)
                        setEndDate(null)
                    }}
                    className="text-[14px] font-bold text-[#615fff] hover:brightness-125 transition-all"
                >
                    Limpar
                </button>

                <span className="text-[14px] text-[#97A1B3]">
                    {durationText}
                </span>

                <button 
                    onClick={() => {
                        if (startDate && endDate) {
                            onSave(
                                format(startDate, "yyyy-MM-dd"), 
                                format(endDate, "yyyy-MM-dd")
                            )
                        } else if (startDate) {
                            onSave(
                                format(startDate, "yyyy-MM-dd"), 
                                format(startDate, "yyyy-MM-dd")
                            )
                        }
                        onClose()
                    }}
                    disabled={!startDate}
                    className="h-10 px-6 rounded-[8px] bg-[#615fff] text-white text-[14px] font-bold transition-all hover:bg-[#615fff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Salvar
                </button>
            </div>
        </div>
    )
}
