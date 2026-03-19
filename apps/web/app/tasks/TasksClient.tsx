"use client"

import React, { useState, useEffect } from "react"
import {
    Plus,
    Search,
    Settings,
    Grid,
    Home,
    CheckCircle2,
    MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreateListModal } from "@/components/tasks/CreateListModal"
import { TaskListWithTasks } from "@/app/actions/tasks"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface TasksClientPageProps {
    user: { id: string; name: string }
    initialLists: TaskListWithTasks[]
}

// Get appropriate greeting based on time of day
function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
}

// Format minutes to HH:MM (e.g. 90 -> 01:30)
function formatTime(minutes: number) {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// Format total duration (e.g. 90 -> 1hr 30min)
function formatTotalDuration(minutes: number) {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs === 0) return `${mins}min`
    return `${hrs}hr ${mins}min`
}

import { Maximize2, MoveUpRight } from "lucide-react"

export default function TasksClientPage({ user, initialLists }: TasksClientPageProps) {
    const router = useRouter()
    const lists = initialLists

    const [greeting, setGreeting] = useState("Good Morning")
    const [currentHour, setCurrentHour] = useState(12)

    useEffect(() => {
        const hour = new Date().getHours()
        setCurrentHour(hour)
        if (hour < 12) setGreeting("Good Morning")
        else if (hour < 18) setGreeting("Good Afternoon")
        else setGreeting("Good Evening")
    }, [])

    const handleListCreated = () => {
        router.refresh()
    }

    return (
        <div className="bg-[#0a0a0c] text-white min-h-screen font-sans">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-8 sticky top-0 z-10 bg-[#0a0a0c]">
                {/* Left side - Home button + Greeting */}
                <div className="flex items-center space-x-6">
                    <Link href="/dashboard">
                        <Button
                            variant="outline"
                            className="h-10 border-[#2a2a2e] bg-transparent text-white hover:bg-[#1a1a1e] rounded-lg px-4"
                        >
                            <Home className="w-4 h-4 mr-2" />
                            Home
                        </Button>
                    </Link>

                    <div>
                        <h1 className="text-xl font-semibold text-white">
                            {greeting}, {user.name}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Nice! Brivio* it in your {currentHour < 12 ? "morning" : currentHour < 18 ? "afternoon" : "evening"}
                        </p>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-3">
                    {/* Report button with gradient border */}
                    <div className="p-[1px] rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                        <Button
                            variant="ghost"
                            className="h-9 bg-[#0a0a0c] text-white hover:bg-[#1a1a1e] rounded-full px-4 text-sm font-medium"
                        >
                            Report
                        </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1a1e]">
                        <Search className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1a1e]">
                        <Settings className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1a1a1e]">
                        <Grid className="w-5 h-5" />
                    </Button>
                    <Avatar className="w-8 h-8 border border-[#2a2a2e]">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                </div>
            </header>

            {/* Content */}
            <div className="px-8 py-12">
                <div className="max-w-[1400px] mx-auto">
                    {/* Lists Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Existing Lists */}
                        {lists.map((list) => {
                            // Filter pending tasks
                            const pendingTasks = list.tasks?.filter(t => !t.completed) || []
                            const totalTime = pendingTasks.reduce((acc, t) => acc + (t.estimated_time || 0), 0)
                            const displayTasks = pendingTasks.slice(0, 4) // Show top 4

                            return (
                                <Link key={list.id} href={`/tasks/${list.id}`}>
                                    <div className="w-full h-[333px] rounded-xl border border-[#2a2a2e] bg-[#12121a] hover:border-[#3a3a3e] transition-colors relative group cursor-pointer flex flex-col">
                                        {/* Header */}
                                        <div className="flex items-center justify-between p-4 pb-2">
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                                                    style={list.color.includes('gradient')
                                                        ? { background: list.color }
                                                        : { backgroundColor: list.color }
                                                    }
                                                >
                                                    {list.title.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium text-white">{list.title}</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Tasks List or Empty State */}
                                        <div className="flex-1 p-3 overflow-hidden relative">
                                            {pendingTasks.length > 0 ? (
                                                <div className="space-y-2">
                                                    {displayTasks.map((task, idx) => (
                                                        <div key={task.id} className="bg-[#1a1a1e] rounded-lg p-3 flex justify-between items-center group-hover:opacity-40 transition-opacity">
                                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                                <span className="text-gray-600 text-xs w-3 font-mono">{idx + 1}</span>
                                                                <span className="text-sm text-gray-300 truncate font-medium">{task.title}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-600 font-mono">{formatTime(task.estimated_time || 0)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full group-hover:opacity-20 transition-opacity">
                                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#2a2a2e] flex items-center justify-center mb-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 flex items-center justify-center">
                                                            <CheckCircle2 className="w-4 h-4 text-black" />
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 font-medium tracking-wide">ALL CLEAR</span>
                                                </div>
                                            )}

                                            {/* Open Button Overlay (Center) */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 translate-y-2 group-hover:translate-y-0">
                                                <div className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-sm font-semibold flex items-center shadow-lg shadow-emerald-500/20">
                                                    <MoveUpRight className="w-4 h-4 mr-2" />
                                                    Open
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="p-4 pt-2 flex items-center justify-between border-t border-transparent">
                                            <span className="text-[11px] text-gray-500 font-medium">
                                                {pendingTasks.length} pending tasks
                                            </span>
                                            {pendingTasks.length > 0 && (
                                                <span className="text-[11px] text-gray-500 font-medium">
                                                    Est: {formatTotalDuration(totalTime)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}

                        {/* Create List Card */}
                        <CreateListModal userId={user.id} onListCreated={handleListCreated}>
                            <div className="w-full h-[333px] rounded-xl border-2 border-dashed border-[#2a2a2e] bg-transparent hover:border-[#3a3a3e] transition-colors flex flex-col items-center justify-center cursor-pointer group">
                                <Plus className="w-8 h-8 text-gray-600 group-hover:text-gray-400 mb-3" />
                                <span className="text-sm text-gray-600 group-hover:text-gray-400 font-medium tracking-wide">CREATE LIST</span>
                            </div>
                        </CreateListModal>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Get current hour for subtitle
const hour = new Date().getHours()
