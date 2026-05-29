"use server"

import { prisma } from "@/lib/prisma"

export async function saveComponent(data: { name: string, content_json: any, is_public: boolean, brand_id?: string }) {
    try {
        const component = await prisma.savedComponent.create({
            data: {
                name: data.name,
                content_json: data.content_json,
                is_public: data.is_public,
                brand_id: data.brand_id || null
            }
        })

        return { success: true, component }
    } catch (error) {
        console.error("Failed to save component:", error)
        return { success: false, error: "Falha ao salvar componente" }
    }
}

export async function getComponents(brand_id: string) {
    try {
        const components = await prisma.savedComponent.findMany({
            where: {
                OR: [
                    { is_public: true },
                    { brand_id: brand_id }
                ]
            },
            orderBy: {
                created_at: 'desc'
            }
        })

        return { success: true, components }
    } catch (error) {
        console.error("Failed to fetch components:", error)
        return { success: false, error: "Falha ao buscar componentes" }
    }
}
