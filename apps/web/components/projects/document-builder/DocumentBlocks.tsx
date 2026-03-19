"use client"

import React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

export interface DocumentSettings {
    primaryColor: string
    secondaryColor: string
    currency: string
    logoUrl?: string
    theme?: 'arkhus' | 'sidebar' | 'modern-dark' | 'minimal-premium' | 'elegant-dark' | 'mono-chrome' | 'simple-red' | 'split-blue' | 'modern-orange' | 'green-highlight' | 'vertical-green' | 'modern-pink' | 'split-green'
    sidebarColor?: string
}

export interface BlockProps {
    data: BlockData
    onUpdate: (data: BlockData) => void
    isReadOnly?: boolean
    settings?: DocumentSettings
}

export interface BlockData {
    from_label?: string
    from_info?: string
    from_address?: string
    doc_num?: string
    doc_date?: string
    doc_account?: string
    total_display?: string
    items?: Array<{
        description: string
        details?: string
        quantity: number
        price: number
        total_display?: string
    }>
    subtotal_display?: string
    tax_display?: string
    discount_display?: string
    terms?: string
    bank_holder?: string
    bank_account?: string
    bank_iban?: string
    signature_name?: string
    signature_role?: string
    footer_message?: string
    footer_email?: string
    company_email?: string
    tax_amount_display?: string
    theme?: string
    to_label?: string
    to_info?: string
    to_address?: string
    tax_rate?: number
    show_pix?: boolean
    text?: string
    company_address?: string
    company_website?: string
    from_phone?: string
    to_phone?: string
    to_email?: string
    client_name?: string
}



