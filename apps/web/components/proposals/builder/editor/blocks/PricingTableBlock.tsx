"use client"

import React, { useMemo } from "react"
import { Plus, Trash2 } from "lucide-react"

interface PricingTableBlockProps {
    block: any
    isReadOnly?: boolean
    onUpdate: (id: string, content: any) => void
    onDelete?: (id: string) => void
}

export const PricingTableBlock = ({ block, isReadOnly, onUpdate, onDelete }: PricingTableBlockProps) => {
    const defaultItems = useMemo(() => [
        { description: "Serviço de Branding", quantity: 1, price: 5000 },
        { description: "Gestão Social Media", quantity: 1, price: 1200 }
    ], [])

    const items = block.content.items || defaultItems

    const total = useMemo(() => {
        return items.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0)
    }, [items])

    const handleUpdateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index][field] = field === 'description' ? value : Number(value)
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    const handleAddItem = () => {
        const newItems = [...items, { description: "Novo Item", quantity: 1, price: 0 }]
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    const handleRemoveItem = (index: number) => {
        const newItems = items.filter((_: any, i: number) => i !== index)
        onUpdate(block.id, { ...block.content, items: newItems })
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    return (
        <div className="mb-8 group/block relative w-full overflow-hidden rounded-xl border border-white/10 backdrop-blur-sm bg-black/5 dark:bg-white/5">
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-inherit">
                        <th className="text-left py-4 px-6 text-[10px] uppercase tracking-widest font-black opacity-60">Serviço</th>
                        <th className="text-center py-4 px-4 text-[10px] uppercase tracking-widest font-black opacity-60 w-[100px]">Qtd</th>
                        <th className="text-right py-4 px-4 text-[10px] uppercase tracking-widest font-black opacity-60 w-[150px]">Unitário</th>
                        <th className="text-right py-4 px-6 text-[10px] uppercase tracking-widest font-black opacity-60 w-[150px]">Total</th>
                        {!isReadOnly && <th className="w-12"></th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {items.map((item: any, index: number) => (
                        <tr key={index} className="group/row hover:bg-white/5 transition-colors">
                            <td className="py-4 px-6">
                                <input
                                    type="text"
                                    value={item.description}
                                    readOnly={isReadOnly}
                                    onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-[15px] focus:ring-0 font-bold text-inherit"
                                    placeholder="Ex: Consultoria, Design..."
                                />
                            </td>
                            <td className="py-4 px-4">
                                <input
                                    type="number"
                                    value={item.quantity}
                                    readOnly={isReadOnly}
                                    onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                                    className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 text-center opacity-70 text-inherit"
                                />
                            </td>
                            <td className="py-4 px-4">
                                <div className="flex items-center justify-end">
                                    <span className="text-[10px] opacity-40 mr-1.5 font-bold">€</span>
                                    <input
                                        type="number"
                                        value={item.price}
                                        readOnly={isReadOnly}
                                        onChange={(e) => handleUpdateItem(index, 'price', e.target.value)}
                                        className="w-[100px] bg-transparent border-none p-0 text-[15px] focus:ring-0 text-right font-bold text-inherit"
                                    />
                                </div>
                            </td>
                            <td className="py-4 px-6 text-right text-[15px] font-black text-inherit">
                                {formatCurrency(item.quantity * item.price)}
                            </td>
                            {!isReadOnly && (
                                <td className="py-4 pr-4">
                                    <button
                                        onClick={() => handleRemoveItem(index)}
                                        className="opacity-0 group-hover/row:opacity-100 p-1 text-inherit opacity-40 hover:opacity-100 hover:text-red-500 transition-all ml-auto block"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-white/5 border-t border-white/10">
                        <td colSpan={3} className="py-8 px-6 text-right font-black opacity-60 text-[12px] uppercase tracking-[0.2em]">
                            Investimento Total
                        </td>
                        <td className="py-8 px-6 text-right text-2xl font-black text-inherit">
                            {formatCurrency(total)}
                        </td>
                        {!isReadOnly && <td></td>}
                    </tr>
                </tfoot>
            </table>

            {!isReadOnly && (
                <div className="p-4 border-t border-gray-50 flex justify-center">
                    <button
                        onClick={handleAddItem}
                        className="flex items-center gap-2 text-[#FF0054] text-xs font-bold uppercase tracking-widest hover:bg-[#FF0054]/5 px-4 py-2 rounded-lg transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Linha
                    </button>
                </div>
            )}

            {!isReadOnly && onDelete && (
                <button
                    onClick={() => onDelete(block.id)}
                    className="absolute -right-12 top-0 opacity-0 group-hover/block:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}
