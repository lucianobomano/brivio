import { BUILTIN_BRANDBOOK_TEMPLATES } from "@/lib/brandbook-templates"

/**
 * Templates edited by superadmins. Database templates are updated in place; built-in templates live in the
 * code, so their edited version is kept in `brandbook_templates` as a hidden row named `__builtin__:<id>`
 * (private, no brand), which replaces the built-in pages everywhere the template is used.
 */

export const BUILTIN_OVERRIDE_PREFIX = '__builtin__:'

export const isBuiltinOverrideRow = (row: { name?: string | null }) => !!row.name?.startsWith(BUILTIN_OVERRIDE_PREFIX)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Modules = any[]

/** Edited pages of the built-in templates, by template id */
export async function getBuiltinOverrides(admin: Admin): Promise<Record<string, { modules: Modules }>> {
    try {
        const { data } = await admin
            .from('brandbook_templates')
            .select('name, modules_json')
            .like('name', `${BUILTIN_OVERRIDE_PREFIX}%`)
        const out: Record<string, { modules: Modules }> = {}
        for (const row of data || []) {
            if (!Array.isArray(row.modules_json) || row.modules_json.length === 0) continue
            out[String(row.name).slice(BUILTIN_OVERRIDE_PREFIX.length)] = { modules: row.modules_json }
        }
        return out
    } catch {
        return {}
    }
}

/** The pages of a template, with a superadmin's edits when there are any */
export async function resolveTemplateModules(admin: Admin, templateId: string): Promise<Modules | null> {
    const builtin = BUILTIN_BRANDBOOK_TEMPLATES.find(t => t.id === templateId)
    if (builtin) {
        const { data } = await admin
            .from('brandbook_templates')
            .select('modules_json')
            .eq('name', `${BUILTIN_OVERRIDE_PREFIX}${templateId}`)
            .limit(1)
            .maybeSingle()
        return Array.isArray(data?.modules_json) && data.modules_json.length ? data.modules_json : builtin.modules_json
    }
    const { data } = await admin
        .from('brandbook_templates')
        .select('modules_json')
        .eq('id', templateId)
        .maybeSingle()
    return Array.isArray(data?.modules_json) ? data.modules_json : null
}
