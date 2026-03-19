"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function uploadCover(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Unauthorized" }

    const file = formData.get('file') as File
    if (!file) return { success: false, error: "No file provided" }

    const fileExt = file.name.split('.').pop()
    const fileName = `covers/${user.id}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`

    // Using 'assets' bucket which exists in the project
    const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file, { upsert: true })

    if (uploadError) {
        console.error("Cover upload error:", uploadError)
        return { success: false, error: uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName)

    // Update public.users table with cover_url
    const { error: updateError } = await supabase
        .from('users')
        .update({ cover_url: publicUrl })
        .eq('id', user.id)

    if (updateError) {
        console.error("Update user cover error:", updateError)
        return { success: false, error: updateError.message }
    }

    revalidatePath('/settings')
    return { success: true, url: publicUrl }
}
