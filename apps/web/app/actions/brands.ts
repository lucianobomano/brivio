"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"
import { mapPageToCategory } from "@/lib/brandbook-utils"

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
}

export async function createBrand(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const website = formData.get("website") as string
    const industry = formData.get("industry") as string
    const primaryColor = formData.get("primaryColor") as string
    const requestedWorkspaceId = formData.get("workspace_id") as string
    const pagesJson = formData.get("selectedPages") as string
    const selectedPages = pagesJson ? JSON.parse(pagesJson) as string[] : []
    const templateId = formData.get("templateId") as string

    if (!name) {
        return { success: false, error: "Brand name is required" }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: "Unauthorized" }

    // Check if Service Role Key is available BEFORE trying to use it
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.")
        return { success: false, error: "Server configuration error: Missing SUPABASE_SERVICE_ROLE_KEY. Please add it to your .env.local file." }
    }

    const adminSupabase = await createAdminClient()

    // Verify User exists in public.users (Fix for FK Violation)
    const { data: publicUser } = await adminSupabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()

    if (!publicUser) {
        // Sync user to public table if missing
        const { error: syncError } = await adminSupabase
            .from('users')
            .insert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                avatar_url: user.user_metadata?.avatar_url,
                created_at: new Date().toISOString()
            })

        if (syncError) {
            console.error("Failed to sync user:", syncError)
        }
    }

    // Use requested workspace or find user's default workspace using Admin Client
    let workspaceId = requestedWorkspaceId

    if (!workspaceId) {
        const { data: workspace } = await adminSupabase
            .from('workspaces')
            .select('id')
            .eq('created_by', user.id)
            .limit(1)
            .single()
        workspaceId = workspace?.id
    }

    if (!workspaceId) {
        // Fallback: Query workspace_members via Admin
        const { data: memberData } = await adminSupabase
            .from('workspace_members')
            .select('workspace_id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        workspaceId = memberData?.workspace_id
    }

    if (!workspaceId) {
        // Create default workspace via Admin
        const slug = "my-workspace-" + Math.random().toString(36).substring(2, 7)
        const { data: newWorkspace, error: matchError } = await adminSupabase
            .from('workspaces')
            .insert({
                name: "My Workspace",
                slug,
                type: 'personal',
                created_by: user.id
            })
            .select()
            .single()

        if (newWorkspace) {
            workspaceId = newWorkspace.id
            // Add member via Admin
            await adminSupabase.from('workspace_members').insert({
                workspace_id: newWorkspace.id,
                user_id: user.id,
                role: 'owner',
                accepted_at: new Date().toISOString()
            })
        } else {
            console.error("Failed to create workspace:", matchError)
            return { success: false, error: `Failed to create workspace: ${matchError?.message || "Unknown error"}` }
        }
    }

    const brandSlug = slugify(name) + "-" + Math.random().toString(36).substring(2, 7)

    // Insert Brand via Admin (Bypasses potential RLS on workspaces check)
    const { data: brand, error } = await adminSupabase
        .from('brands')
        .insert({
            name,
            slug: brandSlug,
            workspace_id: workspaceId,
            primary_color: primaryColor || '#6366f1',
            status: 'active',
            description,
            website,
            industry
        })
        .select()
        .single()

    if (error) {
        console.error("Create brand error:", error)
        return { success: false, error: error.message || "Failed to create brand in database" }
    }

    // --- HANDLE PAGES (MODULES) OR TEMPLATE ---
    if (selectedPages.length > 0 || templateId) {
        // 1. Create Default Brandbook
        const { data: brandbook, error: bbError } = await adminSupabase
            .from('brandbooks')
            .insert({
                brand_id: brand.id,
                title: 'Brand Book',
                version: '1.0',
                visibility: 'draft',
                is_public: false
            })
            .select()
            .single()

        if (brandbook) {
            let modulesAdded = false;

            if (templateId) {
                // Option A: Use Template
                const { data: template } = await adminSupabase
                    .from('brandbook_templates')
                    .select('modules_json')
                    .eq('id', templateId)
                    .single()

                if (template && Array.isArray(template.modules_json)) {
                    const modulesData = template.modules_json.map((mod: any, index: number) => ({
                        brandbook_id: brandbook.id,
                        title: mod.title,
                        type: mod.type,
                        content_json: mod.content_json || {},
                        order: index,
                        category: mod.category || mapPageToCategory(mod.title)
                    }))

                    const { error: mError } = await adminSupabase.from('brandbook_modules').insert(modulesData)
                    if (mError) {
                        console.error("Failed to insert template modules:", mError)
                    } else {
                        modulesAdded = true
                    }
                }
            }

            if (!modulesAdded && selectedPages.length > 0) {
                // Option B: Use Wizard Pages
                const modulesData = selectedPages.map((pageTitle, index) => ({
                    brandbook_id: brandbook.id,
                    title: pageTitle,
                    type: mapPageToModuleType(pageTitle),
                    order: index,
                    category: mapPageToCategory(pageTitle),
                    content_json: {}
                }))

                const { error: mError } = await adminSupabase.from('brandbook_modules').insert(modulesData)
                if (mError) {
                    console.error("Failed to insert selected pages:", mError)
                } else {
                    modulesAdded = true
                }
            }
        } else {
            console.error("Failed to create default brandbook:", bbError)
        }
    }

    // --- HANDLE LOGO UPLOAD (Optional) ---
    const logoFile = formData.get("logo") as File
    if (logoFile && logoFile.size > 0) {
        try {
            const fileExt = logoFile.name.split('.').pop()
            const filePath = `${brand.id}/logo-${Date.now()}.${fileExt}`

            const { error: uploadError } = await adminSupabase
                .storage
                .from('brands')
                .upload(filePath, logoFile, {
                    contentType: logoFile.type
                })

            if (!uploadError) {
                const { data: { publicUrl } } = adminSupabase.storage.from('brands').getPublicUrl(filePath)
                await adminSupabase.from('brands').update({ logo_url: publicUrl }).eq('id', brand.id)
            }
        } catch (e) {
            console.error("Logo upload exception:", e)
        }
    }

    revalidatePath('/brands')
    return { success: true, brandId: brand.id }
}

