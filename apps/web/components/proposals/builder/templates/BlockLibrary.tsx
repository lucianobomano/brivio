"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Sparkles, Image as ImageIcon, Type, Palette } from "lucide-react"

// Types for our blocks
export type BlockType = "Hero" | "TextBlock" | "ImageGrid" | "Branding"

export interface BlockData {
    id: string
    type: BlockType
    content: any
    styles?: any
}

// 1. HERO BLOCK
export const HeroBlock = ({ content, styles }: { content: any, styles?: any }) => (
    <section className={cn("py-24 px-8 text-center relative overflow-hidden", styles?.className)}>
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
        >
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-indigo mb-6 block">
                {content.subtitle || "Standard Preview"}
            </span>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase mb-8 leading-none">
                {content.title}
            </h1>
            <p className="text-text-secondary text-xl max-w-2xl mx-auto">
                {content.description}
            </p>
        </motion.div>
    </section>
)

// 2. TEXT BLOCK
export const TextBlock = ({ content, styles }: { content: any, styles?: any }) => (
    <section className={cn("py-16 px-8", styles?.className)}>
        <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-white uppercase italic tracking-tight">{content.heading}</h3>
            <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed space-y-4">
                {content.body.split('\n').map((para: string, i: number) => (
                    <p key={i}>{para}</p>
                ))}
            </div>
        </div>
    </section>
)

// 3. IMAGE GRID BLOCK
export const ImageGridBlock = ({ content, styles }: { content: any, styles?: any }) => (
    <section className={cn("py-16 px-8", styles?.className)}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {content.images.map((img: any, i: number) => (
                <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    className="aspect-video bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-12 h-12 text-white/20" />
                    </div>
                    {img.caption && (
                        <p className="absolute bottom-6 left-6 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                            {img.caption}
                        </p>
                    )}
                </motion.div>
            ))}
        </div>
    </section>
)

// 4. BRANDING BLOCK (Identity focus)
export const BrandingBlock = ({ content, styles }: { content: any, styles?: any }) => (
    <section className={cn("py-20 px-8 bg-white/5 border-y border-white/5", styles?.className)}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-indigo/10 border border-accent-indigo/20 mb-6">
                    <Palette size={12} className="text-accent-indigo" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent-indigo">Core Identity</span>
                </div>
                <h2 className="text-4xl font-black tracking-tight italic uppercase mb-6 truncate">{content.brandName}</h2>
                <div className="flex gap-4">
                    {content.colors.map((color: string, i: number) => (
                        <div key={i} className="group flex flex-col items-center gap-2">
                            <div
                                className="w-12 h-12 rounded-xl border border-white/10 shadow-lg"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-[9px] font-mono opacity-0 group-hover:opacity-40 transition-opacity uppercase">{color}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="w-full md:w-1/3 aspect-square bg-zinc-950 rounded-full border border-white/5 flex items-center justify-center p-12">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-accent-indigo to-community-purple opacity-20 blur-2xl animate-pulse" />
                <span className="absolute text-2xl font-black italic uppercase tracking-tighter opacity-10">Logo Symbol</span>
            </div>
        </div>
    </section>
)
