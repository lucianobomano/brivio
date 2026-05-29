"use client"

import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BrandActions } from "./BrandActions"
import { MoreVertical } from "lucide-react"

interface BrandCardProps {
    brand: {
        id: string
        name: string
        slug: string
        updated_at: string
        primary_color?: string | null
        brandbooks?: { id: string, status: string }[]
    }
}

export function BrandCard({ brand }: BrandCardProps) {
    const formattedDate = brand.updated_at 
        ? format(new Date(brand.updated_at), "d 'Dez' yyyy", { locale: ptBR })
        : '---'

    return (
        <div className="relative w-[372px] h-[585px] rounded-[16px] bg-white overflow-hidden group border border-gray-100 shadow-sm transition-all duration-500">
            {/* Clickable Area for the brand */}
            <Link href={`/brand/${brand.id}/brandbook`} className="absolute inset-0 z-10" />

            {/* Menu Actions (Top Right) */}
            <div className="absolute top-6 right-6 z-20">
                <BrandActions brand={brand} />
            </div>

            {/* Content Container - Centered */}
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                {/* Brand Logo - Animation only on hover */}
                <div className="relative mb-8">
                    <div className="w-[120px] h-[120px] rounded-full bg-brand-mesh shadow-lg opacity-90 group-hover:opacity-100 group-hover:animate-mesh-spin group-hover:animate-hue-dynamic transition-all duration-700 ease-in-out" />
                    {/* Subtle outer ring */}
                    <div className="absolute -inset-2 rounded-full border border-gray-50 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                </div>

                {/* Brand Info */}
                <div className="space-y-1">
                    <h3 className="text-[22px] font-semibold text-[#1A1B20] tracking-tight">
                        {brand.name}
                    </h3>
                    <p className="text-[13px] font-medium text-gray-400 capitalize">
                        Actualizado em {formattedDate}
                    </p>
                </div>
            </div>
        </div>
    )
}
