"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function resetBrandbook(brandId: string) {
    const supabase = await createAdminClient()

    // Delete all brandbooks for this brand
    const { error } = await supabase
        .from('brandbooks')
        .delete()
        .eq('brand_id', brandId)

    if (error) {
        console.error("Reset failed:", error)
        return { success: false, error: error.message }
    }

    revalidatePath(`/brand/[brandId]/brandbook`)
    return { success: true }
}
