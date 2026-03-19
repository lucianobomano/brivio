"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation" // Added for redirection
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Upload, Plus, X, LayoutTemplate } from "lucide-react"
import { cn } from "@/lib/utils"

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { createBrand } from "@/app/actions/brands"
import { getBrandbookTemplates } from "@/app/actions/brandbook-templates"

// --- Constants ---
const INITIAL_PAGES = [
    "Visão geral", "DNA da marca", "História da marca", "Logo", "Cores",
    "Tipografia", "Iconografia", "Imagens & Fotografia", "Ilustração", "Grid & Layouts",
    "Elementos gráficos", "Aplicações digitais", "Aplicações offline", "Motion design",
    "Personalidade da marca", "Tom de voz", "Linguagem preferencial",
    "Slogans e taglines", "Naming system", "Storytelling base",
    "Copywriting guidelines", "Identidade sonora", "Identidade olfativa",
    "Identidade tátil", "Identidade gustativa", "Experiência multimodal"
]

interface CreateBrandModalProps {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    userName?: string
    brandsCount?: number
}

export function CreateBrandModal({ children, open, onOpenChange, userName = "Criativo", brandsCount = 0 }: CreateBrandModalProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [step, setStep] = useState(0)
    const [formData, setFormData] = useState({
        name: "",
        pages: [] as string[],
        logo: null as File | null,
        templateId: null as string | null
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [createdBrandId, setCreatedBrandId] = useState<string | null>(null) // Store ID for redirection

    // Controlled vs Uncontrolled state
    const isOpen = open !== undefined ? open : internalOpen
    const setIsOpen = (val: boolean) => {
        if (onOpenChange) onOpenChange(val)
        else setInternalOpen(val)

        if (!val) {
            // Reset state when closing
            setTimeout(() => {
                setStep(0)
                setFormData({ name: "", pages: [], logo: null, templateId: null })
                setError(null)
                setCreatedBrandId(null)
            }, 300)
        }
    }

    const nextStep = () => setStep(s => s + 1)
    const prevStep = () => setStep(s => s - 1)

    const handleCreate = async () => {
        setIsSubmitting(true)
        setError(null)

        try {
            const data = new FormData()
            data.append("name", formData.name)
            data.append("pages", JSON.stringify(formData.pages))
            if (formData.templateId) {
                data.append("templateId", formData.templateId)
            }
            if (formData.logo) {
                // Note: The server action needs to be updated to handle file upload
                // For now we send it, but existing action might ignore it
                data.append("logo", formData.logo)
            }

            const result = await createBrand(data)

            if (result.success && result.brandId) {
                setCreatedBrandId(result.brandId)
                setStep(5) // Go to Success Step instead of closing
            } else {
                setError(result.error || "Erro ao criar marca.")
            }
        } catch (e) {
            setError("Erro inesperado.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="w-screen h-screen max-w-none m-0 p-0 rounded-none bg-bg-0 border-none flex flex-col items-center justify-center overflow-hidden focus:outline-none">

                {/* Header Navigation - Hide during Step 5 (Success) for immersion */}
                {step !== 5 && (
                    <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-50 text-text-tertiary">
                        <span className="text-xl font-light">Brivio°</span>
                        <span className="text-sm uppercase tracking-widest">Dashboard</span>
                        <button onClick={() => setIsOpen(false)} className="absolute top-8 right-8 p-2 text-text-tertiary hover:text-text-primary transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <Step0_Intro key="step0" onNext={nextStep} />
                    )}
                    {step === 1 && (
                        <Step1_Name key="step1" name={formData.name} onChange={n => setFormData({ ...formData, name: n })} onNext={nextStep} />
                    )}
                    {step === 2 && (
                        <Step2_Confirm key="step2" onNext={nextStep} onCancel={() => setIsOpen(false)} />
                    )}
                    {step === 3 && (
                        <Step3_Pages key="step3" selected={formData.pages} onToggle={(page) => {
                            const newPages = formData.pages.includes(page)
                                ? formData.pages.filter(p => p !== page)
                                : [...formData.pages, page]
                            setFormData({ ...formData, pages: newPages })
                        }} onNext={nextStep} onBack={prevStep} />
                    )}
                    {step === 4 && (
                        <Step4_Logo key="step4"
                            file={formData.logo}
                            onFileSelect={(f) => setFormData({ ...formData, logo: f })}
                            onSubmit={handleCreate}
                            onChooseTemplate={() => setStep(6)}
                            onBack={prevStep}
                            isSubmitting={isSubmitting}
                        />
                    )}
                    {step === 6 && (
                        <Step6_Templates key="step6"
                            selectedTemplateId={formData.templateId}
                            onSelect={(id) => setFormData({ ...formData, templateId: id })}
                            onSubmit={handleCreate}
                            onBack={() => setStep(4)}
                            isSubmitting={isSubmitting}
                        />
                    )}
                    {step === 5 && (
                        <Step5_Success key="step5"
                            userName={userName}
                            isFirstProject={brandsCount === 0}
                            brandId={createdBrandId!}
                        />
                    )}
                </AnimatePresence>

                {error && step !== 5 && (
                    <div className="absolute bottom-8 text-red-500 font-medium">
                        {error}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// --- Step Components ---

function Step0_Intro({ onNext }: { onNext: () => void }) {
    const text = "Olá, a Brivio° tem muito gosto em ter-te aqui! 👋";
    const characters = Array.from(text);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center text-center gap-24"
        >
            <h2 className="text-2xl md:text-3xl text-text-secondary font-light max-w-4xl leading-relaxed text-center font-[family-name:var(--font-geist-sans)]">
                {characters.map((char, index) => (
                    <motion.span
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.03, delay: index * 0.03 }}
                    >
                        {char}
                    </motion.span>
                ))}
            </h2>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="relative group cursor-pointer"
            >
                {/* Pulse Waves Loop */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border border-[#FF0054]"
                        initial={{ scale: 1, opacity: 0.2 }}
                        animate={{ scale: 1.5, opacity: 0 }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 1,
                            ease: "easeInOut"
                        }}
                    />
                ))}

                <button
                    onClick={onNext}
                    className="relative z-10 w-32 h-32 rounded-full border border-[#FF0054] text-[#FF0054] flex items-center justify-center text-xl font-light hover:bg-[#FF0054] hover:text-white transition-all duration-300 bg-bg-0"
                >
                    Olá
                </button>
            </motion.div>
        </motion.div>
    )
}

function Step1_Name({ name, onChange, onNext }: { name: string, onChange: (v: string) => void, onNext: () => void }) {
    const [phase, setPhase] = useState<'intro' | 'question' | 'input'>('intro') // Sequence state

    useEffect(() => {
        // Phase 1: Intro Text "Vamos começar pelo nome"
        // Typing: ~0.7s. Wait: 1s.
        const timer1 = setTimeout(() => {
            setPhase('question')
        }, 1700)

        // Phase 2: Question Text "Como vai chamar o seu projecto?"
        // Typing: ~1s. Read: 1s.
        const timer2 = setTimeout(() => {
            setPhase('input')
        }, 1700 + 500 + 2000) // +500ms exit/enter + 2s (typing+read)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
        }
    }, [])

    return (
        <div className="flex flex-col items-center text-center gap-16 w-full max-w-4xl min-h-[300px] justify-center relative">

            {/* Phase 1 & 2: Texts */}
            <AnimatePresence mode="wait">
                {phase === 'intro' && (
                    <motion.h2
                        key="intro-text"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        className="text-2xl md:text-3xl text-text-secondary font-light absolute"
                    >
                        {Array.from("Vamos começar pelo nome").map((char, index) => (
                            <motion.span
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.03, delay: index * 0.03 }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </motion.span>
                        ))}
                    </motion.h2>
                )}

                {phase === 'question' && (
                    <motion.h2
                        key="question-text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.5 } }}
                        className="text-2xl md:text-3xl text-text-secondary font-light absolute"
                    >
                        {Array.from("Como vai chamar o seu projecto?").map((char, index) => (
                            <motion.span
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.03, delay: index * 0.03 }}
                            >
                                {char === " " ? "\u00A0" : char}
                            </motion.span>
                        ))}
                    </motion.h2>
                )}
            </AnimatePresence>

            {/* Phase 3: Input & Button */}
            {phase === 'input' && (
                <div className="flex items-center w-full max-w-xl gap-6 overflow-hidden p-12"> {/* Increased padding related to ripple potentially clipping if overflow hidden */}

                    {/* Input enters from RIGHT (moved to Left position) */}
                    <motion.input
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        autoFocus
                        value={name}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="Nome da marca"
                        className="flex-1 bg-transparent border-b border-[#FF0054] py-4 text-2xl text-text-primary placeholder:text-text-tertiary focus:outline-none text-center"
                        onKeyDown={(e) => e.key === 'Enter' && name && onNext()}
                    />

                    {/* Button enters from LEFT (moved to Right position) */}
                    <motion.div
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                        className="relative group shrink-0"
                    >
                        {/* Ripple Effect for "Vamos" button */}
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="absolute inset-0 rounded-full border border-[#FF0054]"
                                initial={{ scale: 1, opacity: 0.2 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: i * 1,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}

                        <button
                            onClick={onNext}
                            disabled={!name}
                            className="relative z-10 w-24 h-24 rounded-full border border-[#FF0054]/50 bg-bg-0 text-[#FF0054] flex items-center justify-center text-lg font-light hover:bg-[#FF0054] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Vamos!
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

function Step2_Confirm({ onNext, onCancel }: { onNext: () => void, onCancel: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center gap-12"
        >
            <h2 className="text-2xl md:text-3xl text-text-secondary font-light max-w-2xl leading-relaxed">
                Este é um nome excelente. O próximo passo é adaptar para uma apresentação.
            </h2>

            <div className="flex gap-6">
                <button
                    onClick={onNext}
                    className="px-8 py-3 rounded-full border border-[#FF0054] text-[#FF0054] hover:bg-[#FF0054] hover:text-white transition-all text-sm uppercase tracking-wide"
                >
                    Proceder com a criação
                </button>
                <button
                    onClick={onCancel}
                    className="px-8 py-3 rounded-full border border-bg-3 text-text-secondary hover:border-text-secondary hover:text-text-primary transition-all text-sm uppercase tracking-wide"
                >
                    Só quero dar um rolê
                </button>
            </div>
        </motion.div>
    )
}

function Step3_Pages({ selected, onToggle, onNext, onBack }: { selected: string[], onToggle: (p: string) => void, onNext: () => void, onBack: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center w-full max-w-5xl h-full pt-32 pb-24"
        >
            <div className="text-center mb-12 space-y-2">
                <h2 className="text-3xl text-text-tertiary font-light">
                    Selecione suas páginas iniciais.
                </h2>
                <p className="text-xl text-text-secondary font-light">
                    Você pode criar, editar e excluir páginas após o processo de integração.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 w-full scrollbar-hide">
                <div className="flex flex-wrap justify-center gap-3">
                    {INITIAL_PAGES.map(page => {
                        const isSelected = selected.includes(page)
                        return (
                            <button
                                key={page}
                                onClick={() => onToggle(page)}
                                className={cn(
                                    "px-6 py-2 rounded-full border transition-all duration-300 text-sm",
                                    isSelected
                                        ? "border-[#FF0054] bg-[#FF0054]/10 text-[#FF0054]"
                                        : "border-bg-3 text-text-tertiary hover:border-text-secondary hover:text-text-secondary"
                                )}
                            >
                                {page}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex items-center justify-between w-full max-w-4xl mt-8 px-12">
                <button onClick={onBack} className="text-[#FF0054] text-sm uppercase tracking-widest hover:text-text-primary transition-colors">
                    Voltar
                </button>
                <button
                    onClick={onNext}
                    className="w-16 h-16 rounded-full bg-[#FF0054] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,0,84,0.3)]"
                >
                    <span className="text-xs">Avançar</span>
                </button>
            </div>
        </motion.div>
    )
}

function Step4_Logo({ file, onFileSelect, onSubmit, onChooseTemplate, onBack, isSubmitting }: { file: File | null, onFileSelect: (f: File) => void, onSubmit: () => void, onChooseTemplate: () => void, onBack: () => void, isSubmitting: boolean }) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center text-center gap-12 w-full max-w-4xl"
        >
            <div className="space-y-2">
                <h2 className="text-3xl text-text-tertiary font-light">
                    Deixe que o Brivio° gere a seção "Logotipo" para si.
                </h2>
                <p className="text-3xl text-text-tertiary font-light">
                    Envie o logotipo da sua marca™.
                </p>
            </div>

            <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-2xl border border-dashed border-[#FF0054]/30 rounded-lg p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-[#FF0054]/5 transition-colors group h-64"
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
                />

                {file ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-20 h-20 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                            <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-text-primary font-medium">{file.name}</span>
                        <span className="text-text-secondary text-sm">Clique para alterar</span>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 rounded-full border border-[#FF0054] text-[#FF0054] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Plus className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-text-primary font-medium">Carregar arquivo</h3>
                            <p className="text-text-secondary text-sm">Arraste e solte o arquivo ou navegue</p>
                        </div>
                    </>
                )}
            </div>

            <div className="flex flex-col items-center gap-4">
                <button
                    onClick={onChooseTemplate}
                    className="flex items-center gap-2 text-text-secondary hover:text-[#FF0054] transition-colors text-sm uppercase tracking-widest font-medium"
                >
                    <LayoutTemplate className="w-4 h-4" />
                    Ou escolha um template pronto
                </button>
            </div>

            <div className="flex items-center justify-between w-full mt-8 px-4">
                <button onClick={onBack} disabled={isSubmitting} className="text-[#FF0054] text-sm uppercase tracking-widest hover:text-text-primary transition-colors disabled:opacity-50">
                    Voltar
                </button>
                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="w-20 h-20 rounded-full bg-[#FF0054] text-white flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,0,84,0.3)] disabled:opacity-50 disabled:scale-100"
                >
                    {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : <span className="text-xs font-semibold">Finalizar</span>}
                </button>
            </div>
        </motion.div>
    )
}

function Step5_Success({ userName, isFirstProject, brandId }: { userName: string, isFirstProject: boolean, brandId: string }) {
    const router = useRouter()
    const [phase, setPhase] = useState(0)

    // Sequence timings
    useEffect(() => {
        const timings = [
            4000, // Phase 0: Message 1 (Congratulation) & 2 (You created...)
            4000, // Phase 1: "Só mais um pouco"
            6000, // Phase 2: "Estamos a arrumar a casa..."
            1500, // Phase 3: "Finalizamos!"
            2000, // Phase 4: "O espaço é todo seu."
            // Phase 5: Button (Final)
        ]

        let currentTimeout: NodeJS.Timeout

        const runSequence = async () => {
            // We use a simple chain logic
            const next = (p: number) => {
                if (p >= timings.length) return
                currentTimeout = setTimeout(() => {
                    setPhase(p + 1)
                    next(p + 1)
                }, timings[p])
            }
            next(0)
        }

        runSequence()

        return () => clearTimeout(currentTimeout)
    }, [])

    const handleStart = () => {
        router.push(`/brand/${brandId}/brandbook`)
    }

    // Texts based on specs
    const greetingText = isFirstProject
        ? `Parabéns ${userName} 🥳🎉`
        : `É isso humano criativo. Você está imparável! 💪🏽`

    const subText = isFirstProject
        ? "Você acabou de criar o seu primeiro projecto de gestão de marca"
        : "Você acabou de criar mais um projecto de gestão de marca!"

    return (
        <div className="flex flex-col items-center justify-center text-center gap-12 w-full max-w-4xl min-h-[400px]">
            <AnimatePresence mode="wait">
                {phase === 0 && (
                    <motion.div
                        key="phase0"
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <h2 className="text-3xl md:text-5xl text-text-primary font-light">
                            {greetingText}
                        </h2>
                        <p className="text-xl text-text-secondary">
                            {subText}
                        </p>
                    </motion.div>
                )}

                {phase === 1 && (
                    <motion.h2
                        key="phase1"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-2xl md:text-4xl text-text-secondary font-light"
                    >
                        Só mais um pouco...
                    </motion.h2>
                )}

                {phase === 2 && (
                    <motion.h2
                        key="phase2"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-2xl md:text-4xl text-text-secondary font-light"
                    >
                        Estamos a arrumar a casa para receber-te...
                    </motion.h2>
                )}

                {phase === 3 && (
                    <motion.h2
                        key="phase3"
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}
                        className="text-3xl md:text-5xl text-[#FF0054] font-medium"
                    >
                        Finalizamos!
                    </motion.h2>
                )}

                {phase === 4 && (
                    <motion.h2
                        key="phase4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-2xl md:text-4xl text-text-primary font-light"
                    >
                        O espaço é todo seu.
                    </motion.h2>
                )}

                {phase >= 5 && (
                    <motion.div
                        key="phase5"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group cursor-pointer"
                    >
                        {/* Pulse Waves Loop - same style as Step 0 */}
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="absolute inset-0 rounded-full border border-[#FF0054]"
                                initial={{ scale: 1, opacity: 0.2 }}
                                animate={{ scale: 1.5, opacity: 0 }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: i * 1,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}

                        <button
                            onClick={handleStart}
                            className="relative z-10 w-40 h-40 rounded-full border border-[#FF0054] text-[#FF0054] flex items-center justify-center text-xl font-light hover:bg-[#FF0054] hover:text-white transition-all duration-300 bg-bg-0 text-center px-4"
                        >
                            Vamos a isso!
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function Step6_Templates({ onSelect, onSubmit, onBack, isSubmitting, selectedTemplateId }: { onSelect: (id: string) => void, onSubmit: () => void, onBack: () => void, isSubmitting: boolean, selectedTemplateId: string | null }) {
    const [activeTab, setActiveTab] = useState<'public' | 'mine'>('public')
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getBrandbookTemplates().then(res => {
            if (res.success && res.templates) {
                setTemplates(res.templates)
            }
            setLoading(false)
        })
    }, [])

    const filteredTemplates = templates.filter(t => {
        if (activeTab === 'public') return t.is_public
        return !t.is_public
    })

    const displayTemplates = filteredTemplates.length > 0 ? filteredTemplates : []

    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
            className="flex flex-col items-center w-full max-w-6xl h-full pt-32 pb-12 px-6"
        >
            <div className="text-center mb-10 space-y-3">
                <h2 className="text-3xl text-text-primary font-light">
                    Escolha um Template Profissional
                </h2>
                <p className="text-lg text-text-secondary font-light">
                    Pule a configuração manual e comece com um layout pronto.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-10 bg-bg-2 p-1.5 rounded-2xl border border-white/5">
                <button
                    onClick={() => setActiveTab('public')}
                    className={cn(
                        "px-8 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-wider",
                        activeTab === 'public' ? "bg-[#FF0054] text-white shadow-lg shadow-[#FF0054]/20" : "text-text-tertiary hover:text-text-primary"
                    )}
                >
                    Templates Públicos
                </button>
                <button
                    onClick={() => setActiveTab('mine')}
                    className={cn(
                        "px-8 py-2.5 rounded-xl text-sm font-bold transition-all uppercase tracking-wider",
                        activeTab === 'mine' ? "bg-[#FF0054] text-white shadow-lg shadow-[#FF0054]/20" : "text-text-tertiary hover:text-text-primary"
                    )}
                >
                    Meus Templates
                </button>
            </div>

            {/* Grid */}
            <div className="flex-1 w-full overflow-y-auto pr-2 scrollbar-hide mb-10 min-h-0">
                {loading ? (
                    <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-[#FF0054]" />
                        <span className="text-text-tertiary animate-pulse uppercase tracking-widest text-xs font-bold">Carregando Templates...</span>
                    </div>
                ) : displayTemplates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-text-tertiary space-y-6 bg-bg-1/50 rounded-3xl border border-dashed border-white/10">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                            <LayoutTemplate className="w-10 h-10 opacity-30" />
                        </div>
                        <p className="font-medium">Nenhum template encontrado nesta categoria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {displayTemplates.map(template => (
                            <div
                                key={template.id}
                                onClick={() => onSelect(template.id)}
                                className={cn(
                                    "group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-500",
                                    selectedTemplateId === template.id
                                        ? "ring-4 ring-[#FF0054] scale-[1.02]"
                                        : "hover:scale-[1.02]"
                                )}
                            >
                                {/* Aspect Ratio Box */}
                                <div className="aspect-[16/10] bg-bg-2 border border-white/5 rounded-3xl overflow-hidden relative">
                                    {template.thumbnail_url ? (
                                        <img src={template.thumbnail_url} alt={template.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-bg-2 to-bg-3 relative overflow-hidden">
                                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FF0054] via-transparent to-transparent" />
                                            <span className="text-5xl font-black text-[#FF0054]/10 select-none">{template.name[0]}</span>
                                            <LayoutTemplate className="w-12 h-12 text-white/5 absolute" />
                                        </div>
                                    )}

                                    {/* Selection Checkmark */}
                                    <AnimatePresence>
                                        {selectedTemplateId === template.id && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.5 }}
                                                className="absolute top-4 right-4 w-8 h-8 bg-[#FF0054] rounded-full flex items-center justify-center shadow-xl border-2 border-white z-10"
                                            >
                                                <Plus className="w-5 h-5 text-white rotate-45" style={{ transform: 'none' }} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Info Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                        <h3 className="text-white font-bold text-lg mb-1">{template.name}</h3>
                                        <p className="text-white/70 text-sm line-clamp-2">{template.description || 'Sem descrição.'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between w-full max-w-4xl px-4 mt-auto">
                <button onClick={onBack} disabled={isSubmitting} className="text-[#FF0054] text-sm font-black uppercase tracking-[0.2em] hover:text-white transition-colors disabled:opacity-50">
                    Voltar
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting || !selectedTemplateId}
                        className="h-16 px-10 rounded-full bg-[#FF0054] text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,0,84,0.4)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none gap-4 group"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : (
                            <>
                                <span className="font-black uppercase tracking-[0.1em] text-sm">Criar com Template</span>
                                <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
