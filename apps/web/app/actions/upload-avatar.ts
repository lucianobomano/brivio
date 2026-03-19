"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function uploadAvatar(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: "Unauthorized" }

    const file = formData.get('file') as File
    if (!file) return { success: false, error: "No file provided" }

    const fileExt = file.name.split('.').pop()
    const fileName = `avatars/${user.id}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`

    // Using 'assets' bucket which exists in the project
    const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file, { upsert: true })

    if (uploadError) {
        console.error("Upload error:", uploadError)
        return { success: false, error: uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage
        .from('assets')
        .getPublicUrl(fileName)

    // Update public.users table
    const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

    if (updateError) {
        console.error("Update user error:", updateError)
        return { success: false, error: updateError.message }
    }

    revalidatePath('/settings')
    return { success: true, url: publicUrl }
}