function mapPageToModuleType(title: string): string {
    const map: Record<string, string> = {
        "Visão geral": "mission", // approximated
        "DNA da marca": "archetype",
        "História da marca": "history",
        "Logo": "logo",
        "Cores": "palette",
        "Tipografia": "typography",
        "Iconografia": "icons",
        "Imagens & Fotografia": "photography",
        "Ilustração": "illustration",
        "Grid & Layouts": "grid",
        "Elementos gráficos": "graphics",
        "Motion design": "motion",
        "Aplicações digitais": "applications",
        "Aplicações offline": "applications",
        "Personalidade da marca": "personality",
        "Tom de voz": "tone_of_voice",
        "Linguagem preferencial": "language",
        "Slogans e taglines": "slogans",
        "Naming system": "naming",
        "Storytelling base": "storytelling",
        "Copywriting guidelines": "copywriting",
        "Identidade sonora": "sound",
        "Identidade olfativa": "scent",
        "Identidade tátil": "tactile",
        "Identidade gustativa": "taste",
        "Experiência multimodal": "multimodal"
    }
    return map[title] || "custom"
}

export async function updateBrand(formData: FormData) {
    const supabase = await createClient()

    const brandId = formData.get("brandId") as string
    const name = formData.get("name") as string
    const primaryColor = formData.get("primaryColor") as string

    if (!brandId || !name) {
        throw new Error("Brand ID and name are required")
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Use Admin Client
    const { createAdminClient } = await import("@/lib/supabase/server")
    const adminSupabase = await createAdminClient()

    // 1. Verify Permission Manually (Bypass RLS)
    // Get brand's workspace_id
    const { data: existingBrand } = await adminSupabase
        .from('brands')
        .select('workspace_id')
        .eq('id', brandId)
        .single()

    if (!existingBrand) throw new Error("Brand not found")

    // Check if user is member of this workspace
    const { data: membership } = await adminSupabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', existingBrand.workspace_id)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        throw new Error("You do not have permission to update this brand")
    }

    // 2. Perform Update via Admin
    const { error } = await adminSupabase
        .from('brands')
        .update({
            name,
            primary_color: primaryColor
        })
        .eq('id', brandId)

    if (error) {
        console.error("Update brand error:", error)
        throw new Error("Failed to update brand")
    }

    revalidatePath(`/brand/${brandId}`)
    revalidatePath('/brands')
    return { success: true }
}

