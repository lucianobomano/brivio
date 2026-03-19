"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUp, ArrowRight, Share2, Globe, Clock, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

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
    country: string
    website: string
    description: string
}

export function JobDetailClient({ initialJob }: { initialJob: Job }) {
    const job = initialJob
    const containerRef = React.useRef<HTMLDivElement>(null)

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    }

    return (
        <div ref={containerRef} className="flex-1 overflow-y-auto bg-bg-0 text-text-primary font-inter-tight relative">
            {/* Top Toolbar */}
            <div className="px-[55px] py-4 border-b border-bg-3 flex items-center justify-between bg-bg-0/80 backdrop-blur-md sticky top-0 z-40">
                <Link href="/jobs" className="flex items-center gap-2 text-[13px] font-bold text-text-secondary hover:text-text-primary transition-colors group">
                    <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    Back to Jobs
                </Link>

                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-bg-1 rounded-full transition-colors">
                        <Share2 className="w-4 h-4 text-text-tertiary" />
                    </button>
                    <button className="p-2 hover:bg-bg-1 rounded-full transition-colors">
                        <Globe className="w-4 h-4 text-text-tertiary" />
                    </button>
                </div>
            </div>

            <main className="max-w-[1920px] mx-auto pb-48">
                {/* Hero Section */}
                <div className="flex flex-col items-center py-32 text-center px-[55px]">
                    <span className="text-[12px] font-bold text-text-tertiary uppercase tracking-[0.3em] mb-8">Job Opportunity</span>
                    <h1 className="text-[10vw] lg:text-[150px] font-normal tracking-[-0.04em] text-text-primary mb-12 uppercase leading-[0.9] font-inter-tight max-w-[1200px]">
                        {job.title}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-bg-2 border border-bg-3 flex items-center justify-center text-sm font-bold text-text-secondary overflow-hidden">
                            {job.companyLogo.startsWith('http') ? (
                                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                            ) : (
                                job.companyLogo
                            )}
                        </div>
                        <span className="text-[18px] font-semibold text-text-secondary">by {job.company}</span>
                    </div>
                </div>

                {/* Metadata Table */}
                <div className="px-[55px] mb-24">
                    <div className="border-t border-b border-bg-3 grid grid-cols-2 md:grid-cols-5 py-8 gap-8 md:gap-0">
                        {[
                            { label: "Date", value: job.posted },
                            { label: "Categories", value: job.category },
                            { label: "Country", value: job.country },
                            { label: "Type", value: job.type },
                            { label: "Location", value: job.location },
                        ].map((item, idx) => (
                            <div key={item.label} className={cn(
                                "flex flex-col gap-2 md:px-8",
                                idx !== 0 && "md:border-l border-bg-3"
                            )}>
                                <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">{item.label}</span>
                                <span className="text-[16px] font-bold text-text-primary">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Job Description Content */}
                <div className="max-w-[900px] mx-auto px-8 md:px-[55px]">
                    <div
                        className="prose prose-invert prose-p:text-[18px] prose-p:leading-[1.6] prose-p:text-text-secondary prose-li:text-[18px] prose-li:text-text-secondary prose-strong:text-text-primary prose-ul:list-disc prose-ul:ml-6 space-y-8 mb-24"
                        dangerouslySetInnerHTML={{ __html: job.description }}
                    />

                    {/* Subtle Apply Link */}
                    <div className="py-12 border-t border-bg-3">
                        <p className="text-[20px] font-semibold text-text-primary flex items-center gap-3">
                            Interested in this position?
                            <button className="text-accent-indigo hover:translate-x-2 transition-transform inline-flex items-center gap-2 group">
                                More info
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </p>
                    </div>
                </div>

                {/* More Jobs Section (Simplified/Optional) */}
                <div className="mt-48 px-[55px]">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-[12px] font-bold text-text-tertiary uppercase tracking-[0.3em]">More Jobs</h2>
                        <Link href="/jobs" className="text-[12px] font-bold text-text-primary hover:text-accent-indigo transition-colors uppercase tracking-widest border-b border-text-tertiary">
                            View All
                        </Link>
                    </div>
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
                                    { label: 'Creators pool', href: '/creators-pool' },
                                    { label: 'Jobs', href: '/jobs' }
                                ].map(item => (
                                    <Link key={item.label} href={item.href}>
                                        <button className="h-[48px] rounded-[6px] border-[0.5px] border-[#727272]/50 text-[#727272] hover:border-white hover:text-white text-[13px] font-bold font-inter-tight px-[20px] whitespace-nowrap transition-all">
                                            {item.label}
                                        </button>
                                    </Link>
                                ))}
                            </div>

                            <Link href="/">
                                <button className="w-[90px] h-[60px] bg-[#E9E9E9] rounded-l-[8px] rounded-r-[100px] text-[13px] font-bold text-[#222222] hover:bg-white transition-colors shrink-0 shadow-lg">
                                    Home
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
