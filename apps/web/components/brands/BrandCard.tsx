"use client"

import Link from "next/link"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { BrandActions } from "./BrandActions"

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

// Gradientes pré-definidos para avatares
const avatarGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
]

function getGradientForBrand(brandId: string, primaryColor?: string | null) {
    if (primaryColor) {
        return `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
    }
    const hash = brandId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return avatarGradients[hash % avatarGradients.length]
}

export function BrandCard({ brand }: BrandCardProps) {
    const formattedDate = format(new Date(brand.updated_at), "d 'Dez' yyyy", { locale: pt })

    return (
        <div className="relative group">
            <Link href={`/brand/${brand.id}/brandbook`}>
                <div className="w-[265px] h-[360px] rounded-2xl bg-white p-6 flex flex-col items-center justify-center hover:shadow-2xl transition-all duration-300">
                    {/* Brand Avatar */}
                    <div
                        className="w-[75px] h-[75px] rounded-full mb-4 group-hover:scale-110 transition-transform duration-300"
                        style={{ background: getGradientForBrand(brand.id, brand.primary_color) }}
                    />

                    {/* Brand Name */}
                    <h3 className="text-lg font-semibold text-gray-900 text-center mb-2 px-4">
                        {brand.name}
                    </h3>

                    {/* Updated Date */}
                    <p className="text-sm text-gray-500">
                        Actualizado em {formattedDate}
                    </p>
                </div>
            </Link>

            {/* Menu Actions */}
            <BrandActions brand={brand} />
        </div>
    )
}
