"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ArrowUpRight, BookOpen, Globe, LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { FloatingMenu } from "./layout/FloatingMenu"

interface Brandbook {
    id: string
    title: string
    brand_id: string
    brand: {
        id: string
        name: string
        logo_url: string | null
        slug: string
        primary_color: string | null
    }
    created_at: string
}

const CATEGORIES = ["All", "Visual Identity", "Verbal Identity", "Guidelines", "Digital", "Corporate"]

export function BrandBooksClient({ initialBrandbooks }: { initialBrandbooks: Brandbook[] }) {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedCategory, setSelectedCategory] = React.useState("All")

    const filteredBooks = initialBrandbooks.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.brand?.name.toLowerCase().includes(searchQuery.toLowerCase())
        // Since we don't have categories in the DB yet, we'll just filter by search for now if not "All"
        // In a real app we'd have a 'category' column
        return matchesSearch
    })

    const getGradient = (id: string, color?: string | null) => {
        if (color) return `linear-gradient(135deg, ${color}33 0%, ${color} 100%)`
        const colors = [
            'from-accent-indigo to-accent-blue',
            'from-accent-pink to-accent-orange',
            'from-accent-green to-accent-blue',
            'from-[#FF0054] to-[#0000FF]'
        ]
        const idx = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
        return colors[idx]
    }

    return (
        <div className="flex-1 overflow-y-auto px-[55px] pt-0 pb-24 bg-bg-0 relative selection:bg-accent-pink selection:text-white">
            {/* Hero Section */}
            <div className="max-w-full mx-auto flex flex-col items-center justify-start text-center pt-[80px] mb-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center"
                >
                    <div className="mb-8 px-6 py-2 rounded-full border border-bg-3 text-[14px] font-bold text-text-tertiary uppercase tracking-[0.2em]">
                        Universe of Brands
                    </div>
                    <h1 className="text-[120px] leading-[0.85] font-normal font-inter-tight tracking-[-0.05em] text-text-primary mb-12 uppercase max-w-5xl">
                        Universal <br /> <span className="text-accent-pink italic font-serif opacity-90 lowercase translate-x-12 inline-block">Brand Books</span>
                    </h1>
                    <p className="text-[20px] text-text-secondary max-w-2xl leading-relaxed font-medium">
                        Explore the world's most detailed brand guidelines. Learn from market leaders and discover new creative perspectives.
                    </p>
                </motion.div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between mb-16 px-4">
                <div className="relative w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-focus-within:text-accent-pink transition-colors" />
                    <input
                        type="text"
                        placeholder="Type to search brands..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-16 bg-bg-1 border border-bg-3 rounded-2xl pl-12 pr-4 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-pink/50 focus:ring-4 focus:ring-accent-pink/5 transition-all font-semibold text-lg"
                    />
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide py-2">
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={cn(
                                "px-8 py-3 rounded-full text-[14px] font-black uppercase tracking-wider transition-all border",
                                selectedCategory === category
                                    ? "bg-text-primary text-bg-0 border-text-primary shadow-xl shadow-text-primary/10"
                                    : "bg-transparent text-text-tertiary border-bg-3 hover:border-text-primary hover:text-text-primary"
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4">
                <AnimatePresence mode="popLayout">
                    {filteredBooks.map((book, index) => (
                        <motion.div
                            key={book.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className="group relative h-[540px] bg-bg-1 border border-bg-3 rounded-[40px] overflow-hidden hover:border-accent-pink/40 hover:shadow-2xl hover:shadow-accent-pink/5 transition-all duration-700"
                        >
                            <Link href={`/brand/${book.brand?.id}/brandbook?preview=true`}>
                                {/* Card Header / Brand Info */}
                                <div className="p-10 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-12">
                                        <div className="w-16 h-16 rounded-2xl bg-bg-2 border border-bg-3 flex items-center justify-center p-3 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                                            {book.brand?.logo_url ? (
                                                <Image
                                                    src={book.brand.logo_url}
                                                    alt={book.brand.name}
                                                    width={48}
                                                    height={48}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className={cn("w-full h-full rounded-lg bg-gradient-to-tr", getGradient(book.id))} />
                                            )}
                                        </div>
                                        <ArrowUpRight className="w-6 h-6 text-text-tertiary group-hover:text-accent-pink transition-colors group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </div>

                                    <div className="flex-1">
                                        <span className="text-[11px] font-black text-accent-pink border border-accent-pink/20 px-3 py-1 rounded-full uppercase tracking-tighter mb-4 inline-block bg-accent-pink/5">
                                            Public Access
                                        </span>
                                        <h3 className="text-[32px] font-normal font-inter-tight text-text-primary group-hover:text-accent-pink transition-colors leading-[1.1] mb-4">
                                            {book.brand?.name}&apos;s <br />
                                            <span className="font-black text-xl text-text-tertiary">Brandbook 2025</span>
                                        </h3>
                                        <p className="text-[15px] text-text-secondary line-clamp-2 font-medium">
                                            Official guidelines, visual identity, values and strategic positioning of {book.brand?.name}.
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-8 pt-8 border-t border-bg-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-bg-2 border border-bg-3 flex items-center justify-center">
                                                <BookOpen className="w-4 h-4 text-text-tertiary" />
                                            </div>
                                            <span className="text-[13px] font-bold text-text-tertiary">Guidelines</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Globe className="w-4 h-4 text-text-tertiary" />
                                            <LayoutGrid className="w-4 h-4 text-text-tertiary" />
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-accent-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            </Link>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredBooks.length === 0 && (
                <div className="py-40 text-center">
                    <p className="text-text-tertiary text-lg font-bold uppercase tracking-widest">No brand books found.</p>
                </div>
            )}

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