export async function deleteBrand(brandId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Use Admin Client
    const { createAdminClient } = await import("@/lib/supabase/server")
    const adminSupabase = await createAdminClient()

    // 1. Verify Permission Manually
    const { data: existingBrand } = await adminSupabase
        .from('brands')
        .select('workspace_id')
        .eq('id', brandId)
        .single()

    if (!existingBrand) throw new Error("Brand not found")

    const { data: membership } = await adminSupabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', existingBrand.workspace_id)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        throw new Error("You do not have permission to delete this brand")
    }

    // 2. CASCADE DELETE: First delete all related records

    // 2a. Get all brandbooks for this brand
    const { data: brandbooks } = await adminSupabase
        .from('brandbooks')
        .select('id')
        .eq('brand_id', brandId)

    if (brandbooks && brandbooks.length > 0) {
        const brandbookIds = brandbooks.map(bb => bb.id)

        // 2b. Delete all modules for these brandbooks
        const { error: modulesError } = await adminSupabase
            .from('brandbook_modules')
            .delete()
            .in('brandbook_id', brandbookIds)

        if (modulesError) {
            console.error("Error deleting brandbook modules:", modulesError)
            // Continue anyway as modules might not exist
        }

        // 2c. Delete all brandbooks
        const { error: brandbooksError } = await adminSupabase
            .from('brandbooks')
            .delete()
            .eq('brand_id', brandId)

        if (brandbooksError) {
            console.error("Error deleting brandbooks:", brandbooksError)
            throw new Error("Failed to delete brandbooks: " + brandbooksError.message)
        }
    }

    // 2d. Delete any templates associated with this brand (optional cleanup)
    const { error: templatesError } = await adminSupabase
        .from('brandbook_templates')
        .delete()
        .eq('brand_id', brandId)

    if (templatesError && templatesError.code !== '42P01') {
        // Ignore "table doesn't exist" error, log others
        console.warn("Error deleting templates (may not exist yet):", templatesError)
    }

    // 2e. Delete any proposals associated with this brand
    const { error: proposalsError } = await adminSupabase
        .from('proposals')
        .delete()
        .eq('brand_id', brandId)

    if (proposalsError && proposalsError.code !== '42P01') {
        // Ignore "table doesn't exist" error, log others
        console.warn("Error deleting proposals:", proposalsError)
    }

    // 3. Delete any brand assets from storage (optional cleanup)
    try {
        const { data: files } = await adminSupabase.storage
            .from('assets')
            .list(`brands/${brandId}`)

        if (files && files.length > 0) {
            const filePaths = files.map(f => `brands/${brandId}/${f.name}`)
            await adminSupabase.storage.from('assets').remove(filePaths)
        }
    } catch (storageError) {
        console.warn("Error cleaning up brand storage:", storageError)
        // Continue anyway - storage cleanup is not critical
    }

    // 4. Finally delete the brand itself
    const { error } = await adminSupabase
        .from('brands')
        .delete()
        .eq('id', brandId)

    if (error) {
        console.error("Delete brand error:", error)
        throw new Error("Failed to delete brand: " + error.message)
    }

    revalidatePath('/brands')
    redirect('/brands')
}

export async function updateBrandbookVisibility(brandId: string, visibility: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { createAdminClient } = await import("@/lib/supabase/server")
    const adminSupabase = await createAdminClient()

    // Find the primary brandbook for this brand
    const { data: brandbook } = await adminSupabase
        .from('brandbooks')
        .select('id')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

    if (!brandbook) throw new Error("Brandbook not found")

    // Update both visibility (new) and is_public (legacy) for full compatibility
    const updateData: { visibility: string; is_public: boolean } = {
        visibility,
        is_public: visibility === 'public'
    }

    const { error: updateError } = await adminSupabase
        .from('brandbooks')
        .update(updateData)
        .eq('id', brandbook.id)

    if (updateError) {
        console.error("Update visibility error:", updateError)

        // Fallback: If visibility column is missing, target is_public directly
        if (updateError.code === '42703') { // undefined_column
            const { error: fallbackError } = await adminSupabase
                .from('brandbooks')
                .update({ is_public: visibility === 'public' })
                .eq('id', brandbook.id)

            if (fallbackError) {
                console.error("Fallback visibility update error:", fallbackError)
                throw new Error(`Failed to update visibility even with fallback: ${fallbackError.message} (${fallbackError.code})`)
            }
        } else {
            throw new Error(`Failed to update visibility: ${updateError.message} (${updateError.code})`)
        }
    }

    revalidatePath('/brands')
    revalidatePath(`/brand/${brandId}/brandbook`)
    return { success: true }
}

export async function getBrands() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // 1. Get user's authorized workspaces
    const { data: members } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id)

    const workspaceIds = members?.map(m => m.workspace_id) || []

    if (workspaceIds.length === 0) return []

    // 2. Fetch brands for these workspaces
    const { data: brands, error } = await supabase
        .from('brands')
        .select('*')
        .in('workspace_id', workspaceIds)
        .order('name', { ascending: true })

    if (error) {
        console.error("Error fetching brands:", error)
        return []
    }

    return brands || []
}
