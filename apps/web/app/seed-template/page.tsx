"use client"
import { saveDocumentTemplate } from "@/app/actions/financial-documents"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"

export default function SeedPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    const seed = async () => {
        setStatus('loading')
        try {
            const template = {
                blocks: [
                    {
                        "id": "1",
                        "type": "header",
                        "data": {
                            "theme": "modern",
                            "from_label": "Factura para",
                            "from_info": "Maria Eduarda",
                            "from_address": "Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola",
                            "company_address": "Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola",
                            "doc_num": "FR-2024-00015",
                            "doc_date": "01/12/2024",
                            "doc_account": "123 456",
                            "total_display": "AOA 17.550.100"
                        }
                    },
                    {
                        "id": "2",
                        "type": "items",
                        "data": {
                            "theme": "modern",
                            "items": [
                                {
                                    "description": "Nome do serviço",
                                    "details": "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão",
                                    "quantity": 2,
                                    "price": 320000,
                                    "total_display": "AOA 640.000"
                                },
                                {
                                    "description": "Nome do serviço",
                                    "details": "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão",
                                    "quantity": 2,
                                    "price": 320000,
                                    "total_display": "AOA 640.000"
                                },
                                {
                                    "description": "Nome do serviço",
                                    "details": "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão",
                                    "quantity": 2,
                                    "price": 320000,
                                    "total_display": "AOA 640.000"
                                },
                                {
                                    "description": "Nome do serviço",
                                    "details": "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão",
                                    "quantity": 2,
                                    "price": 320000,
                                    "total_display": "AOA 640.000"
                                }
                            ]
                        }
                    },
                    {
                        "id": "3",
                        "type": "payment",
                        "data": {
                            "theme": "modern",
                            "terms": "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão",
                            "bank_holder": "Arkhus LDA",
                            "bank_account": "0145 4125 2145 1",
                            "bank_iban": "0145 4125 2145 1475 5123 1",
                            "subtotal_display": "Arkhus LDA",
                            "tax_display": "14%",
                            "discount_display": "10%",
                            "signature_name": "Maria Eduarta",
                            "signature_role": "CEO e Gestora de contas",
                            "footer_message": "Obrigado pela sua preferência"
                        }
                    }
                ],
                settings: {
                    primaryColor: '#2A4DD8',
                    secondaryColor: '#70ff30',
                    currency: 'AOA'
                }
            }
            const result = await saveDocumentTemplate("Arkhus Modern", "invoice", template)
            if (result.success) {
                setStatus('success')
            } else {
                setStatus('error')
                console.error(result.error)
            }
        } catch (error) {
            setStatus('error')
            console.error(error)
        }
    }

    return (
        <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center font-inter">
            <div className="bg-[#1A1A1A] p-8 rounded-2xl border border-white/5 shadow-2xl max-w-md w-full text-center">
                <h1 className="text-xl font-black text-white mb-2 italic">BRIVIO<span className="text-[#EF0050]">SEEDER</span></h1>
                <p className="text-gray-400 text-sm mb-8">Clique no botão abaixo para instalar o template Arkhus Modern no seu sistema.</p>

                {status === 'idle' && (
                    <Button onClick={seed} className="w-full bg-[#EF0050] hover:bg-[#EF0050]/90 text-white font-black uppercase tracking-widest py-6 rounded-xl">
                        Instalar Template
                    </Button>
                )}

                {status === 'loading' && (
                    <Button disabled className="w-full bg-white/5 text-gray-500 font-black uppercase tracking-widest py-6 rounded-xl">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Instalando...
                    </Button>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <p className="text-[#10b981] font-bold">Template instalado com sucesso!</p>
                        <Button variant="ghost" onClick={() => window.location.href = '/projects'} className="text-gray-400 hover:text-white text-xs uppercase tracking-widest underline decoration-dotted">
                            Voltar para Projetos
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-red-500 font-bold">
                        Ocorreu um erro ao instalar o template. Verifique o console.
                        <Button onClick={seed} className="mt-4 w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 py-2 rounded-lg">Tentar Novamente</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
