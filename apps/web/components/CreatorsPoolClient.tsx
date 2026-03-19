"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { FloatingMenu } from "./layout/FloatingMenu"

const CATEGORIES = ["All", "UI/UX", "Branding", "Illustration", "Photography", "Motion"]
const TYPES = ["All", "Individual", "Studio", "Agency"]
const COUNTRIES = ["All", "Angola", "Portugal", "Brazil", "USA"]



interface CreatorSummary {
    id: string
    user_id: string
    name: string
    avatar: string | null
    initials: string
    avatar_url?: string
    isPro: boolean
    location: string
    website: string
    category: string
    type: string
    country: string
    featuredImage: string
    awards: { p: string, w: string, l: string, s: string }
}

export function CreatorsPoolClient({ initialCreators = [] }: { initialCreators?: CreatorSummary[] }) {
    const [creators] = React.useState(initialCreators)
    const [activeCategory, setActiveCategory] = React.useState("All")
    const [activeType, setActiveType] = React.useState("All")
    const [activeOrder, setActiveOrder] = React.useState("Latest created")
    const [activeCountry, setActiveCountry] = React.useState("All")
    const [openDropdown, setOpenDropdown] = React.useState<string | null>(null)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const filteredCreators = creators
        .filter(creator => {
            const matchesCategory = activeCategory === "All" || creator.category === activeCategory
            const matchesType = activeType === "All" || creator.type === activeType
            const matchesCountry = activeCountry === "All" || creator.country === activeCountry
            return matchesCategory && matchesType && matchesCountry
        })
        .sort((a, b) => {
            if (activeOrder === "Most Awards") {
                const aVal = parseInt(a.awards?.p || "0")
                const bVal = parseInt(b.awards?.p || "0")
                return bVal - aVal
            }
            if (activeOrder === "Name A-Z") {
                return (a.name || "").localeCompare(b.name || "")
            }
            // Use user_id as a fallback for sorting Latest created
            return (b.user_id || "").localeCompare(a.user_id || "")
        })


    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto bg-bg-0 text-text-primary font-inter-tight relative">
            {/* Sub-header Filters */}
            <div className="px-[55px] py-3 border-b border-bg-3 flex items-center justify-between bg-bg-0/80 backdrop-blur-md sticky top-0 z-40 overflow-visible whitespace-nowrap scrollbar-hide">
                <div className="flex items-center gap-3">
                    {[
                        { label: "Type", value: activeType, options: TYPES, setter: setActiveType },
                        { label: "Category", value: activeCategory, options: CATEGORIES, setter: setActiveCategory },
                        { label: "Order", value: activeOrder, options: ["Latest created", "Most Awards", "Name A-Z"], setter: setActiveOrder },
                        { label: "Country", value: activeCountry, options: COUNTRIES, setter: setActiveCountry },
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
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-[#FF8C00] rounded-full shadow-sm" />
                        <span className="text-[13px] font-semibold text-text-secondary">1,564 online</span>
                    </div>
                </div>
            </div>

            <main className="px-[55px] pb-24 max-w-[1920px] mx-auto">
                {/* Hero Section */}
                <div className="flex flex-col items-center py-24 text-center">
                    <h1 className="text-[150px] font-normal tracking-[-0.04em] text-text-primary mb-12 uppercase leading-[0.9] font-inter-tight text-center">
                        CREATORS<br />POOL
                    </h1>
                    <p className="text-[15px] text-text-secondary max-w-[320px] leading-relaxed font-semibold font-inter-tight">
                        This is your community. Feel creativity proud to be part of it.
                    </p>
                </div>

                {/* Sub Hero Stats Bar */}


                {/* Creators Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-10 gap-y-24">
                    {filteredCreators.map((creator) => (
                        <Link key={creator.user_id} href={`/creators/${creator.user_id}`} className="flex flex-col group cursor-pointer">
                            {/* Card Media Case */}
                            <div className="aspect-[4/3.1] bg-bg-1 rounded-[32px] mb-8 overflow-hidden transition-all duration-700 group-hover:scale-[1.03] group-hover:shadow-2xl border border-bg-3 transform preserve-3d">
                                <div className={cn("w-full h-full transition-transform duration-700 group-hover:scale-110", creator.featuredImage)} />
                            </div>

                            {/* Card Header (Avatar + Name) */}
                            <div className="flex items-center gap-4 px-2 mb-8">
                                <div className="w-12 h-12 rounded-full bg-bg-1 border border-bg-3 flex items-center justify-center text-xs font-bold text-text-tertiary overflow-hidden">
                                    <div className="w-full h-full bg-gradient-to-tr from-bg-2 to-bg-0 flex items-center justify-center text-text-secondary">
                                        {creator.avatar ? (
                                            <Image src={creator.avatar} alt={creator.name} width={48} height={48} className="w-full h-full object-cover" />
                                        ) : (
                                            creator.initials
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[18px] font-bold text-text-primary group-hover:text-accent-indigo transition-colors">{creator.name}</span>
                                    {creator.isPro && <span className="text-[8px] font-black text-text-tertiary uppercase tracking-tighter align-top">Pro</span>}
                                </div>
                            </div>

                            {/* Card Content Table */}
                            <div className="space-y-0 px-2">
                                <div className="flex items-center justify-between py-[14px] border-b border-bg-3">
                                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.1em]">Location</span>
                                    <span className="text-[10px] font-bold text-text-secondary">{creator.location}</span>
                                </div>
                                <div className="flex items-center justify-between py-[14px] border-b border-bg-3">
                                    <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.1em]">Website</span>
                                    <span className="text-[10px] font-bold text-text-secondary border-b border-text-tertiary leading-none">{creator.website}</span>
                                </div>
                                <div className="pt-6">
                                    <div className="flex items-center justify-between mb-4 text-[10px] font-bold text-text-tertiary uppercase tracking-[0.1em]">
                                        Awards
                                    </div>
                                    <div className="grid grid-cols-4 border border-bg-3 rounded-[6px] overflow-hidden bg-bg-0 shadow-sm transition-all group-hover:border-bg-3/80">
                                        {[
                                            { label: "P", val: creator.awards.p },
                                            { label: "W", val: creator.awards.w },
                                            { label: "L", val: creator.awards.l },
                                            { label: "S", val: creator.awards.s }
                                        ].map((stat, idx) => (
                                            <div key={idx} className={cn(
                                                "flex flex-col",
                                                idx !== 3 && "border-r border-bg-3"
                                            )}>
                                                <div className="text-[9px] font-black text-text-tertiary py-1.5 bg-bg-1 text-center border-b border-bg-3">{stat.label}</div>
                                                <div className="text-[12px] font-black text-text-primary py-2.5 text-center">{stat.val}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>

            {/* Floating Footer Menu */}
            <FloatingMenu
                leftElement={
                    <div className="w-[60px] h-[60px] bg-[#232323]/80 rounded-full flex items-center justify-center group cursor-pointer hover:bg-[#2a2a2a] transition-colors shrink-0">
                        <div className="w-10 h-10 rounded-full border-[3px] border-transparent bg-origin-border bg-clip-content border-box bg-gradient-to-tr from-[#FF0054] via-[#88007F] to-[#06D6A0] relative">
                            <div className="absolute inset-0 rounded-full border-[1.5px] border-white/20" />
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#311C99]/40 to-transparent" />
                        </div>
                    </div>
                }
                rightElement={
                    <button className="w-[90px] h-[60px] bg-[#E9E9E9] rounded-full text-[13px] font-bold text-[#222222] hover:bg-white transition-colors shrink-0 shadow-lg">
                        Be pro
                    </button>
                }
            >
                {[
                    { label: 'Brands', href: '/brands' },
                    { label: 'Brand books', href: '/brandbooks' },
                    { label: 'Collections', href: '#' },
                    { label: 'Creators pool', href: '/creators-pool' }
                ].map(item => (
                    <Link key={item.label} href={item.href}>
                        <button className="h-[48px] rounded-full border-[0.5px] border-[#727272]/50 text-[#727272] hover:border-[#E9E9E9] hover:text-[#E9E9E9] text-[13px] font-bold font-inter-tight px-[20px] whitespace-nowrap transition-all">
                            {item.label}
                        </button>
                    </Link>
                ))}
            </FloatingMenu>
        </div>
    )
}
