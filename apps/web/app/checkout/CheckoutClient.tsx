"use client"

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Upload, CheckCircle2, Building2, FileText, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { processSubscription } from '@/app/actions/billing' // We will create this

// We no longer need these props since we extract them directly from the URL
interface CheckoutClientProps {}

const BANKS = [
    {
        id: 'bai',
        name: 'Banco BAI',
        iban: 'AO06 0040 0000 1234 5678 9012 1',
        account: '123456789.10.001',
        holder: 'Brivio Angola Lda'
    },
    {
        id: 'bfa',
        name: 'Banco BFA',
        iban: 'AO06 0006 0000 9876 5432 1098 1',
        account: '987654321.30.001',
        holder: 'Brivio Angola Lda'
    },
    {
        id: 'atlantico',
        name: 'Millennium Atlântico',
        iban: 'AO06 0055 0000 5555 4444 3333 1',
        account: '555544443.20.001',
        holder: 'Brivio Angola Lda'
    }
]

import { CreditCard, Smartphone, Building } from 'lucide-react'

type Step = 'method' | 'transfer' | 'card' | 'reference'

export default function CheckoutClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Extract parameters directly from URL
    const initialPlan = searchParams.get('plan') || ''
    const initialTier = searchParams.get('tier') || ''
    const initialPrice = searchParams.get('price') || '0'
    const currency = searchParams.get('currency') || 'USD'
    const rate = parseFloat(searchParams.get('rate') || '1') || 1

    const [step, setStep] = useState<Step>('method')
    
    // Transfer State
    const [selectedBank, setSelectedBank] = useState(BANKS[0])
    const [file, setFile] = useState<File | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Derived State
    const numericPrice = parseFloat(initialPrice) || 0
    const priceLocal = numericPrice * rate
    
    const formattedPriceLocal = new Intl.NumberFormat(currency === 'AOA' ? 'pt-AO' : 'en-US', { 
        style: 'currency', 
        currency: currency,
        maximumFractionDigits: currency === 'AOA' ? 0 : 2
    }).format(priceLocal)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmitTransfer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!file) return

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('proof', file)
            formData.append('plan', initialPlan)
            formData.append('tier', initialTier)
            formData.append('amount_local', priceLocal.toString())
            formData.append('currency', currency)
            formData.append('bank', selectedBank.name)

            const result = await processSubscription(formData)
            
            if (result.success) {
                setIsSuccess(true)
            } else {
                alert('Erro ao submeter comprovativo: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('Erro inesperado.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
                <div className="w-20 h-20 bg-[#ff0054]/20 text-[#ff0054] rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h1 className="text-3xl font-bold mb-4">Comprovativo Recebido!</h1>
                <p className="text-[#888] max-w-md mx-auto mb-8">
                    A sua subscrição para o plano <strong>{initialPlan.toUpperCase()}</strong> está em análise. Iremos validar o pagamento e ativar as suas funcionalidades no prazo de 2 a 24 horas.
                </p>
                <button 
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                    Ir para o Dashboard
                </button>
            </div>
        )
    }

    const renderMethodSelection = () => (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 bg-[#111] border border-white/10 rounded-xl p-8 md:p-10 shadow-2xl"
        >
            <h3 className="text-xl font-bold mb-8">Escolha como pretende pagar</h3>
            
            <div className="space-y-4">
                <button 
                    onClick={() => setStep('card')}
                    className="w-full p-6 bg-black/20 border border-white/5 rounded-2xl flex items-center gap-6 hover:bg-white/5 hover:border-white/20 transition-all text-left"
                >
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-[16px]">Cartão de Crédito / Débito</h4>
                        <p className="text-[#888] text-[13px] mt-1">Visa, Mastercard. Pagamento instantâneo em Euros (€).</p>
                    </div>
                </button>

                <button 
                    onClick={() => setStep('transfer')}
                    className="w-full p-6 bg-[#ff0054]/5 border border-[#ff0054]/20 rounded-2xl flex items-center gap-6 hover:bg-[#ff0054]/10 hover:border-[#ff0054]/40 transition-all text-left relative overflow-hidden"
                >
                    <div className="w-12 h-12 bg-[#ff0054]/20 text-[#ff0054] rounded-xl flex items-center justify-center shrink-0">
                        <Building size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-[16px] text-white">Transferência Bancária</h4>
                        <p className="text-[#ff0054]/80 text-[13px] mt-1">Nativo para Angola. Pagamento em Kwanzas (AOA).</p>
                    </div>
                </button>

                <button 
                    onClick={() => setStep('reference')}
                    className="w-full p-6 bg-black/20 border border-white/5 rounded-2xl flex items-center gap-6 hover:bg-white/5 hover:border-white/20 transition-all text-left"
                >
                    <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-[16px]">Referência Multicaixa</h4>
                        <p className="text-[#888] text-[13px] mt-1">Pagamento via ATM ou Multicaixa Express em Kwanzas (AOA).</p>
                    </div>
                </button>
            </div>
        </motion.div>
    )

    const renderCard = () => (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-[#111] border border-white/10 rounded-xl p-8 md:p-10 shadow-2xl flex flex-col items-center justify-center text-center min-h-[400px]"
        >
            <CreditCard size={48} className="text-[#888] mb-6" />
            <h3 className="text-xl font-bold mb-3">Pagamento por Cartão</h3>
            <p className="text-[#888] max-w-sm mx-auto mb-8">
                A integração com Stripe está a ser finalizada. Em breve poderá pagar comodamente com o seu cartão Visa ou Mastercard.
            </p>
            <button 
                onClick={() => setStep('method')}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
                Voltar aos Métodos
            </button>
        </motion.div>
    )

    const renderReference = () => (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-[#111] border border-white/10 rounded-xl p-8 md:p-10 shadow-2xl flex flex-col items-center justify-center text-center min-h-[400px]"
        >
            <Smartphone size={48} className="text-[#888] mb-6" />
            <h3 className="text-xl font-bold mb-3">Referência Multicaixa</h3>
            <p className="text-[#888] max-w-sm mx-auto mb-8">
                A integração com Proxypay / BancAngola para geração automática de referências está a caminho.
            </p>
            <button 
                onClick={() => setStep('method')}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
                Voltar aos Métodos
            </button>
        </motion.div>
    )

    const renderTransfer = () => (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-[#111] border border-white/10 rounded-xl p-8 md:p-10 shadow-2xl"
        >
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep('method')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft size={16} />
                </button>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Building2 size={24} className="text-[#ff0054]" />
                    Dados Bancários
                </h3>
            </div>

            {/* Bank Selector */}
            <div className="grid grid-cols-3 gap-3 mb-8">
                {BANKS.map((bank) => (
                    <button
                        key={bank.id}
                        onClick={() => setSelectedBank(bank)}
                        className={cn(
                            "p-3 rounded-xl border text-[13px] font-semibold transition-all flex flex-col items-center gap-2",
                            selectedBank.id === bank.id 
                                ? "bg-[#ff0054]/10 border-[#ff0054] text-white" 
                                : "bg-black/20 border-white/5 text-[#888] hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <Building2 size={20} className={selectedBank.id === bank.id ? "text-[#ff0054]" : "text-[#555]"} />
                        {bank.name.split(' ')[1] || bank.name}
                    </button>
                ))}
            </div>

            {/* Bank Details */}
            <div className="bg-black/30 rounded-2xl p-6 mb-8 space-y-4">
                <div>
                    <span className="text-[12px] text-[#888] uppercase font-bold tracking-wider">Banco</span>
                    <p className="font-semibold text-[15px] mt-1">{selectedBank.name}</p>
                </div>
                <div>
                    <span className="text-[12px] text-[#888] uppercase font-bold tracking-wider">Titular</span>
                    <p className="font-semibold text-[15px] mt-1">{selectedBank.holder}</p>
                </div>
                <div>
                    <span className="text-[12px] text-[#888] uppercase font-bold tracking-wider">IBAN</span>
                    <p className="font-mono text-[16px] mt-1 break-all tracking-tight bg-[#222] px-3 py-1 rounded inline-block">{selectedBank.iban}</p>
                </div>
                <div>
                    <span className="text-[12px] text-[#888] uppercase font-bold tracking-wider">Nº Conta</span>
                    <p className="font-mono text-[15px] mt-1 tracking-tight">{selectedBank.account}</p>
                </div>
            </div>

            <form onSubmit={handleSubmitTransfer} className="space-y-6">
                {/* File Upload Area */}
                <div>
                    <label className="block text-[14px] font-bold mb-3">Anexar Comprovativo (Obrigatório)</label>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        className="hidden" 
                        accept="image/*,.pdf"
                        required
                    />
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors text-center",
                            file ? "border-green-500/50 bg-green-500/5" : "border-white/10 hover:border-[#ff0054]/50 bg-black/20 hover:bg-[#ff0054]/5"
                        )}
                    >
                        {file ? (
                            <>
                                <Check className="text-green-500 mb-3" size={32} />
                                <p className="font-semibold text-green-500 text-[14px]">{file.name}</p>
                                <p className="text-[#888] text-[12px] mt-1">Clique para alterar</p>
                            </>
                        ) : (
                            <>
                                <Upload className="text-[#666] mb-3" size={32} />
                                <p className="font-semibold text-[14px]">Arraste ou clique para fazer upload</p>
                                <p className="text-[#666] text-[12px] mt-1">Imagens (JPG, PNG) ou PDF até 5MB</p>
                            </>
                        )}
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={!file || isSubmitting}
                    className="w-full py-4 bg-[#ff0054] hover:bg-[#ff0054]/90 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : 'Submeter Pedido'}
                </button>
            </form>
        </motion.div>
    )

    return (
        <div className="relative min-h-screen pt-24 pb-24 px-6 overflow-hidden">
            {/* Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#ff0054]/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row gap-12">
                
                {/* Left Side: Summary & Instructions */}
                <div className="flex-1 space-y-8">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[#888] hover:text-white transition-colors text-[14px] font-medium"
                    >
                        <ArrowLeft size={16} />
                        Voltar aos Planos
                    </button>

                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">Finalize a sua subscrição</h1>
                        <p className="text-[#888] text-[15px]">
                            Está prestes a ativar o plano <strong>{initialPlan.toUpperCase()} ({initialTier})</strong>. Siga os passos indicados para completar o processo.
                        </p>
                    </div>

                    {/* Order Summary Box */}
                    <div className="bg-[#111] border border-white/10 rounded-xl p-8">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <FileText size={20} className="text-[#ff0054]" />
                            Resumo do Pedido
                        </h3>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                            <span className="text-[#888]">Plano Selecionado</span>
                            <span className="font-semibold capitalize">{initialPlan}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5">
                            <span className="text-[#888]">Valor Original (USD)</span>
                            <span className="font-semibold">${numericPrice.toFixed(2)}</span>
                        </div>
                        
                        {/* Dynamic pricing based on selected step */}
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-bold text-lg">Total a Pagar</span>
                            <span className="text-2xl font-black text-[#ff0054]">
                                {step === 'card' ? `$${numericPrice.toFixed(2)}` : formattedPriceLocal}
                            </span>
                        </div>
                        
                        {step !== 'card' && currency !== 'USD' && (
                            <p className="text-[12px] text-[#555] text-right mt-2">
                                *Câmbio aplicado (1 USD = {rate.toFixed(2)} {currency})
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Side: Dynamic Steps */}
                {step === 'method' && renderMethodSelection()}
                {step === 'transfer' && renderTransfer()}
                {step === 'card' && renderCard()}
                {step === 'reference' && renderReference()}

            </div>
        </div>
    )
}