export const DocumentHeaderBlock = ({ data, onUpdate, isReadOnly, settings }: BlockProps) => {

    return (
        <div
            className="mb-0 pt-[35px] pb-16 -mx-[35px] -mt-[35px] text-white relative h-[690px] overflow-hidden"
            style={{ backgroundColor: settings?.primaryColor || '#2A4DD8' }}
        >
            {/* Badge FACTURA - aligned with left edge of 1020px container */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[1020px]">
                <div
                    className="px-8 py-3 rounded-[2px] shadow-lg inline-block"
                    style={{ backgroundColor: settings?.secondaryColor || '#70ff30' }}
                >
                    <span className="text-xl font-black text-black uppercase tracking-[0.1em]">FACTURA</span>
                </div>
            </div>

            {/* Logo Section - aligned with right edge of 1020px container */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[1020px] text-right">
                <div className="flex items-center justify-end">
                    {settings?.logoUrl ? (
                        <Image
                            src={settings.logoUrl}
                            width={200}
                            height={48}
                            className="max-h-12 object-contain w-auto h-auto"
                            alt="Logo"
                        />
                    ) : (
                        <>
                            <span className="text-2xl font-black text-white tracking-tight">LOGOTIPO</span>
                            <span className="text-2xl font-normal text-white/90 tracking-tight">EMPRESA</span>
                        </>
                    )}
                </div>
            </div>

            {/* Sender/Company Address - aligned with right edge of 1020px container */}
            <div className="absolute top-[140px] left-1/2 -translate-x-1/2 w-[1020px] text-right">
                <textarea
                    value={data.from_info || "Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola"}
                    onChange={(e) => onUpdate({ ...data, from_info: e.target.value })}
                    className="text-[13px] leading-relaxed bg-transparent border-none outline-none resize-none text-right text-white/80 w-[300px] h-20 ml-auto"
                    placeholder="Informações do Emissor"
                    readOnly={isReadOnly}
                />
            </div>

            {/* Main Content - 1020px centered container */}
            <div className="w-[1020px] mx-auto mt-48 grid grid-cols-2 gap-8 relative z-20">
                {/* Left Column - Recipient Info */}
                <div>
                    <div className="mb-1">
                        <input
                            type="text"
                            value={data.to_label || "PARA:"}
                            onChange={(e) => onUpdate({ ...data, to_label: e.target.value })}
                            className="text-sm font-medium mb-4 bg-transparent border-none outline-none w-full text-white/80 text-left uppercase"
                            readOnly={isReadOnly}
                        />
                    </div>
                    <div className="mb-2">
                        <input
                            type="text"
                            value={data.to_info || "Nome do Cliente"}
                            onChange={(e) => onUpdate({ ...data, to_info: e.target.value })}
                            className="text-4xl font-black bg-transparent border-none outline-none w-full text-white text-left"
                            readOnly={isReadOnly}
                        />
                    </div>

                    <textarea
                        value={data.to_address || "Morada do Cliente"}
                        onChange={(e) => onUpdate({ ...data, to_address: e.target.value })}
                        className="text-[13px] leading-relaxed bg-transparent border-none outline-none w-full resize-none h-20 text-white/90 text-left"
                        readOnly={isReadOnly}
                    />

                    <div className="w-64 h-[1px] bg-white/20 mt-2 mb-8" />

                    {/* Invoice Details */}
                    <div className="grid grid-cols-1 gap-y-1 mt-4 text-left">
                        <div className="flex items-center gap-4">
                            <span className="text-[13px] text-white/70 w-24">Factura No.</span>
                            <input
                                type="text"
                                value={data.doc_num || "FR-2024-00015"}
                                onChange={(e) => onUpdate({ ...data, doc_num: e.target.value })}
                                className="text-[13px] font-medium text-white bg-transparent border-none outline-none"
                                readOnly={isReadOnly}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[13px] text-white/70 w-24">Data:</span>
                            <input
                                type="text"
                                value={data.doc_date || "01/12/2024"}
                                onChange={(e) => onUpdate({ ...data, doc_date: e.target.value })}
                                className="text-[13px] font-medium text-white bg-transparent border-none outline-none"
                                readOnly={isReadOnly}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[13px] text-white/70 w-24">Conta:</span>
                            <input
                                type="text"
                                value={data.doc_account || "123 456"}
                                onChange={(e) => onUpdate({ ...data, doc_account: e.target.value })}
                                className="text-[13px] font-medium text-white bg-transparent border-none outline-none"
                                readOnly={isReadOnly}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column - Total */}
                <div className="text-right flex flex-col justify-end items-end pb-[40px]">
                    <div className="text-right">
                        <span className="text-2xl font-black text-white uppercase tracking-wider block mb-2">TOTAL</span>
                        <input
                            type="text"
                            value={data.total_display || `${settings?.currency || 'AOA'} 17.550.100`}
                            onChange={(e) => onUpdate({ ...data, total_display: e.target.value })}
                            className="text-[64px] font-black leading-none tracking-tighter bg-transparent border-none outline-none text-right w-full min-w-[300px] cursor-text"
                            style={{ color: settings?.secondaryColor || '#70ff30' }}
                            readOnly={isReadOnly}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export const DocumentItemsBlock = ({ data, onUpdate, isReadOnly, settings }: BlockProps) => {
    const items = data.items || [{ description: "", details: "", quantity: 1, price: 0 }]

    const updateItem = (index: number, field: string, value: unknown) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        onUpdate({ ...data, items: newItems })
    }

    const addItem = () => {
        onUpdate({ ...data, items: [...items, { description: "", details: "", quantity: 1, price: 0 }] })
    }

    const removeItem = (index: number) => {
        onUpdate({ ...data, items: items.filter((_: unknown, i: number) => i !== index) })
    }

    return (
        <div className="mb-0 relative z-10 text-left" style={{ backgroundColor: settings?.primaryColor || '#2A4DD8' }}>
            {/* Green Header Bar - Centered on page */}
            <div className="w-full flex justify-center -mt-32 relative z-30">
                <div
                    className="w-[920px] h-[85px] flex items-center shadow-lg"
                    style={{ backgroundColor: settings?.secondaryColor || '#70ff30' }}
                >
                    <span className="px-16 text-lg font-bold uppercase tracking-tight text-black w-[200px]">No.</span>
                    <span className="text-lg font-bold uppercase tracking-tight flex-1 text-black">Designação</span>
                    <span className="px-16 text-lg font-bold uppercase tracking-tight text-right text-black w-[250px]">Preço</span>
                </div>
            </div>
            {/* White content group - below green bar */}
            <div className="w-[1020px] mx-auto bg-white -mt-[40px] relative z-10 pt-[85px] flex-1">
                <table className="w-[920px] mx-auto text-left border-collapse">
                    <tbody>
                        {items.map((item: { quantity: number; price: number; description: string; details?: string; total_display?: string }, index: number) => (
                            <tr key={index} className="group flex items-center h-[90px] mb-[10px] border-b border-gray-200">
                                <td className="px-16 text-[15px] font-bold text-black w-[200px]">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                        className="w-12 bg-transparent border-none outline-none text-[15px] font-bold text-black"
                                        readOnly={isReadOnly}
                                    />
                                </td>
                                <td className="flex-1">
                                    <div className="flex flex-col gap-1">
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                                            placeholder="Nome do serviço"
                                            className="text-lg font-bold bg-transparent border-none outline-none w-full text-black"
                                            readOnly={isReadOnly}
                                        />
                                        <textarea
                                            value={item.details || ""}
                                            onChange={(e) => updateItem(index, 'details', e.target.value)}
                                            placeholder="A expressão Lorem ipsum em design gráfico e editoração é um texto padrão"
                                            className="text-[14px] leading-relaxed bg-transparent border-none outline-none w-full resize-none h-12 overflow-hidden text-gray-500 font-medium"
                                            readOnly={isReadOnly}
                                        />
                                    </div>
                                </td>
                                <td className="px-16 text-[15px] text-right font-bold whitespace-nowrap text-black w-[250px]">
                                    <input
                                        type="text"
                                        value={item.price === 0 ? "" : item.price.toLocaleString('pt-AO')}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '')
                                            const numValue = parseInt(rawValue) || 0
                                            updateItem(index, 'price', numValue)
                                        }}
                                        placeholder="0"
                                        className="bg-transparent border-none outline-none text-right text-[15px] font-bold text-black w-full"
                                        readOnly={isReadOnly}
                                    />
                                </td>
                                {!isReadOnly && (
                                    <td className="py-4 text-right pr-4 absolute right-0 group-hover:opacity-100 opacity-0 transition-opacity">
                                        <button
                                            onClick={() => removeItem(index)}
                                            className="text-gray-400 hover:text-[#EF0050]"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!isReadOnly && (
                    <Button
                        variant="ghost"
                        onClick={addItem}
                        className="mt-4 mx-8 text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
                        style={{ color: settings?.primaryColor || '#2A4DD8' }}
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Item
                    </Button>
                )}
            </div>
        </div>
    )
}

export const DocumentTotalsBlock = () => {
    return null
}

export const DocumentPaymentBlock = ({ data, onUpdate, isReadOnly, settings }: BlockProps) => {

    return (
        <div
            className="w-full mx-auto flex-1 flex flex-col relative"
            style={{ backgroundColor: settings?.primaryColor || '#2A4DD8' }}
        >
            <div className="flex-1 w-[1020px] mx-auto p-12 bg-white text-left">
                {/* Two Column Layout */}
                <div className="flex gap-8 border-t border-gray-100 pt-12">
                    {/* Column 1: Terms and Banking */}
                    <div className="w-[365px] flex-shrink-0 space-y-12">
                        <div>
                            <h3 className="text-lg font-bold uppercase tracking-tight mb-2 opacity-70 text-gray-600">Termos e condições</h3>
                            <textarea
                                value={data.terms || "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão"}
                                onChange={(e) => onUpdate({ ...data, terms: e.target.value })}
                                className="text-[14px] leading-relaxed bg-transparent border-none outline-none w-full resize-none min-h-[60px] font-medium opacity-60 text-gray-900 text-left"
                                readOnly={isReadOnly}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold uppercase tracking-tight mb-2 opacity-70 text-gray-600">Informações bancárias</h3>
                            <div className="space-y-1 text-left">
                                <div className="flex gap-2">
                                    <span className="text-[14px] font-medium text-gray-500">Titular da conta:</span>
                                    <input className="text-[14px] font-medium text-gray-900 bg-transparent border-none outline-none flex-1" value={data.bank_holder || "Arkhus LDA"} onChange={(e) => onUpdate({ ...data, bank_holder: e.target.value })} readOnly={isReadOnly} />
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-[14px] font-medium text-gray-500">No. de conta:</span>
                                    <input className="text-[14px] font-medium text-gray-900 bg-transparent border-none outline-none flex-1" value={data.bank_account || "0145 4125 2145 1"} onChange={(e) => onUpdate({ ...data, bank_account: e.target.value })} readOnly={isReadOnly} />
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-[14px] font-medium text-gray-500">IBAN:</span>
                                    <input className="text-[14px] font-medium text-gray-900 bg-transparent border-none outline-none flex-1" value={data.bank_iban || "0145 4125 2145 1475 5123 1"} onChange={(e) => onUpdate({ ...data, bank_iban: e.target.value })} readOnly={isReadOnly} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Subtotal/Taxes and Signature - aligned with Total */}
                    <div className="w-[300px] flex-shrink-0 flex flex-col justify-between ml-auto">
                        {/* Subtotal section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-[15px]">
                                <span className="text-gray-500 font-medium italic">Subtotal</span>
                                <input
                                    type="text"
                                    value={data.subtotal_display || `${settings?.currency || 'AOA'} 00.00`}
                                    onChange={(e) => onUpdate({ ...data, subtotal_display: e.target.value })}
                                    className="text-gray-900 font-bold bg-transparent border-none outline-none text-right"
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[15px]">
                                <span className="text-gray-500 font-medium italic">Impostos</span>
                                <input
                                    type="text"
                                    value={data.tax_display || "0%"}
                                    onChange={(e) => onUpdate({ ...data, tax_display: e.target.value })}
                                    className="text-gray-900 font-bold bg-transparent border-none outline-none text-right"
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[15px]">
                                <span className="text-gray-500 font-medium italic">Descontos</span>
                                <input
                                    type="text"
                                    value={data.discount_display || "0%"}
                                    onChange={(e) => onUpdate({ ...data, discount_display: e.target.value })}
                                    className="text-gray-900 font-bold bg-transparent border-none outline-none text-right"
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div
                                className="w-full h-2 mt-8 mb-4 shadow-lg"
                                style={{
                                    backgroundColor: settings?.secondaryColor || '#70ff30',
                                    boxShadow: `0 2px 10px ${settings?.secondaryColor || '#70ff30'}4D`
                                }}
                            />
                        </div>

                        {/* Signature section */}
                        <div className="flex flex-col items-end pb-4">
                            <div className="text-right w-full">
                                <input
                                    className="text-xl font-bold text-gray-900 block bg-transparent border-none outline-none text-right w-full underline decoration-2 underline-offset-8 mb-4 h-8"
                                    style={{ textDecorationColor: settings?.secondaryColor || '#70ff30' }}
                                    value={data.signature_name || "Maria Eduarta"}
                                    onChange={(e) => onUpdate({ ...data, signature_name: e.target.value })}
                                    readOnly={isReadOnly}
                                />
                                <input
                                    className="text-[14px] text-gray-500 font-medium block bg-transparent border-none outline-none text-right w-full h-5"
                                    value={data.signature_role || "CEO e Gestora de contas"}
                                    onChange={(e) => onUpdate({ ...data, signature_role: e.target.value })}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Fixed at bottom of page, same width as green bar */}
                <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[920px] h-[70px] flex items-center justify-center p-4"
                    style={{ backgroundColor: settings?.primaryColor || '#2A4DD8' }}
                >
                    <input
                        className="text-lg font-black uppercase tracking-[0.2em] bg-transparent border-none outline-none text-center w-full"
                        style={{ color: settings?.secondaryColor || '#70ff30' }}
                        value={data.footer_message || "Obrigado pela sua preferência"}
                        onChange={(e) => onUpdate({ ...data, footer_message: e.target.value })}
                        readOnly={isReadOnly}
                    />
                </div>
            </div>
        </div>
    )
}

// --- SIDEBAR THEME COMPONENTS ---

export const SidebarLayout = ({ blocks, onUpdateBlock, isReadOnly, settings }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean,
    settings?: DocumentSettings
}) => {
    const headerBlock = blocks.find(b => b.type === 'header') || { id: 'h', type: 'header', data: {} }
    const itemsBlock = blocks.find(b => b.type === 'items') || { id: 'i', type: 'items', data: { items: [] } }
    const paymentBlock = blocks.find(b => b.type === 'payment') || { id: 'p', type: 'payment', data: {} }

    const updateHeader = (newData: BlockData) => onUpdateBlock(headerBlock.id, newData)
    const updateItems = (newData: BlockData) => onUpdateBlock(itemsBlock.id, newData)
    const updatePayment = (newData: BlockData) => onUpdateBlock(paymentBlock.id, newData)

    const primaryColor = settings?.primaryColor || '#EE6D2D'
    const sidebarColor = settings?.sidebarColor || '#FFDECB'

    return (
        <div className="flex flex-1 min-h-[1806px] font-inter -mx-[35px] -mt-[35px]">
            {/* Sidebar */}
            <div
                className="w-[380px] p-12 flex flex-col relative"
                style={{ backgroundColor: sidebarColor }}
            >
                {/* Logo & Brand */}
                <div className="mb-16">
                    <div className="flex flex-col items-start gap-2 text-left">
                        {settings?.logoUrl ? (
                            <Image src={settings.logoUrl} width={120} height={48} className="object-contain" alt="Logo" />
                        ) : (
                            <div className="w-16 h-16 bg-[#EE6D2D] text-white font-black flex items-center justify-center text-2xl rounded-sm">LG</div>
                        )}
                        <h1 className="text-5xl font-black tracking-tighter" style={{ color: primaryColor }}>LOGO</h1>
                        <span className="text-[11px] font-bold uppercase tracking-widest mt-[-8px] text-black">Factura No.</span>
                    </div>
                </div>

                {/* Sidebar Sections */}
                <div className="space-y-12 flex-1 scroll-auto">
                    {/* Factura para: */}
                    <div className="space-y-4 text-left">
                        <h3 className="text-[13px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>Factura para:</h3>
                        <div className="space-y-2">
                            <input
                                className="text-xl font-black text-black bg-transparent border-none outline-none w-full"
                                value={headerBlock.data.to_info || "Maria Eduarda"}
                                onChange={(e) => updateHeader({ ...headerBlock.data, to_info: e.target.value })}
                                readOnly={isReadOnly}
                            />
                            <textarea
                                className="text-[13px] font-medium leading-relaxed text-black/70 bg-transparent border-none outline-none w-full resize-none h-20"
                                value={headerBlock.data.to_address || "Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola"}
                                onChange={(e) => updateHeader({ ...headerBlock.data, to_address: e.target.value })}
                                readOnly={isReadOnly}
                            />
                        </div>
                    </div>

                    <div className="w-24 h-[1px] bg-black/10" />

                    {/* Detalhes da factura */}
                    <div className="space-y-4 text-left">
                        <h3 className="text-[13px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>Detalhes da factura</h3>
                        <div className="space-y-5">
                            <div className="space-y-1">
                                <span className="text-[13px] font-black block text-black">Factura No.</span>
                                <input
                                    className="text-[13px] font-medium bg-transparent border-none outline-none w-full text-black"
                                    value={headerBlock.data.doc_num || "FR-2024-00015"}
                                    onChange={(e) => updateHeader({ ...headerBlock.data, doc_num: e.target.value })}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[13px] font-black block text-black">Data:</span>
                                <input
                                    className="text-[13px] font-medium bg-transparent border-none outline-none w-full text-black"
                                    value={headerBlock.data.doc_date || "01/12/2024"}
                                    onChange={(e) => updateHeader({ ...headerBlock.data, doc_date: e.target.value })}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[13px] font-black block text-black">Conta No.</span>
                                <input
                                    className="text-[13px] font-medium bg-transparent border-none outline-none w-full text-black"
                                    value={headerBlock.data.doc_account || "4582 4752 4512 5685"}
                                    onChange={(e) => updateHeader({ ...headerBlock.data, doc_account: e.target.value })}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="w-24 h-[1px] bg-black/10" />

                    {/* Métodos de pagamento */}
                    <div className="space-y-4 text-left">
                        <h3 className="text-[13px] font-black uppercase tracking-widest" style={{ color: primaryColor }}>Métodos de pagamento</h3>
                        <div className="space-y-5">
                            <div className="space-y-1">
                                <span className="text-[11px] font-medium text-black/50 block">Titular da conta:</span>
                                <input
                                    className="text-[11px] font-medium bg-transparent border-none outline-none w-full text-black/50"
                                    value={paymentBlock.data.bank_holder || "Arkhus LDA"}
                                    onChange={(e) => updatePayment({ ...paymentBlock.data, bank_holder: e.target.value })}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[11px] font-medium text-black/50 block">No. de conta:</span>
                                <input
                                    className="text-[11px] font-medium bg-transparent border-none outline-none w-full text-black/50"
                                    value={paymentBlock.data.bank_account || "0145 4125 2145 1"}
                                    onChange={(e) => updatePayment({ ...paymentBlock.data, bank_account: e.target.value })}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="space-y-1">
                                <span className="text-[11px] font-medium text-black/50 block">IBAN:</span>
                                <input
                                    className="text-[11px] font-medium bg-transparent border-none outline-none w-full text-black/50"
                                    value={paymentBlock.data.bank_iban || "0145 4125 2145 1475 5123 1"}
                                    onChange={(e) => updatePayment({ ...paymentBlock.data, bank_iban: e.target.value })}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="pt-12 border-t border-black/10">
                    <div className="space-y-4 text-left">
                        <div className="space-y-1 text-left">
                            <h3 className="text-[15px] font-black text-left">Endereço</h3>
                            <textarea
                                className="text-[11px] font-medium leading-[1.6] text-black/70 bg-transparent border-none outline-none w-full resize-none h-12"
                                value={headerBlock.data.from_info || "Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola"}
                                onChange={(e) => updateHeader({ ...headerBlock.data, from_info: e.target.value })}
                                readOnly={isReadOnly}
                            />
                        </div>
                        <input
                            className="text-[12px] font-black text-black bg-transparent border-none outline-none w-full"
                            value={headerBlock.data.company_website || "www.suaempresa.com"}
                            onChange={(e) => updateHeader({ ...headerBlock.data, company_website: e.target.value })}
                            readOnly={isReadOnly}
                        />
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 bg-white p-24 flex flex-col text-left">
                <h2 className="text-[110px] font-black tracking-tighter mb-20 leading-none text-left" style={{ color: primaryColor }}>FACTURA</h2>

                {/* Items Table */}
                <div className="flex-1 overflow-visible">
                    <div
                        className="flex items-center h-[70px] px-10 rounded-sm mb-6"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <span className="text-[15px] font-black text-white uppercase tracking-widest flex-1 min-w-[180px] text-left">Designação</span>
                        <span className="text-[15px] font-black text-white uppercase tracking-widest w-[200px] text-right">Preço Unit</span>
                        <span className="text-[15px] font-black text-white uppercase tracking-widest w-[120px] text-right">Qtd.</span>
                        <span className="text-[15px] font-black text-white uppercase tracking-widest w-[200px] text-right">Total</span>
                    </div>

                    <div className="space-y-0">
                        {(itemsBlock.data.items || []).map((item, index) => (
                            <div key={index} className="group relative flex items-start py-4 px-10 border-b border-black text-left">
                                <div className="flex-1 min-w-[180px] space-y-1 pr-12 text-left">
                                    <input
                                        className="text-[15px] font-black uppercase w-full bg-transparent border-none outline-none text-left"
                                        style={{ color: primaryColor }}
                                        value={item.description}
                                        onChange={(e) => {
                                            const items = [...(itemsBlock.data.items || [])]
                                            items[index] = { ...items[index], description: e.target.value }
                                            updateItems({ ...itemsBlock.data, items })
                                        }}
                                        readOnly={isReadOnly}
                                    />
                                    <textarea
                                        className="text-[11px] font-medium leading-relaxed text-black/50 w-full bg-transparent border-none outline-none resize-none h-8 overflow-hidden text-left"
                                        value={item.details || "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão"}
                                        onChange={(e) => {
                                            const items = [...(itemsBlock.data.items || [])]
                                            items[index] = { ...items[index], details: e.target.value }
                                            updateItems({ ...itemsBlock.data, items })
                                        }}
                                        readOnly={isReadOnly}
                                    />
                                </div>
                                <div className="w-[200px] pt-1">
                                    <input
                                        className="text-[15px] font-black text-right w-full bg-transparent border-none outline-none text-black"
                                        value={item.price.toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '')
                                            const items = [...(itemsBlock.data.items || [])]
                                            items[index] = { ...items[index], price: parseFloat(raw) || 0 }
                                            updateItems({ ...itemsBlock.data, items })
                                        }}
                                        readOnly={isReadOnly}
                                    />
                                </div>
                                <div className="w-[120px] pt-1">
                                    <input
                                        className="text-[15px] font-black text-right w-full bg-transparent border-none outline-none text-black"
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const items = [...(itemsBlock.data.items || [])]
                                            items[index] = { ...items[index], quantity: parseInt(e.target.value) || 0 }
                                            updateItems({ ...itemsBlock.data, items })
                                        }}
                                        readOnly={isReadOnly}
                                    />
                                </div>
                                <div className="w-[200px] pt-1 text-right">
                                    <span className="text-[15px] font-black block text-black">
                                        {(item.price * item.quantity).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                {!isReadOnly && (
                                    <button
                                        onClick={() => {
                                            const items = itemsBlock.data.items?.filter((_, i) => i !== index)
                                            updateItems({ ...itemsBlock.data, items })
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {!isReadOnly && (
                        <Button
                            variant="ghost"
                            className="mt-6 text-[11px] font-black uppercase tracking-widest"
                            style={{ color: primaryColor }}
                            onClick={() => {
                                const items = [...(itemsBlock.data.items || []), { description: "Novo Serviço", details: "Descrição...", quantity: 1, price: 0 }]
                                updateItems({ ...itemsBlock.data, items })
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Item
                        </Button>
                    )}

                    {/* Totals Section */}
                    <div className="mt-16 space-y-6">
                        <div className="grid grid-cols-3 px-10">
                            <span className="text-[13px] font-black uppercase tracking-widest text-left" style={{ color: primaryColor }}>Sub Total:</span>
                            <span className="text-[13px] font-black uppercase tracking-widest text-center" style={{ color: primaryColor }}>Impostos:</span>
                            <span className="text-[13px] font-black uppercase tracking-widest text-right" style={{ color: primaryColor }}>Total</span>
                        </div>
                        <div
                            className="h-[120px] rounded-sm flex items-center px-10"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <div className="flex-1 text-left">
                                <input
                                    className="text-[30px] font-normal text-white bg-transparent border-none outline-none text-left w-full"
                                    value={itemsBlock.data.subtotal_display || "00.00"}
                                    onChange={(e) => updateItems({ ...itemsBlock.data, subtotal_display: e.target.value })}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="flex-1 text-center">
                                <input
                                    className="text-[30px] font-normal text-white bg-transparent border-none outline-none text-center w-full"
                                    value={itemsBlock.data.tax_display || "00.00"}
                                    onChange={(e) => updateItems({ ...itemsBlock.data, tax_display: e.target.value })}
                                    readOnly={isReadOnly}
                                />
                            </div>
                            <div className="flex-1 text-right">
                                <input
                                    className="text-[30px] font-normal text-white bg-transparent border-none outline-none text-right w-full leading-none"
                                    value={itemsBlock.data.total_display || "2.745.152,25"}
                                    onChange={(e) => updateItems({ ...itemsBlock.data, total_display: e.target.value })}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Footer */}
                <div className="mt-24 space-y-16">
                    <div className="space-y-4 text-left">
                        <h3 className="text-[15px] font-black">Formas de pagamento</h3>
                        <textarea
                            className="text-[11px] font-medium leading-relaxed text-black/50 w-full bg-transparent border-none outline-none resize-none h-16 text-left"
                            placeholder="Descreva as formas de pagamento aqui..."
                            readOnly={isReadOnly}
                        />
                    </div>

                    <div className="space-y-4 text-left">
                        <h3 className="text-[15px] font-black">Termos & Condições</h3>
                        <div className="space-y-4 pb-20 text-left">
                            <textarea
                                className="text-[11px] font-medium leading-relaxed text-black/50 w-full bg-transparent border-none outline-none resize-none h-16 text-left"
                                value={paymentBlock.data.terms || "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão"}
                                onChange={(e) => updatePayment({ ...paymentBlock.data, terms: e.target.value })}
                                readOnly={isReadOnly}
                            />
                            <div className="w-full h-[1px] bg-black" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ModernDarkLayout({ blocks, onUpdateBlock, isReadOnly, settings }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean,
    settings?: DocumentSettings
}) {
    const headerBlock = blocks.find(b => b.type === 'header')
    const itemsBlock = blocks.find(b => b.type === 'items')
    const paymentBlock = blocks.find(b => b.type === 'payment')

    const accentColor = settings?.primaryColor || '#FACC15'

    return (
        <div className="flex-1 flex flex-col bg-[#1A1A1A] text-white p-0 overflow-hidden font-sans">
            {/* Header Section */}
            <div className="pt-16 px-16 pb-12 flex justify-between items-start">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: accentColor }}>
                            {settings?.logoUrl ? (
                                <Image src={settings.logoUrl} alt="Logo" width={40} height={40} className="object-contain" />
                            ) : (
                                <div className="w-8 h-8 flex items-center justify-center">
                                    <div className="w-8 h-8 rounded-full border-4 border-black border-r-transparent animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black tracking-tight text-white uppercase leading-none">
                                {headerBlock?.data?.from_info?.split('\n')[0] || 'LOGOTIPOEMPRESA'}
                            </h2>
                            <p className="text-[10px] font-medium text-gray-500 tracking-wider">
                                {headerBlock?.data?.company_website || 'Slogan da empresa aqui'}
                            </p>
                        </div>
                    </div>
                </div>
                <h1 className="text-7xl font-black italic tracking-tighter" style={{ color: accentColor }}>FACTURA</h1>
            </div>

            {/* Recipient & Metadata Section */}
            <div className="px-16 grid grid-cols-12 gap-8 mb-16">
                <div className="col-span-4 space-y-4">
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Factura para:</h4>
                        <div className="space-y-1">
                            <p className="text-xl font-black text-white">{headerBlock?.data?.to_info || 'Sra. MARIA EDUARDA'}</p>
                            <p className="text-sm text-gray-500 leading-tight whitespace-pre-line">
                                {headerBlock?.data?.to_address || 'Gestora de contas e\nPlanejadora na Kriativus'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-span-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">ENDEREÇO:</h4>
                    <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line max-w-[200px]">
                        {headerBlock?.data?.from_info || 'Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola'}
                    </p>
                </div>

                <div className="col-span-4 flex justify-end gap-12 text-right">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Factura No.</p>
                            <p className="text-sm font-black text-white">{headerBlock?.data?.doc_num || 'FR-2024-00015'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data de emissão</p>
                            <p className="text-sm font-black text-white">{headerBlock?.data?.doc_date || '01/05/2024'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vencimento</p>
                            <p className="text-sm font-black text-white">{headerBlock?.data?.doc_date || '01/05/2024'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="px-16 space-y-3 flex-1 overflow-visible">
                {/* Table Header */}
                <div className="h-14 rounded-full flex items-center px-8" style={{ backgroundColor: accentColor }}>
                    <div className="w-[80px] text-[15px] font-black text-black">No.</div>
                    <div className="flex-1 text-[15px] font-black text-black uppercase">Designação</div>
                    <div className="w-[180px] text-[15px] font-black text-black text-right">Preço Unit.</div>
                    <div className="w-[100px] text-[15px] font-black text-black text-center">Qtd.</div>
                    <div className="w-[180px] text-[15px] font-black text-black text-right">Total</div>
                </div>

                {/* Table Body */}
                <div className="space-y-2">
                    {(itemsBlock?.data?.items || []).map((item, idx) => (
                        <div key={idx} className="h-20 rounded-full bg-[#262626] flex items-center px-8 transition-colors hover:bg-[#2F2F2F]">
                            <div className="w-[80px] text-lg font-black text-white">{idx + 1}</div>
                            <div className="flex-1">
                                <p className="text-[15px] font-black text-white uppercase leading-none mb-1">{item.description || 'Nome do serviço'}</p>
                                <p className="text-xs text-gray-500 line-clamp-1">{item.details || 'A expressão Lorem ipsum em design'}</p>
                            </div>
                            <div className="w-[180px] text-sm font-black text-white text-right">
                                {settings?.currency || 'AOA'} {(item.price || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="w-[100px] text-lg font-black text-white text-center">{item.quantity}</div>
                            <div className="w-[180px] text-sm font-black text-white text-right">
                                {settings?.currency || 'AOA'} {((item.price || 0) * (item.quantity || 0)).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    ))}

                    {!isReadOnly && itemsBlock && (
                        <button
                            onClick={() => onUpdateBlock(itemsBlock.id, {
                                ...itemsBlock.data,
                                items: [...(itemsBlock.data.items || []), { description: 'Novo Serviço', details: '', quantity: 1, price: 0 }]
                            })}
                            className="w-full h-16 rounded-full border-2 border-dashed border-[#262626] flex items-center justify-center text-gray-500 hover:border-yellow-500/50 hover:text-yellow-500 transition-all gap-2 group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">Adicionar Item</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Footer Section */}
            <div className="mt-auto">
                <div className="px-16 pb-16 grid grid-cols-12 gap-8 items-end">
                    <div className="col-span-6 space-y-8">
                        <div className="space-y-2">
                            <h4 className="text-xl font-black text-white">Obrigado!</h4>
                            <p className="text-sm text-gray-500 leading-relaxed max-w-[400px]">
                                {paymentBlock?.data?.footer_message || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão'}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-base font-black text-white">Informações bancárias</h4>
                            <div className="space-y-2">
                                <div className="flex gap-4 items-center">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] w-32">Titular da conta:</span>
                                    <span className="text-sm font-black text-white">{(paymentBlock?.data?.bank_holder || 'Arkhus LDA').toUpperCase()}</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] w-32">No. de conta:</span>
                                    <span className="text-sm font-black text-white">{paymentBlock?.data?.bank_account || '0145 4125 2145 1'}</span>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em] w-32">IBAN:</span>
                                    <span className="text-sm font-black text-white uppercase">{paymentBlock?.data?.bank_iban || 'AO06 0145 4125 2145 1475 5123 1'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-6 flex flex-col items-end gap-6 text-right">
                        <div className="space-y-4 pr-8">
                            <div className="flex justify-end gap-12 items-center">
                                <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Subtotal:</p>
                                <p className="text-sm font-black text-white min-w-[120px]">{itemsBlock?.data?.subtotal_display || '0,00'}</p>
                            </div>
                            <div className="flex justify-end gap-12 items-center">
                                <p className="text-sm font-black text-gray-500 uppercase tracking-widest">Impostos:</p>
                                <p className="text-sm font-black text-white min-w-[120px]">{itemsBlock?.data?.tax_display || '0%'}</p>
                            </div>
                        </div>

                        <div className="h-24 rounded-full flex items-center justify-between px-10 min-w-[450px]" style={{ backgroundColor: accentColor }}>
                            <span className="text-2xl font-black text-black uppercase tracking-tighter">Total:</span>
                            <span className="text-3xl font-black text-black tracking-tight">{itemsBlock?.data?.total_display || 'AOA 0,00'}</span>
                        </div>
                    </div>
                </div>

                {/* Final Yellow Footer Bar */}
                <div className="h-32 w-full flex items-center px-16 justify-between" style={{ backgroundColor: accentColor }}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shrink-0">
                            <div className="w-4 h-4 rounded-full border-4 border-white" />
                        </div>
                        <div className="text-black">
                            <p className="text-base font-black uppercase tracking-tighter">
                                {headerBlock?.data?.from_info?.split('\n')[0] || 'LOGOTIPOEMPRESA'}
                            </p>
                            <p className="text-[10px] font-medium tracking-tight opacity-70">
                                {headerBlock?.data?.company_website || 'www.nomedaempresa.com'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-16">
                        <div className="text-black max-w-[200px]">
                            <p className="text-[10px] font-bold opacity-80 uppercase leading-relaxed">
                                {headerBlock?.data?.from_info?.split('\n').slice(1).join(', ') || 'Rua 14, Luanda'}
                            </p>
                        </div>
                        <div className="text-black text-right">
                            <p className="text-[10px] font-bold opacity-80 uppercase leading-relaxed">
                                {paymentBlock?.data?.footer_email || 'info@nomedaempresa.com'}<br />
                                {headerBlock?.data?.company_website || 'www.nomedaempresa.com'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function MinimalPremiumLayout({ blocks, onUpdateBlock, isReadOnly, settings }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean,
    settings?: DocumentSettings
}) {
    const headerBlock = blocks.find(b => b.type === 'header')
    const itemsBlock = blocks.find(b => b.type === 'items')
    const paymentBlock = blocks.find(b => b.type === 'payment')

    const accentColor = settings?.primaryColor || '#FACC15'

    return (
        <div className="flex-1 flex flex-col bg-white text-black p-0 overflow-hidden font-sans">
            {/* White Header Section */}
            <div className="pt-16 px-16 pb-12 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: accentColor }}>
                        {settings?.logoUrl ? (
                            <Image src={settings.logoUrl} alt="Logo" width={40} height={40} className="object-contain" />
                        ) : (
                            <div className="w-8 h-8 rounded-full border-4 border-black border-r-transparent animate-spin" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black tracking-tight text-black uppercase leading-none">
                            {headerBlock?.data?.from_info?.split('\n')[0] || 'LOGOTIPOEMPRESA'}
                        </h2>
                        <p className="text-[10px] font-medium text-gray-400 tracking-wider">
                            {headerBlock?.data?.company_website || 'Slogan da empresa aqui'}
                        </p>
                    </div>
                </div>
                <h1 className="text-8xl font-black tracking-tighter text-gray-200 opacity-50 uppercase">FACTURA</h1>
            </div>

            {/* Dark Metadata Bar with Floating Total Box */}
            <div className="relative mb-20">
                <div className="bg-[#333333] py-12 px-16 grid grid-cols-12 gap-8 text-white min-h-[160px]">
                    <div className="col-span-4 space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Factura para:</h4>
                        <div className="space-y-1">
                            <p className="text-lg font-black">{headerBlock?.data?.to_info || 'Sra. MARIA EDUARDA'}</p>
                            <p className="text-xs text-gray-400 leading-tight whitespace-pre-line opacity-80">
                                {headerBlock?.data?.to_address || 'Gestora de contas e\nPlanejadora na Kriativus'}
                            </p>
                        </div>
                    </div>

                    <div className="col-span-3 space-y-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">ENDEREÇO:</h4>
                        <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line opacity-80">
                            {headerBlock?.data?.from_info || 'Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola'}
                        </p>
                    </div>

                    <div className="col-span-5 grid grid-cols-3 gap-4 text-right pr-[40px]">
                        <div className="space-y-1 mt-auto pb-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Factura No.</p>
                            <p className="text-xs font-black">{headerBlock?.data?.doc_num || 'FR-2024-00015'}</p>
                        </div>
                        <div className="space-y-1 mt-auto pb-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data de emissão</p>
                            <p className="text-xs font-black">{headerBlock?.data?.doc_date || '01/05/2024'}</p>
                        </div>
                        <div className="space-y-1 mt-auto pb-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vencimento</p>
                            <p className="text-xs font-black">{headerBlock?.data?.doc_date || '01/05/2024'}</p>
                        </div>
                    </div>
                </div>

                {/* Big Floating Total Box */}
                <div className="absolute top-0 right-16 -translate-y-1/2 w-[350px] h-44 shadow-2xl flex flex-col items-center justify-center text-black px-8" style={{ backgroundColor: accentColor }}>
                    <p className="text-xl font-black uppercase tracking-widest mb-2 opacity-80">Total</p>
                    <p className="text-4xl font-black tracking-tighter whitespace-nowrap">
                        {itemsBlock?.data?.total_display || 'AOA 0,00'}
                    </p>
                </div>
            </div>

            {/* Items Table - Zebra Striped */}
            <div className="px-16 flex-1 overflow-visible">
                {/* Table Header */}
                <div className="h-14 flex items-center px-8 border-b border-gray-100" style={{ backgroundColor: accentColor }}>
                    <div className="w-[80px] text-[15px] font-black text-black">No.</div>
                    <div className="flex-1 text-[15px] font-black text-black uppercase">Designação</div>
                    <div className="w-[180px] text-[15px] font-black text-black text-right">Preço Unit.</div>
                    <div className="w-[80px] text-[15px] font-black text-black text-center">Qtd.</div>
                    <div className="w-[180px] text-[15px] font-black text-black text-right">Total</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-50">
                    {(itemsBlock?.data?.items || []).map((item, idx) => (
                        <div key={idx} className={`h-24 flex items-center px-8 transition-colors ${idx % 2 === 1 ? 'bg-[#FFFBEC]' : 'bg-white'}`}>
                            <div className="w-[80px] text-lg font-black text-gray-400">{idx + 1}</div>
                            <div className="flex-1">
                                <p className="text-[15px] font-black text-black uppercase leading-none mb-1">{item.description || 'Nome do serviço'}</p>
                                <p className="text-[11px] text-gray-400 leading-tight max-w-[400px]">{item.details || 'A expressão Lorem ipsum em design'}</p>
                            </div>
                            <div className="w-[180px] text-sm font-black text-black text-right">
                                {settings?.currency || 'AOA'} {(item.price || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="w-[80px] text-lg font-black text-black text-center">{item.quantity}</div>
                            <div className="w-[180px] text-sm font-black text-black text-right">
                                {settings?.currency || 'AOA'} {((item.price || 0) * (item.quantity || 0)).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    ))}

                    {!isReadOnly && itemsBlock && (
                        <button
                            onClick={() => onUpdateBlock(itemsBlock.id, {
                                ...itemsBlock.data,
                                items: [...(itemsBlock.data.items || []), { description: 'Novo Serviço', details: '', quantity: 1, price: 0 }]
                            })}
                            className="w-full h-16 border-b border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:text-yellow-600 transition-all gap-2 group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Adicionar Linha</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Summary & Footer */}
            <div className="mt-auto">
                <div className="px-16 py-12 grid grid-cols-12 gap-8 items-start relative">
                    <div className="col-span-7 space-y-12">
                        <div className="space-y-4">
                            <h4 className="text-xl font-black text-black">Obrigado!</h4>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-[450px]">
                                {paymentBlock?.data?.footer_message || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão'}
                            </p>
                        </div>

                        <div className="space-y-5">
                            <h4 className="text-sm font-black text-black uppercase tracking-widest border-b border-gray-100 pb-2 w-fit">Informações bancárias</h4>
                            <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Titular da conta:</p>
                                    <p className="text-sm font-black text-black">{(paymentBlock?.data?.bank_holder || 'Arkhus LDA').toUpperCase()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No. de conta:</p>
                                    <p className="text-sm font-black text-black">{paymentBlock?.data?.bank_account || '0145 4125 2145 1'}</p>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">IBAN:</p>
                                    <p className="text-sm font-black text-black uppercase">{paymentBlock?.data?.bank_iban || 'AO06 0145 4125 2145 1475 5123 1'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Box */}
                    <div className="col-span-5 flex flex-col gap-0 shadow-lg rounded-[2px] overflow-hidden">
                        <div className="bg-[#FFFBEC] p-8 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Subtotal:</span>
                                <span className="text-sm font-black text-black">{itemsBlock?.data?.subtotal_display || '0,00'}</span>
                            </div>
                            <div className="flex justify-between items-center opacity-70">
                                <span className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Impostos:</span>
                                <span className="text-sm font-black text-black">{itemsBlock?.data?.tax_display || '0%'}</span>
                            </div>
                        </div>
                        <div className="p-8 flex justify-between items-center" style={{ backgroundColor: accentColor }}>
                            <span className="text-xl font-black text-black uppercase tracking-tighter">Total:</span>
                            <span className="text-2xl font-black text-black tracking-tight">{itemsBlock?.data?.total_display || 'AOA 0,00'}</span>
                        </div>
                    </div>
                </div>

                {/* Fixed Yellow Bottom Footer */}
                <div className="h-32 w-full flex items-center px-16 justify-between border-t border-black/5" style={{ backgroundColor: accentColor }}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center shrink-0">
                            <div className="w-4 h-4 rounded-full border-4 border-white" />
                        </div>
                        <div className="text-black">
                            <p className="text-base font-black uppercase tracking-tighter leading-none">
                                {headerBlock?.data?.from_info?.split('\n')[0] || 'LOGOTIPOEMPRESA'}
                            </p>
                            <p className="text-[10px] font-medium tracking-tight opacity-60">
                                {headerBlock?.data?.company_website || 'www.nomedaempresa.com'}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-16">
                        <div className="text-black max-w-[220px]">
                            <p className="text-[10px] font-bold opacity-70 uppercase leading-relaxed text-right">
                                {headerBlock?.data?.from_info?.split('\n').slice(1).join(', ') || 'Rua 14, Luanda'}
                            </p>
                        </div>
                        <div className="text-black text-right">
                            <p className="text-[10px] font-bold opacity-70 uppercase leading-relaxed">
                                {paymentBlock?.data?.footer_email || 'info@nomedaempresa.com'}<br />
                                {headerBlock?.data?.company_website || 'www.nomedaempresa.com'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function ElegantDarkLayout({ blocks, onUpdateBlock, isReadOnly, settings }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean,
    settings?: DocumentSettings
}) {
    const headerBlock = blocks.find(b => b.type === 'header')
    const itemsBlock = blocks.find(b => b.type === 'items')
    const paymentBlock = blocks.find(b => b.type === 'payment')

    const accentColor = settings?.primaryColor || '#EB6B41'

    return (
        <div className="flex-1 flex flex-col bg-[#1B2533] text-white p-0 overflow-hidden font-sans">
            {/* Top Header Section */}
            <div className="pt-20 px-16 pb-12 grid grid-cols-12 gap-8 items-start">
                {/* Logo Area */}
                <div className="col-span-6 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full border-[6px] shrink-0" style={{ borderColor: accentColor }}>
                        {settings?.logoUrl ? (
                            <Image src={settings.logoUrl} alt="Logo" width={68} height={68} className="w-full h-full object-contain rounded-full p-2" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-3">
                                <div className="w-full h-full rounded-full bg-white opacity-20" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-white uppercase leading-none">
                            {headerBlock?.data?.from_info?.split('\n')[0] || 'LOGOTIPOEMPRESA'}
                        </h2>
                        <p className="text-xs font-medium text-gray-400 mt-1">
                            {headerBlock?.data?.company_website || 'Slogan da empresa aqui'}
                        </p>
                    </div>
                </div>

                {/* Title and Metadata Area */}
                <div className="col-span-6 flex flex-col items-end">
                    <h1 className="text-8xl font-black text-white/10 uppercase tracking-tighter leading-none mb-4">FACTURA</h1>
                    <div className="space-y-1 text-right">
                        <div className="flex justify-end gap-12">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Factura No.</span>
                            <span className="text-[11px] font-black text-white w-24">{headerBlock?.data?.doc_num || 'FR-2024-00015'}</span>
                        </div>
                        <div className="flex justify-end gap-12">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Data de emissão:</span>
                            <span className="text-[11px] font-black text-white w-24">{headerBlock?.data?.doc_date || '01/05/2024'}</span>
                        </div>
                        <div className="flex justify-end gap-12">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Vencimento:</span>
                            <span className="text-[11px] font-black text-white w-24">{headerBlock?.data?.doc_date || '01/05/2024'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Section: Client, Address & Bank */}
            <div className="px-16 grid grid-cols-12 gap-16 mb-12">
                <div className="col-span-5 space-y-6">
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Factura para:</h4>
                        <p className="text-xl font-black text-white mb-1">{headerBlock?.data?.to_info || 'Sra. MARIA EDUARDA'}</p>
                        <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line opacity-70">
                            {headerBlock?.data?.to_address || 'Gestora de contas e Planejadora na Kriativus'}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">ENDEREÇO:</h4>
                        <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line opacity-70">
                            {headerBlock?.data?.from_info?.split('\n').slice(1).join('\n') || 'Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola'}
                        </p>
                    </div>
                </div>

                <div className="col-span-7 space-y-4">
                    <h4 className="text-sm font-black text-white tracking-wide">Informações bancárias</h4>
                    <div className="grid grid-cols-1 gap-2 border-t border-white/5 pt-4">
                        <div className="flex gap-4">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-40">Titular da conta:</span>
                            <span className="text-[11px] font-medium text-white">{paymentBlock?.data?.bank_holder || 'Arkhus LDA'}</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-40">No. de conta:</span>
                            <span className="text-[11px] font-medium text-white">{paymentBlock?.data?.bank_account || '0145 4125 2145 1'}</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-40">IBAN:</span>
                            <span className="text-[11px] font-medium text-white uppercase">{paymentBlock?.data?.bank_iban || '0145 4125 2145 1475 5123 1'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="px-16 space-y-4 flex-1 overflow-visible">
                {/* Table Header */}
                <div className="h-14 flex items-center px-10" style={{ backgroundColor: accentColor }}>
                    <div className="w-[80px] text-[15px] font-black text-white">No.</div>
                    <div className="flex-1 text-[15px] font-black text-white uppercase">Designação</div>
                    <div className="w-[180px] text-[15px] font-black text-white text-right">Preço Unit.</div>
                    <div className="w-[80px] text-[15px] font-black text-white text-center">Qtd.</div>
                    <div className="w-[180px] text-[15px] font-black text-white text-right">Total</div>
                </div>

                {/* Table Body */}
                <div className="space-y-3">
                    {(itemsBlock?.data?.items || []).map((item, idx) => (
                        <div key={idx} className="h-24 bg-[#253145] flex items-center px-10 rounded-[4px] border-l-4" style={{ borderColor: accentColor }}>
                            <div className="w-[80px] text-lg font-black text-white opacity-50">{idx + 1}</div>
                            <div className="flex-1">
                                <p className="text-[15px] font-black text-white uppercase leading-none mb-1">{item.description || 'Nome do serviço'}</p>
                                <p className="text-[11px] text-gray-400 leading-tight line-clamp-2 max-w-[450px]">{item.details || 'A expressão Lorem ipsum em design'}</p>
                            </div>
                            <div className="w-[180px] text-sm font-black text-white text-right">
                                {settings?.currency || 'AOA'} {(item.price || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="w-[80px] text-lg font-black text-white text-center">{item.quantity}</div>
                            <div className="w-[180px] text-sm font-black text-white text-right">
                                {settings?.currency || 'AOA'} {((item.price || 0) * (item.quantity || 0)).toLocaleString('pt-AO', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    ))}

                    {!isReadOnly && itemsBlock && (
                        <button
                            onClick={() => onUpdateBlock(itemsBlock.id, {
                                ...itemsBlock.data,
                                items: [...(itemsBlock.data.items || []), { description: 'Novo Serviço', details: '', quantity: 1, price: 0 }]
                            })}
                            className="w-full h-16 border-2 border-dashed border-white/5 rounded-[4px] flex items-center justify-center text-gray-500 hover:text-white transition-all gap-2 group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Adicionar Registro</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="px-16 py-16 grid grid-cols-12 gap-16 items-start mt-auto">
                {/* Large Total Display & Terms */}
                <div className="col-span-8 flex flex-col justify-between h-full space-y-8">
                    <div className="space-y-2">
                        <p className="text-xl font-bold text-gray-500 uppercase tracking-widest">Total:</p>
                        <h2 className="text-7xl font-black text-white tracking-tighter" style={{ borderBottom: `4px solid ${accentColor}`, paddingBottom: '16px', display: 'inline-block' }}>
                            {itemsBlock?.data?.total_display || 'AOA 0,00'}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-base font-black text-white">Termos & Condições</h4>
                        <p className="text-[11px] text-gray-400 leading-relaxed max-w-[500px] opacity-70">
                            {paymentBlock?.data?.terms || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão.'}
                        </p>
                    </div>
                </div>

                {/* Summary Table */}
                <div className="col-span-4 flex flex-col gap-0 overflow-hidden pt-4">
                    <div className="space-y-6 pb-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Subtotal:</span>
                            <span className="text-sm font-medium text-white">{itemsBlock?.data?.subtotal_display || '0,00'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.2em]">Impostos:</span>
                            <span className="text-sm font-medium text-white">{itemsBlock?.data?.tax_display || '0%'}</span>
                        </div>
                    </div>
                    {/* Big Total Box */}
                    <div className="h-28 flex items-center justify-between px-10 rounded-[2px] transition-transform" style={{ backgroundColor: accentColor }}>
                        <span className="text-xl font-black text-white uppercase tracking-tighter">Total:</span>
                        <span className="text-2xl font-black text-white tracking-tight">{(itemsBlock?.data?.total_display?.split(' ') || [])[1] || itemsBlock?.data?.total_display || '0,00'}</span>
                    </div>
                </div>
            </div>

            {/* Footer Strip with Logo */}
            <div className="relative h-40 mt-auto overflow-hidden">
                <div
                    className="absolute inset-0 z-0 h-full w-[45%]"
                    style={{
                        backgroundColor: accentColor,
                        clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)'
                    }}
                />
                <div className="relative z-10 flex items-center h-full px-16 justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2 shrink-0">
                            {settings?.logoUrl ? (
                                <Image src={settings.logoUrl} alt="Logo" width={48} height={48} className="object-contain" />
                            ) : (
                                <div className="w-8 h-8 rounded-full border-4 border-black" />
                            )}
                        </div>
                        <div className="text-black">
                            <p className="text-lg font-black uppercase tracking-tighter leading-none mb-1">
                                {headerBlock?.data?.from_info?.split('\n')[0] || 'LOGOTIPOEMPRESA'}
                            </p>
                            <p className="text-[10px] font-medium opacity-60">
                                {headerBlock?.data?.company_website || 'Slogan da empresa aqui'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function MonoChromeLayout({ blocks, onUpdateBlock, isReadOnly }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean
}) {
    const headerBlock = blocks.find(b => b.type === 'header')
    const itemsBlock = blocks.find(b => b.type === 'items')
    const paymentBlock = blocks.find(b => b.type === 'payment')

    return (
        <div className="flex-1 flex flex-col bg-[#E5E7EB] text-black p-0 overflow-hidden font-sans">
            {/* Dark Header Section */}
            <div className="bg-[#212529] pt-24 px-20 pb-16 text-white overflow-hidden relative">
                <div className="grid grid-cols-12 gap-8 items-start relative z-10">
                    <div className="col-span-7">
                        <h1 className="text-9xl font-black tracking-tighter uppercase leading-none mb-12 opacity-90">FACTURA</h1>
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Factura para:</h4>
                                <p className="text-2xl font-black">{headerBlock?.data?.to_info || 'Arkhus'}</p>
                                <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line mt-1 opacity-80">
                                    {headerBlock?.data?.to_address || 'Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-5 flex flex-col items-end pt-4">
                        <div className="space-y-1 text-right mb-16">
                            <div className="flex justify-end gap-12">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Factura No.</span>
                                <span className="text-xs font-black w-32">{headerBlock?.data?.doc_num || 'FR-2024-00015'}</span>
                            </div>
                            <div className="flex justify-end gap-12">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Data:</span>
                                <span className="text-xs font-black w-32">{headerBlock?.data?.doc_date || '01/12/2024'}</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Total</span>
                            <h2 className="text-6xl font-black tracking-tighter">
                                {itemsBlock?.data?.total_display || 'AOA 0,00'}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Section - Light Grey Container */}
            <div className="px-20 -mt-8 relative z-20 flex-1">
                <div className="bg-[#F3F4F6] rounded-sm shadow-sm p-12 min-h-[600px] flex flex-col">
                    {/* Header Row */}
                    <div className="flex items-center pb-8 border-b border-gray-200">
                        <div className="flex-1 text-sm font-black text-gray-500 uppercase tracking-widest px-4">Designação</div>
                        <div className="w-[180px] text-sm font-black text-gray-500 uppercase tracking-widest text-right px-4">Preço Unit</div>
                        <div className="w-[100px] text-sm font-black text-gray-500 uppercase tracking-widest text-center px-4">Qtd.</div>
                        <div className="w-[180px] text-sm font-black text-gray-500 uppercase tracking-widest text-right px-4">Total</div>
                    </div>

                    {/* Items List */}
                    <div className="divide-y divide-gray-200">
                        {(itemsBlock?.data?.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-center py-12 transition-all hover:bg-white/40">
                                <div className="flex-1 px-4">
                                    <p className="text-lg font-medium text-gray-700">{item.description || 'Nome do serviço'}</p>
                                </div>
                                <div className="w-[180px] text-lg text-gray-500 text-right px-4">
                                    {(item.price || 0).toLocaleString('pt-AO')}
                                </div>
                                <div className="w-[100px] text-lg text-gray-500 text-center px-4">{item.quantity}</div>
                                <div className="w-[180px] text-lg text-gray-500 text-right px-4">
                                    {((item.price || 0) * (item.quantity || 0)).toLocaleString('pt-AO')}
                                </div>
                            </div>
                        ))}

                        {!isReadOnly && itemsBlock && (
                            <button
                                onClick={() => onUpdateBlock(itemsBlock.id, {
                                    ...itemsBlock.data,
                                    items: [...(itemsBlock.data.items || []), { description: 'Novo registro', details: '', quantity: 1, price: 0 }]
                                })}
                                className="w-full flex items-center justify-center h-20 text-gray-400 hover:text-black hover:bg-white/50 transition-all border-dashed border-t border-gray-200 group gap-2"
                            >
                                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-[0.25em]">Adicionar Linha</span>
                            </button>
                        )}
                    </div>

                    {/* Summary Row */}
                    <div className="mt-auto pt-12 border-t border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Total:</span>
                            <span className="text-sm font-black text-gray-400">{itemsBlock?.data?.subtotal_display || 'AOA 0,00'}</span>
                        </div>
                        <div className="text-right">
                            <h3 className="text-3xl font-black tracking-tighter text-black">
                                {itemsBlock?.data?.total_display || 'AOA 0,00'}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Info Section */}
            <div className="px-24 pt-16 pb-20 space-y-12">
                <div className="space-y-8">
                    <p className="text-sm font-black text-gray-500">{paymentBlock?.data?.footer_message || 'Obrigado pela sua preferência'}</p>

                    <div className="space-y-6">
                        <h4 className="text-sm font-black text-gray-600 uppercase tracking-widest border-b border-gray-300 pb-2 w-fit">Informações bancárias</h4>
                        <div className="grid grid-cols-1 gap-1">
                            <div className="flex gap-4">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-40">Titular da conta:</span>
                                <span className="text-[11px] font-medium text-gray-600">{paymentBlock?.data?.bank_holder || 'Arkhus LDA'}</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-40">No. de conta:</span>
                                <span className="text-[11px] font-medium text-gray-600">{paymentBlock?.data?.bank_account || '0145 4125 2145 1'}</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest w-40">IBAN:</span>
                                <span className="text-[11px] font-medium text-gray-600">{paymentBlock?.data?.bank_iban || '0145 4125 2145 1475 5123 1'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Bar */}
            <div className="h-32 bg-[#D1D5DB] px-24 flex items-center justify-between border-t border-gray-300">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center p-3">
                        <div className="w-full h-full rounded-full border-4 border-white" />
                    </div>
                    <div className="text-black">
                        <p className="text-lg font-black uppercase tracking-tighter leading-none">{headerBlock?.data?.from_info?.split('\n')[0] || 'LOGOTIPOEMPRESA'}</p>
                        <p className="text-[10px] font-medium opacity-50 tracking-wider">Slogan da empresa aqui</p>
                    </div>
                </div>

                <div className="text-right space-y-1 text-gray-600">
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                        {headerBlock?.data?.from_info?.split('\n').slice(1).join(', ') || 'Rua 14, Luanda'}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        {headerBlock?.data?.company_website || 'www.nomedaempresa.com'}
                    </p>
                </div>
            </div>
        </div>
    )
}

export function SimpleRedLayout({ blocks, onUpdateBlock, isReadOnly, settings }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean,
    settings?: DocumentSettings
}) {
    const headerBlock = blocks.find(b => b.type === 'header')
    const itemsBlock = blocks.find(b => b.type === 'items')
    const paymentBlock = blocks.find(b => b.type === 'payment')

    const accentColor = settings?.primaryColor || '#A13B3B'

    return (
        <div className="flex-1 flex flex-col bg-white text-black p-0 overflow-hidden font-sans relative">
            {/* Left Decorative Strips */}
            <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col z-0">
                <div className="h-[20%] bg-[#D1D5DB]" />
                <div className="h-[15%] bg-[#C48B8B]" />
                <div className="h-[15%] bg-[#B56B6B]" />
                <div className="h-[20%] bg-[#A13B3B]" />
                <div className="flex-1 bg-[#8B2E2E]" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col ml-20 px-16 py-16">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-16">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 text-white flex items-center justify-center text-3xl font-black rounded-sm shrink-0" style={{ backgroundColor: accentColor }}>
                            {settings?.logoUrl ? (
                                <Image src={settings.logoUrl} alt="Logo" width={48} height={48} className="w-full h-full object-contain rounded-sm" />
                            ) : (
                                "LG"
                            )}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight uppercase leading-none" style={{ color: accentColor }}>LOGO</h2>
                            <p className="text-[10px] font-bold mt-1 tracking-wider uppercase" style={{ color: accentColor }}>Factura No.</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-6xl font-black tracking-tighter uppercase mb-4" style={{ color: accentColor }}>FACTURA</h1>
                        <div className="flex gap-12 justify-end">
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">Data:</h4>
                                <p className="text-sm font-medium">{headerBlock?.data?.doc_date || '01/12/2024'}</p>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">Factura No.</h4>
                                <p className="text-sm font-medium">{headerBlock?.data?.doc_num || 'FR-2024-00015'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client Section */}
                <div className="mb-16">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: accentColor }}>Factura para:</h4>
                    <p className="text-xl font-black text-gray-900 mb-1">{headerBlock?.data?.to_info || 'Maria Eduarda'}</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed max-w-sm whitespace-pre-line">
                        {headerBlock?.data?.to_address || 'Rua 14, bairro alto, Distrito Urbano de Kinaxixi, Luanda - Angola'}
                    </p>
                </div>

                {/* Items Table */}
                <div className="flex-1 mb-12">
                    <div className="grid grid-cols-12 gap-4 pb-4 mb-4 border-b border-gray-100 italic">
                        <div className="col-span-1 text-sm font-black uppercase">No.</div>
                        <div className="col-span-6 text-sm font-black uppercase">Designação</div>
                        <div className="col-span-2 text-sm font-black uppercase text-center">Preço Unit</div>
                        <div className="col-span-1 text-sm font-black uppercase text-center">Qtd.</div>
                        <div className="col-span-2 text-sm font-black uppercase text-right">Total</div>
                    </div>

                    <div className="space-y-6">
                        {(itemsBlock?.data?.items || []).map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-4 pb-6 border-b border-gray-100 items-start">
                                <div className="col-span-1 text-sm font-black text-gray-900">{(idx + 1).toString().padStart(2, '0')}</div>
                                <div className="col-span-6">
                                    <p className="text-sm font-black uppercase mb-1" style={{ color: accentColor }}>{item.description || 'Nome do serviço'}</p>
                                    <p className="text-[10px] text-gray-400 leading-relaxed">{item.details || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão'}</p>
                                </div>
                                <div className="col-span-2 text-sm font-medium text-gray-900 text-center">{(item.price || 0).toLocaleString('pt-AO')}</div>
                                <div className="col-span-1 text-sm font-medium text-gray-900 text-center">{item.quantity}</div>
                                <div className="col-span-2 text-sm font-black text-gray-900 text-right">{((item.price || 0) * (item.quantity || 0)).toLocaleString('pt-AO')}</div>
                            </div>
                        ))}

                        {!isReadOnly && itemsBlock && (
                            <button
                                onClick={() => onUpdateBlock(itemsBlock.id, {
                                    ...itemsBlock.data,
                                    items: [...(itemsBlock.data.items || []), { description: 'Novo item', details: '', quantity: 1, price: 0 }]
                                })}
                                className="w-full h-12 border-2 border-dashed border-gray-100 rounded-sm flex items-center justify-center text-gray-400 hover:border-gray-300 transition-all gap-2 group mt-4"
                            >
                                <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Linha</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Totals Bar */}
                <div className="py-6 px-12 grid grid-cols-3 gap-8 items-center mb-12" style={{ backgroundColor: accentColor }}>
                    <div className="text-center">
                        <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Sub Total:</h4>
                        <p className="text-2xl font-black text-white">{settings?.currency || 'AOA'} {itemsBlock?.data?.subtotal_display || '0,00'}</p>
                    </div>
                    <div className="text-center">
                        <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Impostos:</h4>
                        <p className="text-2xl font-black text-white">{itemsBlock?.data?.tax_display || '14%'}</p>
                    </div>
                    <div className="text-center">
                        <h4 className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-4">Total</h4>
                        <p className="text-2xl font-black text-white">{itemsBlock?.data?.total_display || '0,00'}</p>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-auto space-y-8">
                    <p className="text-xs font-black text-gray-900">Obrigado pela sua preferência</p>

                    <div className="grid grid-cols-2 gap-12 pb-8 border-b border-gray-100">
                        <div>
                            <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-3">Termos & Condições</h4>
                            <p className="text-[10px] text-gray-400 leading-relaxed italic whitespace-pre-line">
                                {paymentBlock?.data?.terms || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão.'}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Titular da conta:</span>
                                <span className="text-[10px] font-black text-gray-600">{paymentBlock?.data?.bank_holder || 'Arkhus LDA'}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No. de conta:</span>
                                <span className="text-[10px] font-black text-gray-600">{paymentBlock?.data?.bank_account || '0145 4125 2145 1'}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">IBAN:</span>
                                <span className="text-[10px] font-black text-gray-600 uppercase">{paymentBlock?.data?.bank_iban || '0145 4125 2145 1475 5123 1'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 pt-4">
                        <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Endereço</h4>
                            <p className="text-[10px] text-gray-400 leading-relaxed whitespace-pre-line">
                                {headerBlock?.data?.from_info?.split('\n').slice(1).join('\n') || 'Rua 14, bairro alto, Distrito Urbano de Kinaxixi, Luanda - Angola'}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-2">Contactos</h4>
                            <p className="text-[10px] text-gray-400 leading-relaxed block">
                                {paymentBlock?.data?.footer_email || 'info@nomedaempresa.com'}
                            </p>
                            <p className="text-[10px] text-gray-400 leading-relaxed block mt-1">
                                {headerBlock?.data?.company_website || 'www.nomedaempresa.com'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function SplitBlueLayout({ blocks, onUpdateBlock, isReadOnly, settings }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean,
    settings?: DocumentSettings
}) {
    const headerBlock = blocks.find(b => b.type === 'header')
    const itemsBlock = blocks.find(b => b.type === 'items')
    const paymentBlock = blocks.find(b => b.type === 'payment')

    const blueBg = settings?.primaryColor || '#1D437A'
    const darkerBlue = settings?.secondaryColor || '#15325C'

    return (
        <div className="flex-1 flex bg-white text-black p-0 overflow-hidden font-sans min-h-full">
            {/* Main Content - Left Side (White) */}
            <div className="w-[58%] flex flex-col px-12 py-12 relative z-10">
                {/* Logo Section */}
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-20 h-20 text-white flex items-center justify-center text-3xl font-black rounded-sm shrink-0" style={{ backgroundColor: blueBg }}>
                        {settings?.logoUrl ? (
                            <Image src={settings.logoUrl} alt="Logo" width={60} height={60} className="w-full h-full object-contain p-1" />
                        ) : (
                            "LG"
                        )}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight leading-none uppercase" style={{ color: blueBg }}>LOGO</h2>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 tracking-wider uppercase">Factura No.</p>
                    </div>
                </div>

                {/* Sender Info */}
                <div className="mb-12">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: blueBg }}>Factura de:</h4>
                    <p className="text-xl font-black text-gray-900 mb-4">{headerBlock?.data?.from_info?.split('\n')[0] || 'Francisca Paula'}</p>

                    <div className="space-y-4">
                        <div>
                            <span className="block text-[10px] font-black uppercase text-gray-900">Telefone</span>
                            <span className="text-[11px] text-gray-500">+244 925 987 362</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase text-gray-900">E-mail</span>
                            <span className="text-[11px] text-gray-500">{headerBlock?.data?.company_email || 'franciscapaula@gmail.com'}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase text-gray-900">Endereço</span>
                            <span className="text-[11px] text-gray-500 whitespace-pre-line">
                                {headerBlock?.data?.from_info?.split('\n').slice(1).join('\n') || 'Rua 12, Bairro Alto, Luanda'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Left Side Table Part */}
                <div className="flex-1 -mx-12">
                    {/* Header Row Left */}
                    <div className="flex h-12 mb-1">
                        <div className="w-20 flex items-center justify-center text-white text-xs font-bold border-r border-white/20" style={{ backgroundColor: blueBg }}>01</div>
                        <div className="flex-1 flex items-center px-8 text-white text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: darkerBlue }}>Designação</div>
                    </div>

                    {/* Items Left */}
                    <div className="space-y-1">
                        {(itemsBlock?.data?.items || []).map((item, idx) => (
                            <div key={idx} className="flex min-h-[96px]">
                                <div className="w-20 bg-[#F8FAFC] flex items-start justify-center pt-6 text-gray-900 text-xs font-bold border-r border-gray-100">{(idx + 1).toString().padStart(2, '0')}</div>
                                <div className="flex-1 bg-[#F8FAFC] px-8 pt-6 pb-4">
                                    <p className="text-xs font-black text-gray-900 uppercase mb-1">{item.description || 'Nome do serviço'}</p>
                                    <p className="text-[10px] text-gray-400 leading-relaxed max-w-sm">{item.details || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão'}</p>
                                </div>
                            </div>
                        ))}

                        {!isReadOnly && itemsBlock && (
                            <button
                                onClick={() => onUpdateBlock(itemsBlock.id, {
                                    ...itemsBlock.data,
                                    items: [...(itemsBlock.data.items || []), { description: 'Novo item', details: '', quantity: 1, price: 0 }]
                                })}
                                className="w-full h-12 bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#1D437A] transition-all gap-2 group"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Linha</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Left Footer Section */}
                <div className="mt-12 space-y-12">
                    <div>
                        <h4 className="text-sm font-black text-gray-900 mb-6">Obrigado pela sua preferência</h4>

                        <div className="space-y-6">
                            <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 w-fit">Métodos de pagamento</h5>
                            <div className="space-y-1">
                                <div className="flex gap-2 text-[10px]">
                                    <span className="font-black w-24">Titular da conta:</span>
                                    <span className="text-gray-500">{paymentBlock?.data?.bank_holder || 'Arkhus LDA'}</span>
                                </div>
                                <div className="flex gap-2 text-[10px]">
                                    <span className="font-black w-24">No. de conta:</span>
                                    <span className="text-gray-500">{paymentBlock?.data?.bank_account || '0145 4125 2145 1'}</span>
                                </div>
                                <div className="flex gap-2 text-[10px]">
                                    <span className="font-black w-24">IBAN:</span>
                                    <span className="text-gray-500">{paymentBlock?.data?.bank_iban || '0145 4125 2145 1475 5123 1'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h5 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Termos & Condições</h5>
                        <p className="text-[10px] text-gray-400 leading-relaxed italic max-w-md">
                            {paymentBlock?.data?.terms || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side (Deep Blue) */}
            <div className="flex-1 flex flex-col" style={{ backgroundColor: blueBg }}>
                {/* Header Right */}
                <div className="px-12 pt-24 pb-12 text-right">
                    <h1 className="text-7xl font-black text-white tracking-tighter uppercase">FACTURA</h1>
                </div>

                {/* Right Side Table Part */}
                <div className="flex-1">
                    {/* Header Row Right */}
                    <div className="flex h-12 mb-1 px-8 items-center text-white text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: darkerBlue }}>
                        <div className="flex-1 text-center">Preço Unit</div>
                        <div className="w-[80px] text-center">Qtd.</div>
                        <div className="w-[100px] text-right">Total</div>
                    </div>

                    {/* Items Right */}
                    <div className="space-y-1">
                        {(itemsBlock?.data?.items || []).map((item, idx) => (
                            <div key={idx} className="flex min-h-[96px] px-8 items-center text-white" style={{ backgroundColor: `${darkerBlue}40` }}>
                                <div className="flex-1 text-center text-xs font-bold">
                                    AOA {(item.price || 0).toLocaleString('pt-AO')}
                                </div>
                                <div className="w-[80px] text-center text-xs font-black">
                                    {item.quantity}
                                </div>
                                <div className="w-[100px] text-right text-xs font-bold">
                                    {((item.price || 0) * (item.quantity || 0)).toLocaleString('pt-AO')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary Section Right */}
                <div className="px-12 py-12 space-y-3">
                    <div className="flex justify-end gap-12 text-white">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Subtotal:</span>
                        <span className="text-xs font-black min-w-[120px] text-right">AOA {itemsBlock?.data?.subtotal_display || '0,00'}</span>
                    </div>
                    <div className="flex justify-end gap-12 text-white">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Desconto:</span>
                        <span className="text-xs font-black min-w-[120px] text-right">AOA {itemsBlock?.data?.discount_display || '0,00'}</span>
                    </div>
                    <div className="flex justify-end gap-12 text-white">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Impostos:</span>
                        <span className="text-xs font-black min-w-[120px] text-right">AOA {itemsBlock?.data?.tax_amount_display || '0,00'}</span>
                    </div>
                </div>

                {/* Final Total Box */}
                <div className="px-12 py-12 flex justify-between items-center mt-auto" style={{ backgroundColor: darkerBlue }}>
                    <span className="text-4xl font-black text-white italic">Total:</span>
                    <span className="text-4xl font-black text-white">{itemsBlock?.data?.total_display || 'AOA 0,00'}</span>
                </div>
            </div>
        </div>
    )
}

export function SplitGreenLayout({ blocks, onUpdateBlock, isReadOnly, settings }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean,
    settings?: DocumentSettings
}) {
    const headerBlock = blocks.find(b => b.type === 'header')
    const itemsBlock = blocks.find(b => b.type === 'items')
    const paymentBlock = blocks.find(b => b.type === 'payment')

    const greenBg = '#4CAF50'
    const darkerGreen = '#388E3C'

    return (
        <div className="flex-1 flex bg-white text-black p-0 overflow-hidden font-sans min-h-full">
            {/* Main Content - Left Side (White) */}
            <div className="w-[58%] flex flex-col px-12 py-12 relative z-10">
                {/* Logo Section */}
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-20 h-20 text-white flex items-center justify-center text-3xl font-black rounded-sm shrink-0" style={{ backgroundColor: greenBg }}>
                        {settings?.logoUrl ? (
                            <Image src={settings.logoUrl} alt="Logo" width={60} height={60} className="w-full h-full object-contain p-1" />
                        ) : (
                            "LG"
                        )}
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight leading-none uppercase" style={{ color: greenBg }}>LOGO</h2>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 tracking-wider uppercase">Factura No.</p>
                    </div>
                </div>

                {/* Sender Info */}
                <div className="mb-12">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: greenBg }}>Factura de:</h4>
                    <p className="text-xl font-black text-gray-900 mb-4">{headerBlock?.data?.from_info?.split('\n')[0] || 'Francisca Paula'}</p>

                    <div className="space-y-4">
                        <div>
                            <span className="block text-[10px] font-black uppercase text-gray-900">Telefone</span>
                            <span className="text-[11px] text-gray-500">+244 925 987 362</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase text-gray-900">E-mail</span>
                            <span className="text-[11px] text-gray-500">{headerBlock?.data?.company_email || 'franciscapaula@gmail.com'}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] font-black uppercase text-gray-900">Endereço</span>
                            <span className="text-[11px] text-gray-500 whitespace-pre-line">
                                {headerBlock?.data?.from_info?.split('\n').slice(1).join('\n') || 'Rua 12, Bairro Alto, Luanda'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Left Side Table Part */}
                <div className="flex-1 -mx-12">
                    {/* Header Row Left */}
                    <div className="flex h-12 mb-1">
                        <div className="w-20 flex items-center justify-center text-white text-xs font-bold border-r border-white/20" style={{ backgroundColor: greenBg }}>01</div>
                        <div className="flex-1 flex items-center px-8 text-white text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: darkerGreen }}>Designação</div>
                    </div>

                    {/* Items Left */}
                    <div className="space-y-1">
                        {(itemsBlock?.data?.items || []).map((item, idx) => (
                            <div key={idx} className="flex min-h-[96px]">
                                <div className="w-20 bg-[#F8FAFC] flex items-start justify-center pt-6 text-gray-900 text-xs font-bold border-r border-gray-100">{(idx + 1).toString().padStart(2, '0')}</div>
                                <div className="flex-1 bg-[#F8FAFC] px-8 pt-6 pb-4">
                                    <p className="text-xs font-black text-gray-900 uppercase mb-1">{item.description || 'Nome do serviço'}</p>
                                    <p className="text-[10px] text-gray-400 leading-relaxed max-w-sm">{item.details || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão'}</p>
                                </div>
                            </div>
                        ))}

                        {!isReadOnly && itemsBlock && (
                            <button
                                onClick={() => onUpdateBlock(itemsBlock.id, {
                                    ...itemsBlock.data,
                                    items: [...(itemsBlock.data.items || []), { description: 'Novo item', details: '', quantity: 1, price: 0 }]
                                })}
                                className="w-full h-12 bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#4CAF50] transition-all gap-2 group"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Linha</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Left Footer Section */}
                <div className="mt-12 space-y-12">
                    <div>
                        <h4 className="text-sm font-black text-gray-900 mb-6">Obrigado pela sua preferência</h4>

                        <div className="space-y-6">
                            <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2 w-fit">Métodos de pagamento</h5>
                            <div className="space-y-1">
                                <div className="flex gap-2 text-[10px]">
                                    <span className="font-black w-24">Titular da conta:</span>
                                    <span className="text-gray-500">{paymentBlock?.data?.bank_holder || 'Arkhus LDA'}</span>
                                </div>
                                <div className="flex gap-2 text-[10px]">
                                    <span className="font-black w-24">No. de conta:</span>
                                    <span className="text-gray-500">{paymentBlock?.data?.bank_account || '0145 4125 2145 1'}</span>
                                </div>
                                <div className="flex gap-2 text-[10px]">
                                    <span className="font-black w-24">IBAN:</span>
                                    <span className="text-gray-500">{paymentBlock?.data?.bank_iban || '0145 4125 2145 1475 5123 1'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h5 className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Termos & Condições</h5>
                        <p className="text-[10px] text-gray-400 leading-relaxed italic max-w-md">
                            {paymentBlock?.data?.terms || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side (Deep Green) */}
            <div className="flex-1" style={{ backgroundColor: greenBg }}>
                {/* Header Right */}
                <div className="px-12 pt-24 pb-12 text-right">
                    <h1 className="text-7xl font-black text-white tracking-tighter uppercase">FACTURA</h1>
                </div>

                {/* Right Side Table Part */}
                <div className="flex-1">
                    {/* Header Row Right */}
                    <div className="flex h-12 mb-1 px-8 items-center text-white text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: darkerGreen }}>
                        <div className="flex-1 text-center">Preço Unit</div>
                        <div className="w-[80px] text-center">Qtd.</div>
                        <div className="w-[100px] text-right">Total</div>
                    </div>

                    {/* Items Right */}
                    <div className="space-y-1">
                        {(itemsBlock?.data?.items || []).map((item, idx) => (
                            <div key={idx} className="flex min-h-[96px] px-8 items-center text-white" style={{ backgroundColor: `${darkerGreen}40` }}>
                                <div className="flex-1 text-center text-xs font-bold">
                                    AOA {(item.price || 0).toLocaleString('pt-AO')}
                                </div>
                                <div className="w-[80px] text-center text-xs font-black">
                                    {item.quantity}
                                </div>
                                <div className="w-[100px] text-right text-xs font-bold">
                                    {((item.price || 0) * (item.quantity || 0)).toLocaleString('pt-AO')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary Section Right */}
                <div className="px-12 py-12 space-y-3">
                    <div className="flex justify-end gap-12 text-white">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Subtotal:</span>
                        <span className="text-xs font-black min-w-[120px] text-right">AOA {itemsBlock?.data?.subtotal_display || '0,00'}</span>
                    </div>
                    <div className="flex justify-end gap-12 text-white">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Desconto:</span>
                        <span className="text-xs font-black min-w-[120px] text-right">AOA {itemsBlock?.data?.discount_display || '0,00'}</span>
                    </div>
                    <div className="flex justify-end gap-12 text-white">
                        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Impostos:</span>
                        <span className="text-xs font-black min-w-[120px] text-right">AOA {itemsBlock?.data?.tax_amount_display || '0,00'}</span>
                    </div>
                </div>

                {/* Final Total Box */}
                <div className="px-12 py-12 flex justify-between items-center mt-auto" style={{ backgroundColor: '#2E7D32' }}>
                    <span className="text-4xl font-black text-white italic">Total:</span>
                    <span className="text-4xl font-black text-white">{itemsBlock?.data?.total_display || 'AOA 0,00'}</span>
                </div>
            </div>
        </div>
    )
}

export function ModernOrangeLayout({ blocks, onUpdateBlock, isReadOnly, settings }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean,
    settings?: DocumentSettings
}) {
    const headerBlock = blocks.find(b => b.type === 'header')
    const itemsBlock = blocks.find(b => b.type === 'items')
    const paymentBlock = blocks.find(b => b.type === 'payment')

    const orangeColor = settings?.primaryColor || '#F97316'

    return (
        <div className="flex-1 flex flex-col bg-white text-black p-0 overflow-hidden font-sans relative">
            {/* Horizontal Top Strip */}
            <div className="absolute top-0 right-0 w-16 bottom-0" style={{ backgroundColor: orangeColor }} />

            <div className="flex-1 flex flex-col mr-16 px-12 py-12 relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-20">
                    <div className="space-y-4">
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-6xl font-black tracking-tighter uppercase leading-none" style={{ color: orangeColor }}>LOGO</h2>
                        </div>
                        <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: orangeColor }}>Factura No.</p>
                    </div>

                    <div className="text-right">
                        <h1 className="text-7xl font-black tracking-tighter uppercase mb-6 leading-none" style={{ color: orangeColor }}>FACTURA</h1>
                        <div className="flex gap-12 justify-end text-sm">
                            <div className="flex gap-4">
                                <span className="font-black uppercase tracking-widest">Data:</span>
                                <span>{headerBlock?.data?.doc_date || '01/12/2024'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Client Section & Invoice Num */}
                <div className="grid grid-cols-2 gap-12 mb-20">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: orangeColor }}>Factura No.</p>
                        <p className="text-xl font-black text-gray-900">{headerBlock?.data?.doc_num || 'FR-2024-00015'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: orangeColor }}>Factura No.</p>
                        <h3 className="text-4xl font-black text-gray-900 mb-2">{headerBlock?.data?.to_info || 'Maria Eduarda'}</h3>
                        <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">
                            {headerBlock?.data?.to_address || 'Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola'}
                        </p>
                    </div>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 pb-6 border-b-2 border-gray-900 mb-4 items-center">
                    <div className="col-span-6 text-2xl font-black uppercase tracking-tight">Designação</div>
                    <div className="col-span-2 text-xl font-black uppercase tracking-tight text-center">Preço Unit</div>
                    <div className="col-span-2 text-xl font-black uppercase tracking-tight text-center">Qtd.</div>
                    <div className="col-span-2 text-xl font-black uppercase tracking-tight text-right">Total</div>
                </div>

                {/* Items List */}
                <div className="flex-1 space-y-4 mb-20">
                    {(itemsBlock?.data?.items || []).map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 pb-4 border-b border-gray-100 items-start">
                            <div className="col-span-6">
                                <p className="text-xl font-black text-gray-900">{item.description || 'Nome do serviço'}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{item.details || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão'}</p>
                            </div>
                            <div className="col-span-2 text-sm font-medium text-gray-900 text-center pt-2">
                                AOA {(item.price || 0).toLocaleString('pt-AO')}
                            </div>
                            <div className="col-span-2 text-sm font-black text-gray-900 text-center pt-2">
                                {item.quantity}
                            </div>
                            <div className="col-span-2 text-sm font-black text-gray-900 text-right pt-2">
                                {((item.price || 0) * (item.quantity || 0)).toLocaleString('pt-AO')}
                            </div>
                        </div>
                    ))}

                    {!isReadOnly && itemsBlock && (
                        <button
                            onClick={() => onUpdateBlock(itemsBlock.id, {
                                ...itemsBlock.data,
                                items: [...(itemsBlock.data.items || []), { description: 'Novo item', details: '', quantity: 1, price: 0 }]
                            })}
                            className="w-full h-12 flex items-center justify-center text-gray-300 transition-all gap-2 group mt-4 border-2 border-dashed border-gray-50"
                            style={{ '--hover-color': orangeColor } as React.CSSProperties}
                        >
                            <Plus className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Adicionar Registro</span>
                        </button>
                    )}
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-2 gap-12 mb-20 items-end">
                    <div className="space-y-8">
                        <div>
                            <p className="text-xs font-black text-gray-900 mb-2 uppercase tracking-widest leading-none">Obrigado pela sua preferência</p>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Informações bancárias</h4>
                            <div className="space-y-1 text-[10px]">
                                <div className="flex gap-4">
                                    <span className="text-gray-400 w-24">Titular da conta:</span>
                                    <span className="font-black">{paymentBlock?.data?.bank_holder || 'Arkhus LDA'}</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-gray-400 w-24">No. de conta:</span>
                                    <span className="font-black">{paymentBlock?.data?.bank_account || '0145 4125 2145 1'}</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="text-gray-400 w-24">IBAN:</span>
                                    <span className="font-black uppercase">{paymentBlock?.data?.bank_iban || '0145 4125 2145 1475 5123 1'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-gray-400 text-lg">
                            <span className="font-bold uppercase tracking-tight">Sub Total:</span>
                            <span className="font-black text-gray-900">AOA {itemsBlock?.data?.subtotal_display || '0,00'}</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-400 text-lg">
                            <span className="font-bold uppercase tracking-tight">Impostos:</span>
                            <span className="font-black text-gray-900">14%</span>
                        </div>
                        <div className="bg-[#F97316] p-6 flex justify-between items-center text-white" style={{ backgroundColor: orangeColor }}>
                            <span className="text-2xl font-black italic uppercase">Total:</span>
                            <span className="text-2xl font-black">{itemsBlock?.data?.total_display || '0,00'}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Graphic Decoration */}
                <div className="mt-auto -ml-12 w-32 h-64" style={{ backgroundColor: orangeColor }} />
            </div>
        </div>
    )
}

export function GreenHighlightLayout({ blocks, onUpdateBlock, isReadOnly, settings }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean,
    settings?: DocumentSettings
}) {
    const headerBlock = blocks.find(b => b.type === 'header')
    const itemsBlock = blocks.find(b => b.type === 'items')
    const paymentBlock = blocks.find(b => b.type === 'payment')

    return (
        <div className="flex-1 flex flex-col bg-white text-black p-0 overflow-hidden font-sans">
            {/* Header Section */}
            <div className="px-12 py-12 grid grid-cols-12 gap-8 items-start">
                <div className="col-span-4 flex items-center gap-4">
                    <div className="w-16 h-16 text-black flex items-center justify-center text-3xl font-black rounded-sm shrink-0" style={{ backgroundColor: settings?.secondaryColor || '#84CC16' }}>
                        {settings?.logoUrl ? (
                            <Image src={settings.logoUrl} alt="Logo" width={48} height={48} className="w-full h-full object-contain p-1" />
                        ) : (
                            "LG"
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">LOGO</h2>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 tracking-wider uppercase">Factura No.</p>
                    </div>
                </div>

                <div className="col-span-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: settings?.secondaryColor || '#84CC16' }}>Factura de:</h4>
                    <p className="text-xl font-black text-gray-900 mb-2">{headerBlock?.data?.from_info?.split('\n')[0] || 'Francisca Paula'}</p>
                    <div className="space-y-1 text-[10px]">
                        <div className="flex gap-2">
                            <span className="font-black w-12 text-gray-900">Telefone</span>
                            <span className="text-gray-500">{headerBlock?.data?.from_phone || '+244 925 987 362'}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-black w-12 text-gray-900">E-mail</span>
                            <span className="text-gray-500">{headerBlock?.data?.company_email || 'franciscapaula@gmail.com'}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-black w-12 text-gray-900">Endereço</span>
                            <span className="text-gray-500">{headerBlock?.data?.from_info?.split('\n').slice(1).join(', ') || 'Rua 12, Bairro Alto, Luanda'}</span>
                        </div>
                    </div>
                </div>

                <div className="col-span-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: settings?.secondaryColor || '#84CC16' }}>Factura para:</h4>
                    <p className="text-xl font-black text-gray-900 mb-2">{headerBlock?.data?.to_info || 'Maria Eduarda'}</p>
                    <div className="space-y-1 text-[10px]">
                        <div className="flex gap-2">
                            <span className="font-black w-12 text-gray-900">Telefone</span>
                            <span className="text-gray-500">{headerBlock?.data?.to_phone || '+244 929 984 745'}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-black w-12 text-gray-900">E-mail</span>
                            <span className="text-gray-500">{headerBlock?.data?.to_email || 'mariaeduarda@gmail.com'}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="font-black w-12 text-gray-900">Endereço</span>
                            <span className="text-gray-500">{headerBlock?.data?.to_address || 'Rua 16, Bairro St. André, Luanda'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Highlight Body Section */}
            <div className="flex-1 flex flex-col pt-16 px-12 min-h-[600px] relative" style={{ backgroundColor: settings?.secondaryColor || '#84CC16' }}>
                <div className="absolute top-8 left-12 right-12 h-0.5 bg-black/20" />

                {/* Table Header */}
                <div className="flex py-6 border-b border-black/10">
                    <div className="flex-1 text-2xl font-black uppercase tracking-tight">Designação</div>
                    <div className="w-[180px] text-2xl font-black uppercase tracking-tight text-center">Preço Unit</div>
                    <div className="w-[100px] text-2xl font-black uppercase tracking-tight text-center">Qtd.</div>
                    <div className="w-[180px] text-2xl font-black uppercase tracking-tight text-right">Total</div>
                </div>

                {/* Items List */}
                <div className="flex-1 divide-y divide-black/10">
                    {(itemsBlock?.data?.items || []).map((item, idx) => (
                        <div key={idx} className="flex py-8 items-start">
                            <div className="flex-1">
                                <p className="text-xl font-black">{item.description || 'Nome do serviço'}</p>
                                <p className="text-[10px] opacity-60 mt-1 max-w-sm">{item.details || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão'}</p>
                            </div>
                            <div className="w-[180px] text-lg font-medium text-center pt-1">
                                AOA {(item.price || 0).toLocaleString('pt-AO')}
                            </div>
                            <div className="w-[100px] text-lg font-black text-center pt-1">
                                {item.quantity}
                            </div>
                            <div className="w-[180px] text-lg font-black text-right pt-1">
                                {((item.price || 0) * (item.quantity || 0)).toLocaleString('pt-AO')}
                            </div>
                        </div>
                    ))}

                    {!isReadOnly && itemsBlock && (
                        <button
                            onClick={() => onUpdateBlock(itemsBlock.id, {
                                ...itemsBlock.data,
                                items: [...(itemsBlock.data.items || []), { description: 'Novo item', details: '', quantity: 1, price: 0 }]
                            })}
                            className="w-full h-16 flex items-center justify-center text-black/40 hover:text-black transition-all gap-2 group mt-4 border-2 border-dashed border-black/10 hover:border-black/30"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Adicionar Registro</span>
                        </button>
                    )}
                </div>

                {/* Totals Section */}
                <div className="py-12 space-y-4">
                    <div className="flex justify-end gap-12 items-baseline">
                        <span className="text-2xl font-black uppercase tracking-tight">Subtotal:</span>
                        <span className="text-2xl font-black">AOA {itemsBlock?.data?.subtotal_display || '0,00'}</span>
                    </div>
                    <div className="flex justify-end gap-12 items-baseline text-black/60">
                        <span className="text-2xl font-black uppercase tracking-tight">Impostos:</span>
                        <span className="text-2xl font-black">{itemsBlock?.data?.tax_display || '00'}</span>
                    </div>
                    <div className="flex justify-end gap-12 items-baseline">
                        <span className="text-2xl font-black uppercase tracking-tight">Total:</span>
                        <span className="text-2xl font-black italic underline decoration-2 underline-offset-8">AOA {itemsBlock?.data?.total_display || '0,00'}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="px-12 py-12 flex flex-col gap-12">
                <div className="space-y-6">
                    <h5 className="text-[11px] font-black uppercase tracking-[0.2em]">Total</h5>
                    <div className="p-10 w-fit rounded-sm shadow-sm" style={{ backgroundColor: settings?.secondaryColor || '#84CC16' }}>
                        <span className="text-4xl font-black tracking-tight">{itemsBlock?.data?.total_display || 'AOA 0,00'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-12 pt-12 border-t border-gray-100 italic">
                    <div className="col-span-3">
                        <h6 className="text-sm font-black text-gray-900 mb-4 not-italic">Endereço</h6>
                        <p className="text-[10px] text-gray-400 leading-relaxed uppercase whitespace-pre-line">
                            {headerBlock?.data?.from_info?.split('\n').slice(1).join(', ') || 'Rua 14, bairro alto, Distrito Urbano de Kinaxixi, Luanda - Angola'}
                        </p>
                        <p className="text-[10px] font-black text-gray-900 mt-2 not-italic">{headerBlock?.data?.company_website || 'www.suaempresa.com'}</p>
                    </div>

                    <div className="col-span-4 border-l border-gray-100 pl-12">
                        <h6 className="text-sm font-black text-gray-900 mb-4 not-italic">Métodos de pagamento</h6>
                        <div className="space-y-1 text-[10px]">
                            <div className="flex gap-2">
                                <span className="font-black w-24 not-italic">Titular da conta:</span>
                                <span className="text-gray-500">{paymentBlock?.data?.bank_holder || 'Arkhus LDA'}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-black w-24 not-italic">No. de conta:</span>
                                <span className="text-gray-500">{paymentBlock?.data?.bank_account || '0145 4125 2145 1'}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="font-black w-24 not-italic">IBAN:</span>
                                <span className="text-gray-500">{paymentBlock?.data?.bank_iban || '0145 4125 2145 1475 5123 1'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-5 border-l border-gray-100 pl-12">
                        <h6 className="text-sm font-black text-gray-900 mb-4 not-italic">Termos & Condições</h6>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                            {paymentBlock?.data?.terms || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export function VerticalGreenLayout({ blocks, onUpdateBlock, isReadOnly, settings }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean,
    settings?: DocumentSettings
}) {
    const headerBlock = blocks.find(b => b.type === 'header')
    const itemsBlock = blocks.find(b => b.type === 'items')
    const paymentBlock = blocks.find(b => b.type === 'payment')

    return (
        <div className="flex-1 flex bg-white text-black p-0 overflow-hidden font-sans min-h-full relative">
            {/* Dark Green Vertical Sidebar */}
            <div className="w-[280px] flex flex-col p-8 text-white relative z-20" style={{ backgroundColor: settings?.primaryColor || '#16423C' }}>
                <div className="mb-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-white p-1 rounded-sm">
                            {settings?.logoUrl ? (
                                <Image src={settings.logoUrl} alt="Logo" width={40} height={40} className="w-10 h-10 object-contain" />
                            ) : (
                                <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-gray-500 font-bold">LG</div>
                            )}
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter">LOGO</h2>
                    </div>
                    <div className="space-y-1 text-[10px] opacity-70">
                        <p>Factura No. {headerBlock?.data?.doc_num || 'FR-2024-00015'}</p>
                        <p>Data: {headerBlock?.data?.doc_date || '01/12/2024'}</p>
                        <p>Conta No. 4582 4752 4512 5685</p>
                    </div>
                </div>

                <div className="mt-auto">
                    <h1 className="text-[120px] font-black leading-none opacity-20 origin-bottom-left -rotate-90 whitespace-nowrap -translate-x-8 translate-y-24">FACTURA</h1>
                    <div className="space-y-4 pt-48 border-t border-white/10">
                        <div>
                            <h6 className="text-[10px] font-black uppercase tracking-widest text-[#84CC16] mb-2" style={{ color: settings?.secondaryColor || '#84CC16' }}>Endereço</h6>
                            <p className="text-[10px] opacity-60 leading-relaxed max-w-[180px]">
                                {headerBlock?.data?.from_info?.split('\n').slice(1).join(', ') || 'Rua 14, bairro alto, Distrito Urbano de Kinaxixi, Luanda - Angola'}
                            </p>
                        </div>
                        <p className="text-[10px] font-black" style={{ color: settings?.secondaryColor || '#84CC16' }}>{headerBlock?.data?.company_website || 'www.suaempresa.com'}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-12 bg-white relative z-10">
                {/* Top Info Grid */}
                <div className="grid grid-cols-2 gap-12 mb-20">
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: settings?.primaryColor || '#16423C' }}>Factura de:</h4>
                        <p className="text-2xl font-black text-gray-900 mb-4">{headerBlock?.data?.from_info?.split('\n')[0] || 'Francisca Paula'}</p>
                        <div className="space-y-2 text-[10px]">
                            <div className="flex gap-4">
                                <span className="font-black text-gray-900 w-16">Telefone</span>
                                <span className="text-gray-500">{headerBlock?.data?.from_phone || '+244 925 987 362'}</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="font-black text-gray-900 w-16">E-mail</span>
                                <span className="text-gray-500">{headerBlock?.data?.company_email || 'franciscapaula@gmail.com'}</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="font-black text-gray-900 w-16">Endereço</span>
                                <span className="text-gray-500 max-w-[180px]">{headerBlock?.data?.from_info?.split('\n').slice(1).join(', ') || 'Rua 12, Bairro Alto, Luanda'}</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-4" style={{ color: settings?.primaryColor || '#16423C' }}>Factura para:</h4>
                        <p className="text-2xl font-black text-gray-900 mb-4">{headerBlock?.data?.to_info || 'Maria Eduarda'}</p>
                        <div className="space-y-2 text-[10px]">
                            <div className="flex gap-4">
                                <span className="font-black text-gray-900 w-16">Telefone</span>
                                <span className="text-gray-500">{headerBlock?.data?.to_phone || '+244 929 984 745'}</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="font-black text-gray-900 w-16">E-mail</span>
                                <span className="text-gray-500">{headerBlock?.data?.to_email || 'mariaeduarda@gmail.com'}</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="font-black text-gray-900 w-16">Endereço</span>
                                <span className="text-gray-500 max-w-[180px]">{headerBlock?.data?.to_address || 'Rua 16, Bairro St. André, Luanda'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1">
                    <div className="flex h-16 items-center px-8 mb-8 rounded-sm" style={{ backgroundColor: settings?.secondaryColor || '#84CC16' }}>
                        <div className="flex-1 text-xl font-black uppercase tracking-tight">Designação</div>
                        <div className="w-[140px] text-xl font-black uppercase tracking-tight text-center">Preço Unit</div>
                        <div className="w-[100px] text-xl font-black uppercase tracking-tight text-center">Qtd.</div>
                        <div className="w-[140px] text-xl font-black uppercase tracking-tight text-right">Total</div>
                    </div>

                    <div className="space-y-6 px-8">
                        {(itemsBlock?.data?.items || []).map((item, idx) => (
                            <div key={idx} className="flex items-start pb-6 border-b border-gray-100">
                                <div className="flex-1">
                                    <p className="text-lg font-black text-gray-900">{item.description || 'Nome do serviço'}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 max-w-md">{item.details || 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão'}</p>
                                </div>
                                <div className="w-[140px] text-base font-medium text-center pt-1 text-gray-900">
                                    AOA {(item.price || 0).toLocaleString('pt-AO')}
                                </div>
                                <div className="w-[100px] text-base font-black text-center pt-1 text-gray-900">
                                    {item.quantity}
                                </div>
                                <div className="w-[140px] text-base font-black text-right pt-1 text-gray-900">
                                    {((item.price || 0) * (item.quantity || 0)).toLocaleString('pt-AO')}
                                </div>
                            </div>
                        ))}

                        {!isReadOnly && itemsBlock && (
                            <button
                                onClick={() => onUpdateBlock(itemsBlock.id, {
                                    ...itemsBlock.data,
                                    items: [...(itemsBlock.data.items || []), { description: 'Novo item', details: '', quantity: 1, price: 0 }]
                                })}
                                className="w-full h-12 flex items-center justify-center text-gray-300 hover:text-black transition-all gap-2 group mt-4 border-2 border-dashed border-gray-50 hover:border-black/30"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Adicionar Registro</span>
                            </button>
                        )}
                    </div>

                    {/* Summary and Totals Area */}
                    <div className="mt-12 flex justify-between items-start">
                        <div className="space-y-6 w-1/2">
                            <div>
                                <h5 className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: settings?.primaryColor || '#16423C' }}>Formas de pagamento</h5>
                                <div className="space-y-2 text-[10px]">
                                    <div className="flex gap-4">
                                        <span className="font-black text-gray-900 w-24">Titular da conta:</span>
                                        <span className="text-gray-400">{paymentBlock?.data?.bank_holder || 'Arkhus LDA'}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="font-black text-gray-900 w-24">No. de conta:</span>
                                        <span className="text-gray-400">{paymentBlock?.data?.bank_account || '0145 4125 2145 1'}</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <span className="font-black text-gray-900 w-24">IBAN:</span>
                                        <span className="text-gray-400">{paymentBlock?.data?.bank_iban || 'AO06 0145 4125 2145 1475 5123 1'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-8 items-start">
                            <div className="space-y-3 text-right">
                                <div className="text-[11px] font-black uppercase text-gray-400">Sub Total:</div>
                                <div className="text-[11px] font-black uppercase text-gray-400">Impostos:</div>
                                <div className="text-[11px] font-black uppercase text-gray-400">Descontos:</div>
                                <div className="text-[11px] font-black uppercase text-gray-400">Total:</div>
                            </div>
                            <div className="space-y-3 text-right pr-4 min-w-[120px]">
                                <div className="text-[11px] font-black text-gray-900">AOA {itemsBlock?.data?.subtotal_display || '0,00'}</div>
                                <div className="text-[11px] font-black text-gray-900">AOA {itemsBlock?.data?.tax_amount_display || '0,00'}</div>
                                <div className="text-[11px] font-black text-gray-900">AOA {itemsBlock?.data?.discount_display || '0,00'}</div>
                                <div className="text-[11px] font-black text-gray-900">AOA {itemsBlock?.data?.total_display || '0,00'}</div>
                            </div>
                            <div className="p-10 flex items-center justify-center rounded-sm" style={{ backgroundColor: settings?.secondaryColor || '#84CC16' }}>
                                <span className="text-2xl font-black" style={{ color: settings?.primaryColor || '#16423C' }}>AOA {itemsBlock?.data?.total_display || '0,00'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visual Separator */}
                <div className="h-0.5 w-full bg-gray-900/10 mt-12 mb-auto" />

                {/* Bottom Border Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-16" style={{ backgroundColor: settings?.secondaryColor || '#84CC16' }} />
            </div>
        </div>
    )
}

export function ModernPinkLayout({ blocks, onUpdateBlock, isReadOnly, settings }: {
    blocks: Array<{ id: string; type: string; data: BlockData }>,
    onUpdateBlock: (id: string, data: BlockData) => void,
    isReadOnly?: boolean,
    settings?: DocumentSettings
}) {
    const headerBlock = blocks.find(b => b.type === 'header')
    const itemsBlock = blocks.find(b => b.type === 'items')
    const paymentBlock = blocks.find(b => b.type === 'payment')

    const pinkColor = settings?.primaryColor || '#FF007A'

    return (
        <div className="flex-1 flex flex-col bg-[#1E2129] text-white p-0 overflow-hidden font-sans min-h-full">
            {/* Dark Header */}
            <div className="px-12 pt-16 pb-12 text-left">
                <h1 className="text-[110px] font-black leading-none tracking-tighter uppercase mb-2" style={{ color: pinkColor }}>FACTURA</h1>
                <div className="h-1.5 w-full" style={{ backgroundColor: pinkColor }} />
            </div>

            {/* Top Grid */}
            <div className="grid grid-cols-2 gap-20 px-12 mb-20">
                <div className="space-y-4">
                    <div>
                        <h4 className="text-base font-black uppercase tracking-tight text-white mb-2">Factura para:</h4>
                        <h3 className="text-3xl font-black text-white">{headerBlock?.data?.to_info || 'Arkhus'}</h3>
                    </div>
                    <div className="text-[11px] text-gray-400 leading-relaxed uppercase space-y-1">
                        <p>{headerBlock?.data?.to_address || 'Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola'}</p>
                    </div>
                </div>

                <div className="flex gap-12 justify-end">
                    <div className="space-y-1">
                        <div className="text-base font-black uppercase text-white">Factura No.</div>
                        <div className="text-base font-black uppercase text-white">Data:</div>
                    </div>
                    <div className="space-y-1 text-right">
                        <div className="text-base font-medium text-gray-400">{headerBlock?.data?.doc_num || 'FR-2024-00015'}</div>
                        <div className="text-base font-medium text-gray-400">{headerBlock?.data?.doc_date || '01/12/2024'}</div>
                    </div>
                </div>
            </div>

            {/* Light Content Body */}
            <div className="flex-1 bg-white text-gray-900 rounded-t-[40px] px-12 pt-16 pb-12">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 pb-8 border-b border-gray-100 text-sm font-black text-gray-400 uppercase tracking-widest">
                    <div className="col-span-1">No.</div>
                    <div className="col-span-4 translate-x-4">Designação</div>
                    <div className="col-span-2 text-center">Preço Unit</div>
                    <div className="col-span-1 text-center">Qtd.</div>
                    <div className="col-span-2 text-center">Área</div>
                    <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-gray-50 flex-1">
                    {(itemsBlock?.data?.items || []).map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 py-8 items-center">
                            <div className="col-span-1 text-lg font-medium text-gray-400">{idx + 1}</div>
                            <div className="col-span-4 translate-x-4">
                                <p className="text-xl font-medium text-gray-500">{item.description || 'Nome do serviço'}</p>
                            </div>
                            <div className="col-span-2 text-xl font-medium text-gray-500 text-center">
                                {(item.price || 0).toLocaleString('pt-AO')}
                            </div>
                            <div className="col-span-1 text-xl font-medium text-gray-500 text-center">
                                {item.quantity}
                            </div>
                            <div className="col-span-2 text-xl font-medium text-gray-400 text-center uppercase">00</div>
                            <div className="col-span-2 text-xl font-medium text-gray-400 text-right">
                                {((item.price || 0) * (item.quantity || 0)).toLocaleString('pt-AO')}
                            </div>
                        </div>
                    ))}

                    {!isReadOnly && itemsBlock && (
                        <button
                            onClick={() => onUpdateBlock(itemsBlock.id, {
                                ...itemsBlock.data,
                                items: [...(itemsBlock.data.items || []), { description: 'Novo item', details: '', quantity: 1, price: 0 }]
                            })}
                            className="w-full h-16 flex items-center justify-center text-gray-200 hover:text-black transition-all gap-2 group mt-4 border-2 border-dashed border-gray-50 hover:border-black/30"
                            style={{ '--hover-color': pinkColor } as React.CSSProperties}
                        >
                            <Plus className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Adicionar Registro</span>
                        </button>
                    )}
                </div>

                {/* Totals Section */}
                <div className="mt-auto pt-24 border-t border-gray-100 grid grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div>
                            <h6 className="text-[11px] font-black uppercase tracking-widest text-[#1E2129] mb-4">Obrigado pela sua preferência</h6>
                            <p className="text-base font-black text-[#1E2129] mb-4">Informações bancárias</p>
                            <div className="space-y-2 text-[11px] text-gray-500 uppercase">
                                <div className="flex gap-4">
                                    <span className="w-32">Titular da conta:</span>
                                    <span className="text-gray-900 font-medium">{paymentBlock?.data?.bank_holder || 'Arkhus LDA'}</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="w-32">No. de conta:</span>
                                    <span className="text-gray-900 font-medium">{paymentBlock?.data?.bank_account || '0145 4125 2145 1'}</span>
                                </div>
                                <div className="flex gap-4">
                                    <span className="w-32">IBAN:</span>
                                    <span className="text-gray-900 font-medium">{paymentBlock?.data?.bank_iban || '0145 4125 2145 1475 5123 1'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 justify-end items-end">
                        <div className="flex gap-16 text-lg font-bold text-gray-400 uppercase">
                            <span>Sub Total:</span>
                            <span className="text-gray-900 w-48 text-right">AOA {itemsBlock?.data?.subtotal_display || '0,00'}</span>
                        </div>
                        <div className="flex gap-16 text-lg font-bold text-gray-400 uppercase">
                            <span>Impostos:</span>
                            <span className="text-gray-900 w-48 text-right">{itemsBlock?.data?.tax_display || '14%'}</span>
                        </div>
                        <div className="flex gap-16 text-2xl font-black uppercase" style={{ color: pinkColor }}>
                            <span className="italic">Total:</span>
                            <span className="w-[300px] text-right">AOA {itemsBlock?.data?.total_display || '0,00'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Color Accent */}
            <div className="h-16 bg-[#2B2F3A]" />
        </div>
    )
}


