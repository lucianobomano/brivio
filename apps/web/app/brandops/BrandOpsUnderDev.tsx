"use client"

import { motion } from "framer-motion"
import { Construction, ArrowLeft, Layers, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function BrandOpsUnderDev() {
    return (
        <div className="min-h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-bg-0">
            {/* Ambient Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FF0054]/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#311C99]/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 max-w-4xl w-full text-center"
            >
                {/* Icon Section */}
                <motion.div
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.2
                    }}
                    className="w-24 h-24 bg-gradient-to-br from-[#FF0054] via-[#88007F] to-[#311C99] rounded-3xl flex items-center justify-center mx-auto mb-12 shadow-[0_20px_50px_rgba(255,0,84,0.3)]"
                >
                    <Layers className="w-12 h-12 text-white" />
                </motion.div>

                {/* Main Heading */}
                <div className="space-y-4 mb-12">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF0054]/10 border border-[#FF0054]/20 mb-6"
                    >
                        <Construction className="w-4 h-4 text-[#FF0054]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF0054]">System Update in Progress</span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight text-text-primary leading-tight uppercase font-tight italic">
                        Funcionalidade em <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0054] via-[#88007F] via-[#06D6A0] to-[#311C99]">desenvolvimento</span>
                    </h1>
                </div>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-text-secondary text-lg mb-12 max-w-lg mx-auto leading-relaxed"
                >
                    Our engineers are currently crafting the BrandOps Engine. This system will automate your brand governance and creative workflows with surgical precision.
                </motion.p>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link href="/dashboard" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold transition-all shadow-xl hover:scale-105 flex items-center gap-3">
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para o dashboard
                        </Button>
                    </Link>

                    <Button variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold transition-all flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-[#FF0054]" />
                        Notify Me
                    </Button>
                </motion.div>
            </motion.div>

            {/* Background HUD Elements */}
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none" />
        </div>
    )
}
