'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
    ArrowRight,
    BookOpen,
    Plus,
    Box,
    Layout
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    MagneticButton,
    TiltCard,
    InfiniteMarquee,
    TextReveal,
    CustomCursor
} from './LandingComponents'

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false)
    return (
        <div className="border-b border-white/5 py-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full text-left"
            >
                <span className="text-xl font-bold tracking-tight">{question}</span>
                <div className={cn("transition-transform duration-300", isOpen ? "rotate-45" : "rotate-0")}>
                    <Plus size={24} className="text-accent-indigo" />
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="pt-4 text-text-secondary leading-relaxed">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const FeatureShowcase = ({
    title,
    subtitle,
    description,
    image,
    tags,
    reverse = false,
    id
}: {
    title: string,
    subtitle: string,
    description: string,
    image: string,
    tags: string[],
    reverse?: boolean,
    id: string
}) => {
    return (
        <section id={id} className="py-40 px-6 max-w-7xl mx-auto overflow-hidden">
            <div className={cn(
                "flex flex-col md:flex-row items-center gap-20",
                reverse ? "md:flex-row-reverse" : ""
            )}>
                <motion.div
                    initial={{ opacity: 0, x: reverse ? 100 : -100 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex-1 space-y-8"
                >
                    <div className="space-y-4">
                        <span className="text-[10px] font-black tracking-[0.5em] text-accent-indigo uppercase">{subtitle}</span>
                        <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">{title}</h2>
                    </div>
                    <p className="text-xl text-text-secondary leading-relaxed max-w-xl">
                        {description}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-4">
                        {tags.map(tag => (
                            <span key={tag} className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 backdrop-blur-md">
                                {tag}
                            </span>
                        ))}
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: reverse ? -100 : 100 }}
                    whileInView={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    viewport={{ once: true, margin: "-100px" }}
                    className="flex-1 relative aspect-square md:aspect-video rounded-[3.5rem] overflow-hidden border border-white/10 group"
                >
                    <Image
                        src={image}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                </motion.div>
            </div>
        </section>
    )
}

const InteractiveVisionLine = ({
    number,
    mainText,
    hoverText,
    delay = 0
}: {
    number: string,
    mainText: string,
    hoverText: string,
    delay?: number
}) => {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0.1, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="w-full relative py-20 px-6 md:px-20 group cursor-none overflow-hidden"
            animate={{
                backgroundColor: isHovered ? '#ff0054' : 'rgba(255, 0, 84, 0)'
            }}
            transition={{
                duration: 0.3,
                ease: "easeOut",
                opacity: { duration: 1, delay },
                x: { duration: 1, delay }
            }}
        >
            <div className="max-w-7xl mx-auto flex items-baseline space-x-12 md:space-x-24 relative z-10 pointer-events-none">
                <span className={cn(
                    "text-[10px] md:text-xs font-black tracking-[0.5em] transition-colors duration-200",
                    isHovered ? "text-white/40" : "text-[#ff0054]"
                )}>
                    {number}
                </span>
                <div className="relative">
                    <AnimatePresence mode="wait">
                        <motion.h2
                            key={isHovered ? 'hover' : 'main'}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="text-[12vw] md:text-[13vw] font-black italic tracking-tighter uppercase leading-[0.8] text-white"
                        >
                            {isHovered ? hoverText : mainText}
                        </motion.h2>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    )
}

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ')

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false)
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    // Scrollytelling Values
    const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
    const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.9])
    const narrativeBg = useTransform(scrollYProgress, [0.3, 0.5, 0.7], ["#000000", "#08080a", "#050505"])

    // Vertical Progress Ref for Features
    const connectionRef = useRef(null)
    const { scrollYProgress: lineProgress } = useScroll({
        target: connectionRef,
        offset: ["start center", "end center"]
    })
    const lineHeight = useTransform(lineProgress, [0, 1], ["0%", "100%"])

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const marqueeBrands = ["Corebook", "Aura", "Blitzit", "Luminal", "Ether", "Vanguard", "Nexus", "Prism"]

    return (
        <div ref={containerRef} className="flex flex-col min-h-screen bg-[#000000] text-white selection:bg-accent-indigo selection:text-white overflow-x-hidden pt-20 font-sans">
            <CustomCursor />
            <div className="noise-overlay" />

            {/* Viewport frames Glow */}
            <div className="fixed inset-0 pointer-events-none z-[60] border-[1px] border-white/5" />
            <div className="fixed inset-0 pointer-events-none z-50">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-indigo to-transparent opacity-20" />
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-community-pink to-transparent opacity-20" />
            </div>

            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'py-4 bg-black/80 backdrop-blur-2xl border-b border-white/5' : 'py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center group cursor-pointer">
                        <div className="relative h-8 w-36">
                            <Image src="/logo-brivio.png" alt="Brivio Logo" fill className="object-contain object-left" priority />
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center space-x-12">
                        {['Strategy', 'Assets', 'Workflow', 'Pricing'].map((item) => (
                            <Link key={item} href={`#${item.toLowerCase()}`} className="text-[11px] font-bold tracking-[0.2em] text-white/40 hover:text-white hover:tracking-[0.25em] transition-all uppercase">
                                {item}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center space-x-6">
                        <Link href="/login" className="text-[11px] font-bold tracking-widest text-white/40 hover:text-white uppercase transition-colors">Log In</Link>
                        <MagneticButton>
                            <Link href="/register">
                                <Button className="bg-white text-black hover:bg-zinc-200 font-black px-8 h-12 rounded-full transition-transform hover:scale-105 shadow-[0_10px_40px_rgba(255,255,255,0.15)] uppercase text-xs tracking-widest">
                                    Launch App
                                </Button>
                            </Link>
                        </MagneticButton>
                    </div>
                </div>
            </header>

            <main className="relative z-10">
                {/* HERO V3 - THE PORTAL */}
                <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-40 px-6 overflow-hidden">
                    <motion.div
                        style={{ opacity: heroOpacity, scale: heroScale }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                    >
                        <div className="relative w-[40rem] h-[40rem]">
                            <div className="absolute inset-0 bg-accent-indigo/30 blur-[160px] rounded-full animate-liquid-gradient" />
                            <div className="absolute inset-20 bg-community-purple/20 blur-[130px] rounded-full" />
                            {/* Floating HUD particles */}
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        y: [0, -20, 0],
                                        rotate: [0, 10, -10, 0],
                                        opacity: [0.3, 0.6, 0.3]
                                    }}
                                    transition={{
                                        duration: 5 + i,
                                        repeat: Infinity,
                                        delay: i * 0.5
                                    }}
                                    className="absolute text-[8px] font-bold tracking-[0.3em] text-white/20 whitespace-nowrap uppercase"
                                    style={{
                                        top: `${20 + i * 12}%`,
                                        left: `${10 + i * 15}%`,
                                    }}
                                >
                                    {`// SYSTEM_ORCHESTRATION_DATA_${i}`}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <div className="flex flex-col items-center text-center max-w-6xl relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-5 py-2 rounded-full border border-white/5 bg-zinc-950/50 backdrop-blur-xl mb-12"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-indigo">Building Future Brand Systems</span>
                        </motion.div>

                        <h1 className="text-7xl md:text-[10rem] lg:text-[13rem] font-bold tracking-tighter leading-[0.8] mb-12 text-center group cursor-default">
                            <TextReveal text="ORCHESTRATE" />
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="block text-accent-indigo italic mask-text-reveal"
                            >
                                YOUR ALPHA.
                            </motion.span>
                        </h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-lg md:text-2xl text-text-secondary max-w-2xl mb-16 font-medium leading-relaxed"
                        >
                            Brivio is the unbreakable infrastructure for brand scaling.
                            Centralize your energy, automate your consistency.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1 }}
                            className="flex items-center space-x-8"
                        >
                            <MagneticButton>
                                <Link href="/register">
                                    <Button size="lg" className="h-16 px-12 text-lg bg-accent-indigo hover:bg-accent-indigo/90 text-white rounded-full transition-all hover:shadow-[0_0_50px_rgba(255,0,84,0.5)] group">
                                        Start Your Evolution <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </MagneticButton>
                        </motion.div>
                    </div>

                    {/* HUD Floating Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 1 }}
                        className="mt-32 w-full max-w-5xl aspect-[21/9] rounded-[2.5rem] border border-white/5 bg-zinc-950/30 backdrop-blur-3xl p-2 relative group overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-indigo/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        <div className="h-full w-full rounded-[2rem] bg-zinc-900 overflow-hidden relative border border-white/5">
                            <Image src="/landing/hero_v3.png" alt="Platform" fill className="object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100" />
                            <div className="absolute top-8 left-8 flex items-center space-x-4">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-[10px] font-bold tracking-[0.5em] text-white/20 uppercase mb-4 block">System Interface V3.0</span>
                                    <div className="w-40 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* TRUSTED BY MARQUEE */}
                <div className="pt-20">
                    <div className="max-w-7xl mx-auto px-6 mb-10">
                        <span className="text-[10px] font-bold tracking-[0.3em] text-white/30 uppercase italic">{"// Deployed by visionary architects"}</span>
                    </div>
                    <InfiniteMarquee items={marqueeBrands} speed={30} />
                </div>

                {/* FEATURES BENTO V3 - THE NEXUS */}
                <section id="strategy" className="py-40 px-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-[340px]">
                        {/* Brandbooks */}
                        <TiltCard className="md:col-span-8 md:row-span-2">
                            <div className="h-full w-full relative rounded-[3.5rem] border border-white/10 bg-zinc-950 overflow-hidden group">
                                <Image src="/landing/brandbook_ui.png" alt="Brandbooks" fill className="object-cover opacity-40 group-hover:opacity-60 transition-all duration-1000" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-12 flex flex-col justify-end">
                                    <div className="flex items-center space-x-4 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-accent-indigo/20 flex items-center justify-center border border-accent-indigo/30 backdrop-blur-xl">
                                            <BookOpen className="text-accent-indigo" size={28} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase block">CORE SYSTEM 01</span>
                                            <h3 className="text-4xl font-black tracking-tighter uppercase italic">Guidelines</h3>
                                        </div>
                                    </div>
                                    <p className="text-xl text-text-secondary max-w-md leading-relaxed mb-8">
                                        Move from static PDFs to living, breathing brand ecosystems. Automate compliance, accelerate adoption.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {['Auto-Sync', 'Multi-Tenant', 'Version Control'].map(tag => (
                                            <span key={tag} className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 backdrop-blur-md">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </TiltCard>

                        {/* DAM */}
                        <TiltCard className="md:col-span-4">
                            <div className="h-full w-full relative rounded-[3rem] border border-white/10 bg-zinc-950 overflow-hidden group p-10 flex flex-col justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
                                        <Box className="text-accent-blue" size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold tracking-tight">Asset Vault</h3>
                                </div>
                                <p className="text-sm text-text-secondary">
                                    Neural asset management. Tagging, retrieval, and distribution at scale.
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/5 overflow-hidden">
                                            <div className={`w-full h-full opacity-30 ${i % 2 === 0 ? 'bg-accent-indigo' : 'bg-accent-blue'}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TiltCard>

                        {/* Workflow */}
                        <TiltCard className="md:col-span-4">
                            <div className="h-full w-full relative rounded-[3rem] border border-white/10 bg-zinc-950 overflow-hidden group p-10 flex flex-col justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 rounded-xl bg-community-pink/10 flex items-center justify-center border border-community-pink/20 text-community-pink">
                                        <Layout size={24} />
                                    </div>
                                    <h3 className="text-2xl font-bold tracking-tight">Sprint Ops</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: '85%' }}
                                            className="h-full bg-community-pink"
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                        <span>Project Delta</span>
                                        <span>In Progress</span>
                                    </div>
                                </div>
                                <p className="text-sm text-text-secondary italic">
                                    &quot;Perfect execution for high-velocity design teams.&quot;
                                </p>
                            </div>
                        </TiltCard>
                    </div>
                </section>

                {/* SCROLLYTELLING - THE NARRATIVE */}
                <motion.section
                    style={{ backgroundColor: narrativeBg }}
                    className="py-40 transition-colors duration-1000"
                >
                    <InteractiveVisionLine
                        number="01"
                        mainText="DESIGN."
                        hoverText="AMAZING THINGS."
                        delay={0}
                    />
                    <InteractiveVisionLine
                        number="02"
                        mainText="CRAFT."
                        hoverText="LIVE BRANDBOOKS."
                        delay={0.2}
                    />
                    <InteractiveVisionLine
                        number="03"
                        mainText="SCALE."
                        hoverText="YOUR WORKFLOW."
                        delay={0.4}
                    />
                </motion.section>


                <div className="w-full h-px bg-[#373737] relative z-20" />

                <div ref={connectionRef} className="relative">
                    {/* Vertical Progress Line */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px z-20 pointer-events-none">
                        <div className="w-full h-full bg-[#373737]" />
                        <motion.div
                            style={{
                                height: lineHeight,
                                background: 'linear-gradient(to bottom, #FF0054, #88007F, #06D6A0, #311C99)'
                            }}
                            className="absolute top-0 left-0 w-full"
                        />
                    </div>

                    {/* DETAILED FEATURES V4 */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent-indigo/5 to-transparent pointer-events-none" />

                        <FeatureShowcase
                            id="brand-management"
                            subtitle="FEATURE 01"
                            title="Brand Management"
                            description="Guidelines in motion. Move from static PDFs to living, breathing brand ecosystems. Automate compliance and accelerate global brand adoption with our interactive system."
                            image="/landing/brand_management.png"
                            tags={['Living Docs', 'Palette Sync', 'Auto-Enforce']}
                        />

                        <FeatureShowcase
                            id="project-management"
                            subtitle="FEATURE 02"
                            title="Project Management"
                            description="Orchestration at scale. High-velocity design teams need more than just charts. Our visual timeline maps and stage-gate visualizations keep your global projects on track."
                            image="/landing/project_management.png"
                            tags={['Stage-Gate', 'Gantt Pro', 'Global Ops']}
                            reverse
                        />

                        <FeatureShowcase
                            id="task-management"
                            subtitle="FEATURE 03"
                            title="Task Management"
                            description="Precision execution. Focus on what matters. Our Kanban-style nodes feature real-time pulse indicators and contextual documentation to eliminate friction."
                            image="/landing/task_management.png"
                            tags={['Context Cards', 'Pulse Flow', 'Agile Max']}
                        />

                        <FeatureShowcase
                            id="asset-hub"
                            subtitle="FEATURE 04"
                            title="Asset Hub (DAM)"
                            description="The infinite vault. Search, discover, and deploy brand assets in seconds. Our AI-powered search highlights meanings, not just filenames, across massive libraries."
                            image="/landing/asset_hub.png"
                            tags={['AI Indexing', 'Version Control', 'Bulk CDN']}
                            reverse
                        />

                        <FeatureShowcase
                            id="brandops"
                            subtitle="FEATURE 05"
                            title="BrandOps Engine"
                            description="Automated consistency. Build rule-based workflows that automatically check and fix brand alignment. Your global ecosystem is protected by unbreakable digital logic."
                            image="/landing/brandops_engine.png"
                            tags={['Rule Logic', 'Auto-Audit', 'Compliance']}
                        />

                        <FeatureShowcase
                            id="community"
                            subtitle="FEATURE 06"
                            title="The Community"
                            description="Design collaboration without borders. Connect your teams with our Creator Pool, providing floating profiles and real-time collaboration metrics for maximum synergy."
                            image="/landing/community.png"
                            tags={['Creator Pool', 'Mentorship', 'Impact Scores']}
                            reverse
                        />

                        <FeatureShowcase
                            id="bam"
                            subtitle="FEATURE 07"
                            title="BAM Integrity"
                            description="Unbreakable integrity. Brand Asset Management meets relationship architecture. Map every asset to its guideline, ensuring total ecosystem coherence."
                            image="/landing/bam.png"
                            tags={['Asset Maps', 'Relational DAM', 'Core Sync']}
                        />
                    </div>
                    {/* Horizontal Intersection Line */}
                    <div className="w-full h-px bg-[#373737] relative z-20" />
                </div>

                {/* INTEGRATIONS - THE ECOSYSTEM */}
                <section id="integrations" className="py-60 px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-accent-indigo/10 blur-[200px] pointer-events-none" />
                    <div className="max-w-6xl mx-auto rounded-[4rem] border border-white/5 bg-white/5 backdrop-blur-3xl p-20 md:p-32 text-center relative">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 mb-10">
                            <Box size={14} className="text-accent-indigo" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">The Ecosystem</span>
                        </div>
                        <h2 className="text-5xl md:text-8xl font-black tracking-tighter italic uppercase mb-12">Connect Your Node</h2>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-12 mb-20">
                            {['Figma', 'Adobe', 'Slack', 'Linear', 'Github', 'Notion'].map((tool) => (
                                <div key={tool} className="aspect-square rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center group hover:bg-accent-indigo/10 transition-all duration-500">
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-100 transition-opacity">{tool}</span>
                                </div>
                            ))}
                        </div>
                        <MagneticButton>
                            <Button className="h-20 px-12 rounded-full bg-white text-black hover:bg-zinc-200 text-sm font-black uppercase tracking-widest transition-all">
                                Explore Integrations
                            </Button>
                        </MagneticButton>
                    </div>
                </section>

                {/* PRICING - THE OFFERING */}
                <section id="pricing" className="py-40 px-6 max-w-7xl mx-auto">
                    <div className="text-center mb-32">
                        <TextReveal text="SIMPLE. TRANSPARENT. UNBREAKABLE." />
                        <h2 className="text-5xl md:text-8xl font-black mt-6 tracking-tighter italic uppercase">Pricing Models</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: 'Standard', price: '49', features: ['5 Brands', 'Basic DAM', 'Community Access'] },
                            { name: 'Nexus', price: '149', features: ['Unlimited Brands', 'Advanced AI Search', 'Custom Workflows', 'Private Pool'], popular: true },
                            { name: 'Architect', price: 'Custom', features: ['Global Infrastructure', 'Full API Access', 'Design Consultation', 'Dedicated Node'] }
                        ].map((plan) => (
                            <TiltCard key={plan.name}>
                                <div className={cn(
                                    "h-[600px] w-full rounded-[3.5rem] p-12 border flex flex-col justify-between transition-all duration-500",
                                    plan.popular ? "bg-white text-black border-white" : "bg-zinc-950 text-white border-white/10"
                                )}>
                                    <div>
                                        <h4 className="text-[11px] font-bold uppercase tracking-[0.4em] opacity-40 mb-10">{plan.name}</h4>
                                        <div className="mb-12">
                                            <span className="text-6xl font-black tracking-tighter uppercase italic">{plan.price === 'Custom' ? '' : '$'}{plan.price}</span>
                                            {plan.price !== 'Custom' && <span className="text-sm font-bold opacity-40 ml-2">/MO</span>}
                                        </div>
                                        <ul className="space-y-6">
                                            {plan.features.map(f => (
                                                <li key={f} className="flex items-center space-x-3 text-sm font-medium">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", plan.popular ? "bg-black" : "bg-accent-indigo")} />
                                                    <span>{f}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <Button className={cn(
                                        "h-14 w-full rounded-full font-black uppercase text-xs tracking-widest transition-all",
                                        plan.popular ? "bg-black text-white hover:bg-zinc-800" : "bg-white text-black hover:bg-zinc-200"
                                    )}>
                                        Get Started
                                    </Button>
                                </div>
                            </TiltCard>
                        ))}
                    </div>
                </section>

                {/* FAQ - THE CLEARITY */}
                <section id="faq" className="py-40 px-6 max-w-4xl mx-auto">
                    <h2 className="text-4xl font-black tracking-tighter mb-20 italic uppercase">Frequently Asked</h2>
                    <div className="space-y-4">
                        <FAQItem
                            question="How does the Asset Vault work?"
                            answer="Our Asset Vault uses neural tagging to automatically organize your creative files based on your brand guidelines. It connects directly to your Brandbooks for 100% compliance."
                        />
                        <FAQItem
                            question="Can I invite external creators?"
                            answer="Yes. The Nexus plan allows you to invite external creators into specific workspaces with granular permission controls and secure asset sharing."
                        />
                        <FAQItem
                            question="Do you offer custom onboarding?"
                            answer="The Architect plan includes a dedicated design consultant who will help you map your existing brand strategy into the Brivio ecosystem."
                        />
                    </div>
                </section>

                <section id="testimonials" className="py-60 px-6 relative">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row items-end justify-between mb-32 gap-10">
                            <div className="max-w-2xl">
                                <span className="text-[10px] font-black tracking-[0.6em] text-accent-indigo uppercase">The Spotlight</span>
                                <h2 className="text-5xl md:text-[10rem] font-black tracking-tighter uppercase italic leading-[0.8] mt-6">Voices of Power</h2>
                            </div>
                            <p className="text-xl text-text-secondary max-w-sm font-medium leading-relaxed italic">
                                &quot;The defining platform for brand architects who refuse to settle for anything less than perfection.&quot;
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                            {[
                                { name: "MARCUS CHASE", role: "CD @ NEXUS", text: "Brivio isn't just a tool; it's a nervous system for our global brand. We moved from chaos to surgical precision in weeks." },
                                { name: "ELARA VANCE", role: "DESIGN LEAD @ AURA", text: "The first platform that actually understands how brand rules should work in the digital age. Absolutely unbreakable." }
                            ].map((t) => (
                                <div key={t.name} className="space-y-10 group">
                                    <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                                        <motion.div
                                            initial={{ x: '-100%' }}
                                            whileInView={{ x: '100%' }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 bg-accent-indigo"
                                        />
                                    </div>
                                    <p className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-tight group-hover:text-accent-indigo transition-colors duration-500">
                                        &quot;{t.text}&quot;
                                    </p>
                                    <div className="flex items-center space-x-6">
                                        <div className="w-12 h-12 rounded-full bg-accent-indigo/20 flex items-center justify-center font-black italic text-accent-indigo text-xs">
                                            {t.name[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black tracking-widest">{t.name}</h4>
                                            <p className="text-[10px] font-medium opacity-40 mt-1 uppercase tracking-widest">{t.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="faq" className="py-60 px-6 relative bg-zinc-950/50">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-32">
                            <span className="text-[10px] font-black tracking-[0.6em] text-accent-indigo uppercase">Support</span>
                            <h2 className="text-5xl md:text-8xl font-black mt-6 tracking-tighter italic uppercase">Intelligence</h2>
                        </div>
                        <div className="space-y-4">
                            <FAQItem
                                question="Is Brivio a replacement for Figma?"
                                answer="No. Brivio is the infrastructure that surrounds your design tools. While Figma is for creation, Brivio is for governance, management, and global scale."
                            />
                            <FAQItem
                                question="How does the AI search work?"
                                answer="Our neural engine indexes assets based on semantic meaning and brand tokens, not just filenames. It understands context, color theory, and usage guidelines."
                            />
                            <FAQItem
                                question="Can we self-host Brivio?"
                                answer="Architect plan customers can deploy dedicated nodes on their own infrastructure for maximum security and data sovereignty."
                            />
                        </div>
                    </div>
                </section>

                <section className="py-60 px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-accent-indigo/10 blur-[200px] pointer-events-none" />
                    <div className="max-w-6xl mx-auto rounded-[4rem] border border-white/5 bg-white/5 backdrop-blur-3xl p-20 md:p-32 text-center relative">
                        <h2 className="text-6xl md:text-[12rem] font-black tracking-tighter italic uppercase mb-12 leading-[0.8]">Master Your <br /> Universe.</h2>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-10">
                            <MagneticButton>
                                <Button className="h-24 px-16 rounded-full bg-white text-black hover:bg-zinc-200 text-lg font-black uppercase tracking-widest transition-all">
                                    Start Building
                                </Button>
                            </MagneticButton>
                            <Link href="#" className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/40 hover:text-white transition-colors">Request a Demo</Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER - THE GROUND LAYER */}
            <footer className="relative z-10 bg-black pt-40 pb-20 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-20">
                    <div className="col-span-2">
                        <h3 className="text-4xl font-black tracking-tighter italic mb-10">BRIVIO.</h3>
                        <p className="text-text-secondary max-w-xs leading-relaxed font-medium">
                            Redefining the standard of brand infrastructure for the modern age.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-indigo mb-10">System</h4>
                        <ul className="space-y-4 text-text-secondary text-sm font-bold">
                            <li><Link href="#" className="hover:text-white transition-colors">Dashboard</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Guidelines</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Vault</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-indigo mb-10">Network</h4>
                        <ul className="space-y-4 text-text-secondary text-sm font-bold">
                            <li><Link href="#" className="hover:text-white transition-colors">Creators</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Proposals</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Library</Link></li>
                        </ul>
                    </div>
                    <div className="col-span-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.4em] text-accent-indigo mb-10">Updates</h4>
                        <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
                            <input type="text" placeholder="Email Address" className="bg-transparent border-none outline-none px-6 py-3 text-sm flex-1 font-bold" />
                            <Button size="sm" className="bg-white text-black hover:bg-zinc-200 rounded-full font-bold px-6">Join</Button>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-40 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[9px] font-bold text-white/20 uppercase tracking-[0.5em]">
                    <p>&copy; 2026 BRIVIO CORE. ALL RIGHTS RESERVED.</p>
                    <div className="flex space-x-10 mt-6 md:mt-0">
                        <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
