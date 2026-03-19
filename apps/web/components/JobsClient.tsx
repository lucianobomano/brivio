"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, ArrowUp, Clock, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const CATEGORIES = ["All", "Design", "Development", "Marketing", "Management"]
const TYPES = ["All", "Full-time", "Contract", "Freelance", "Internship"]
const LOCATIONS = ["All", "Remote", "USA", "Europe", "Angola", "Portugal"]

interface Job {
    id: string | number
    title: string
    company: string
    companyLogo: string
    location: string
    type: string
    salary: string
    posted: string
    category: string
    website: string
    description: string
}

export function JobsClient({ initialJobs = [] }: { initialJobs?: Job[] }) {
    const [jobs] = React.useState(initialJobs)
    const [activeCategory, setActiveCategory] = React.useState("All")
    const [activeType, setActiveType] = React.useState("All")
    const [activeLocation, setActiveLocation] = React.useState("All")
    const [openDropdown, setOpenDropdown] = React.useState<string | null>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const filteredJobs = jobs.filter(job => {
        const matchesCategory = activeCategory === "All" || job.category === activeCategory
        const matchesType = activeType === "All" || job.type === activeType
        const matchesLocation = activeLocation === "All" || job.location.includes(activeLocation)
        return matchesCategory && matchesType && matchesLocation
    })

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto bg-bg-0 text-text-primary font-inter-tight relative">
            {/* Sub-header Filters */}
            <div className="px-[55px] py-3 border-b border-bg-3 flex items-center justify-between bg-bg-0/80 backdrop-blur-md sticky top-0 z-40 overflow-visible whitespace-nowrap scrollbar-hide">
                <div className="flex items-center gap-3">
                    {[
                        { label: "Category", value: activeCategory, options: CATEGORIES, setter: setActiveCategory },
                        { label: "Type", value: activeType, options: TYPES, setter: setActiveType },
                        { label: "Location", value: activeLocation, options: LOCATIONS, setter: setActiveLocation },
                    ].map((filter) => (
                        <div key={filter.label} className="relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === filter.label ? null : filter.label)}
                                className={cn(
                                    "flex items-center px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors border flex items-center gap-6",
                                    openDropdown === filter.label
                                        ? "bg-bg-3 border-text-tertiary text-text-primary"
                                        : "bg-bg-2 border-bg-3 text-text-secondary hover:bg-bg-3"
                                )}
                            >
                                <span className="opacity-60">{filter.label}:</span> {filter.value}
                                <ChevronDown className={cn("w-4 h-4 transition-transform", openDropdown === filter.label && "rotate-180")} />
                            </button>

                            {openDropdown === filter.label && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setOpenDropdown(null)}
                                    />
                                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-bg-1 border border-bg-3 rounded-xl shadow-2xl z-20 py-2 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                        {filter.options.map(option => (
                                            <button
                                                key={option}
                                                onClick={() => {
                                                    filter.setter(option)
                                                    setOpenDropdown(null)
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-2 text-[13px] font-semibold transition-colors",
                                                    filter.value === option
                                                        ? "text-accent-indigo bg-accent-indigo/10"
                                                        : "text-text-secondary hover:bg-bg-2 hover:text-text-primary"
                                                )}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-6 pr-4">
                    <button className="text-[13px] font-bold text-accent-indigo hover:opacity-80 transition-opacity">
                        Post one job for $90
                    </button>
                    <div className="h-4 w-[1px] bg-bg-3" />
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-[#06D6A0] rounded-full shadow-sm" />
                        <span className="text-[13px] font-semibold text-text-secondary">{filteredJobs.length} opportunities</span>
                    </div>
                </div>
            </div>

            <main className="px-[55px] pb-24 max-w-[1920px] mx-auto">
                <div className="flex flex-col items-center py-24 text-center">
                    <h1 className="text-[150px] font-normal tracking-[-0.04em] text-text-primary mb-12 uppercase leading-[0.9] font-inter-tight text-center">
                        THE JOBS<br />BOARD
                    </h1>
                    <p className="text-[15px] text-text-secondary max-w-[420px] leading-relaxed font-semibold font-inter-tight">
                        Latest Vacancies in Web Design and UX/UI Design. Find your next creative milestone.
                    </p>
                </div>

                <div className="flex items-center justify-between mb-12 py-6 border-b border-bg-3">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.2em]">Latest Vacancies</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                            {filteredJobs.length} items found
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                    {filteredJobs.map((job) => (
                        <Link key={job.id} href={`/jobs/${job.id}`} className="bg-bg-1 border border-bg-3 rounded-[24px] p-8 flex flex-col group cursor-pointer hover:border-text-tertiary/20 transition-all duration-500 hover:shadow-2xl relative">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-bg-2 border border-bg-3 flex items-center justify-center text-lg font-bold text-text-secondary overflow-hidden">
                                    {job.companyLogo.startsWith('http') ? (
                                        <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                                    ) : (
                                        job.companyLogo
                                    )}
                                </div>
                                {job.location === "Remote" && (
                                    <span className="px-3 py-1 bg-bg-2 border border-bg-3 rounded-full text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                                        Remote
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest mb-1">{job.company}</h3>
                                    <h2 className="text-[22px] font-bold text-text-primary leading-tight group-hover:text-accent-indigo transition-colors">{job.title}</h2>
                                </div>

                                <p className="text-[14px] text-text-secondary line-clamp-3 font-medium leading-relaxed mb-6">
                                    {job.description}
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                                        <span className="text-text-tertiary">Location</span>
                                        <span className="text-text-secondary">{job.location}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                                        <span className="text-text-tertiary">Type</span>
                                        <span className="text-text-secondary">{job.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-bg-3 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {job.posted}
                                </span>
                                <div className="w-8 h-8 rounded-full bg-bg-2 border border-bg-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <ArrowRight className="w-4 h-4 text-text-primary" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>

            {/* Floating Footer Menu */}
            <div className="fixed bottom-[30px] left-0 right-0 px-[28px] z-[100] flex justify-center pointer-events-none">
                <div className="relative pointer-events-none flex items-center justify-center">
                    <div className="absolute right-[calc(100%+520px)] bottom-0 w-[60px] h-[60px] pointer-events-auto">
                        <button
                            onClick={scrollToTop}
                            className="w-[60px] h-[60px] bg-[#222222] rounded-[8px] flex items-center justify-center text-white shadow-xl hover:bg-[#333333] transition-colors"
                        >
                            <ArrowUp className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="w-fit h-[72px] bg-black/40 backdrop-blur-[40px] rounded-l-[10px] rounded-r-[100px] p-[12px] flex items-center gap-2 shadow-2xl pointer-events-auto animate-border-glow-flow relative">
                        <div className="absolute inset-0 rounded-l-[10px] rounded-r-[100px] border-2 border-white/5 pointer-events-none" />

                        <div className="flex items-center gap-2 relative z-10 w-full h-full">
                            <div className="w-[60px] h-[60px] bg-[#232323]/80 rounded-full flex items-center justify-center group cursor-pointer hover:bg-[#2a2a2a] transition-colors shrink-0">
                                <div className="w-10 h-10 rounded-full border-[3px] border-transparent bg-origin-border bg-clip-content border-box bg-gradient-to-tr from-[#FF0054] via-[#88007F] to-[#06D6A0] relative">
                                    <div className="absolute inset-0 rounded-full border-[1.5px] border-white/20" />
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#311C99]/40 to-transparent" />
                                </div>
                            </div>

                            <div className="w-fit h-[60px] bg-[#3E3E3E]/40 rounded-[8px] flex items-center px-1.5 gap-1.5 backdrop-blur-2xl">
                                {[
                                    { label: 'Brands', href: '/brands' },
                                    { label: 'Brand books', href: '#' },
                                    { label: 'Collections', href: '#' },
                                    { label: 'Creators pool', href: '/creators-pool' }
                                ].map(item => (
                                    <Link key={item.label} href={item.href}>
                                        <button className="h-[48px] rounded-[6px] border-[0.5px] border-[#727272]/50 text-[#727272] hover:border-white hover:text-white text-[13px] font-bold font-inter-tight px-[20px] whitespace-nowrap transition-all">
                                            {item.label}
                                        </button>
                                    </Link>
                                ))}
                            </div>

                            <button className="w-[90px] h-[60px] bg-[#E9E9E9] rounded-l-[8px] rounded-r-[100px] text-[13px] font-bold text-[#222222] hover:bg-white transition-colors shrink-0 shadow-lg">
                                Be pro
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
