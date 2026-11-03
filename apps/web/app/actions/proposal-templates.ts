"use server"

import { createAdminClient, getCurrentUser } from "@/lib/supabase/server"
import { assertProposalAccess, denyUnlessAllowed, getUserWorkspaceIds } from "@/lib/brand-access"
import { revalidatePath } from "next/cache"

/**
 * Proposal templates saved by a team: every page of a proposal (content, order, titles, flags) and its theme
 * (colours and fonts), kept in proposal_templates.content_json for the proposal's workspace.
 */

export interface SavedTemplatePage {
    type: string
    title: string
    content_json: Record<string, unknown>
    is_hidden?: boolean
    is_locked?: boolean
    is_fullscreen?: boolean
}

export interface SavedTemplateContent {
    version: 1
    /** The proposal's theme (settings module: colours, palette, font styles) */
    settings: Record<string, unknown> | null
    pages: SavedTemplatePage[]
}

export interface SavedTemplate {
    id: string
    name: string
    description: string | null
    page_count: number | null
    content_json: SavedTemplateContent
    updated_at: string | null
    /** Offered to every user of the platform */
    is_public: boolean
    /** Saved by one of the user's teams (they can change or remove it) */
    mine: boolean
    /** Name of the team that made it (public templates of other teams) */
    team_name: string | null
}

export interface BuiltinTemplate {
    id: string
    name: string
    preview_image: string | null
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** The project / client names written in the proposal become the template fields again */
const toPlaceholders = (value: unknown, names: [string, string][]): unknown => {
    if (typeof value === "string") return names.reduce((s, [name, field]) => s.replace(new RegExp(escapeRe(name), "g"), field), value)
    if (Array.isArray(value)) return value.map(v => toPlaceholders(v, names))
    if (value && typeof value === "object") {
        const o: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(value)) o[k] = k === "id" || k === "url" || k === "src" ? v : toPlaceholders(v, names)
        return o
    }
    return value
}

export async function saveProposalAsTemplate(proposalId: string, opts: { name: string, description?: string, useFields?: boolean, overwriteId?: string | null, isPublic?: boolean }) {
    // SECURITY: the admin client bypasses RLS, so verify the user may act on this proposal
    const denied = await denyUnlessAllowed(() => assertProposalAccess(proposalId))
    if (denied) return denied
    const user = await getCurrentUser()
    if (!user) return { success: false as const, error: "Sessão expirada. Volte a entrar." }
    const name = String(opts.name || "").trim().slice(0, 80)
    if (!name) return { success: false as const, error: "Dê um nome ao template." }

    const admin = await createAdminClient()
    const { data: proposal } = await admin
        .from("proposals")
        .select("id, brands(name, workspace_id), projects(name, workspace_id)")
        .eq("id", proposalId)
        .single()
    const project: any = Array.isArray((proposal as any)?.projects) ? (proposal as any).projects[0] : (proposal as any)?.projects
    const brand: any = Array.isArray((proposal as any)?.brands) ? (proposal as any).brands[0] : (proposal as any)?.brands
    const workspaceId: string | undefined = project?.workspace_id || brand?.workspace_id
    if (!workspaceId) return { success: false as const, error: "Esta proposta não pertence a um espaço de trabalho." }

    const { data: modules, error } = await admin
        .from("proposal_modules")
        .select("type, title, order, content_json, is_hidden, is_locked, is_fullscreen")
        .eq("proposal_id", proposalId)
        .order("order", { ascending: true })
    if (error) return { success: false as const, error: error.message }
    const pages = (modules || []).filter(m => m.type !== "settings")
    if (!pages.length) return { success: false as const, error: "A proposta não tem páginas para guardar." }
    const settings = (modules || []).find(m => m.type === "settings")?.content_json || null

    // Names of at least 3 letters only, so short words are never replaced by accident
    const names: [string, string][] = opts.useFields === false ? [] : [
        ...(project?.name && String(project.name).trim().length >= 3 ? [[String(project.name).trim(), "{{Nome_Projeto}}"] as [string, string]] : []),
        ...(brand?.name && String(brand.name).trim().length >= 3 ? [[String(brand.name).trim(), "{{Nome_Cliente}}"] as [string, string]] : []),
    ]
    const content: SavedTemplateContent = {
        version: 1,
        settings,
        pages: pages.map(m => ({
            type: m.type,
            title: m.title,
            content_json: toPlaceholders(m.content_json || {}, names) as Record<string, unknown>,
            is_hidden: !!m.is_hidden,
            is_locked: !!m.is_locked,
            is_fullscreen: !!m.is_fullscreen,
        })),
    }
    const row = {
        name,
        description: opts.description ? String(opts.description).trim().slice(0, 280) : null,
        content_json: content,
        page_count: content.pages.length,
        workspace_id: workspaceId,
        is_public: !!opts.isPublic,
        updated_at: new Date().toISOString(),
    }

    if (opts.overwriteId) {
        // Only a template of one of the user's workspaces can be replaced
        const workspaceIds = await getUserWorkspaceIds()
        const { data: existing } = await admin.from("proposal_templates").select("id, workspace_id").eq("id", opts.overwriteId).maybeSingle()
        if (!existing || !existing.workspace_id || !workspaceIds.includes(existing.workspace_id)) {
            return { success: false as const, error: "Não pode alterar este template." }
        }
        const { error: upErr } = await admin.from("proposal_templates").update(row).eq("id", opts.overwriteId)
        if (upErr) return { success: false as const, error: upErr.message }
        return { success: true as const, template: { id: opts.overwriteId, name, page_count: row.page_count } }
    }

    const { data: created, error: insErr } = await admin
        .from("proposal_templates")
        // preview_image is required by the table: saved templates have no picture (the picker draws their own card)
        .insert({ ...row, created_by: user.id, preview_image: "" })
        .select("id, name, page_count")
        .single()
    if (insErr || !created) return { success: false as const, error: insErr?.message || "Não foi possível guardar o template." }
    return { success: true as const, template: created }
}

/** Saved templates the user can use: their teams' ones and the public ones of every team (newest first) */
export async function listSavedProposalTemplates(): Promise<SavedTemplate[]> {
    const user = await getCurrentUser()
    if (!user) return []
    const workspaceIds = await getUserWorkspaceIds()
    const admin = await createAdminClient()
    // workspace ids are uuids from the database, safe in the or() filter
    const scope = workspaceIds.length ? `is_public.eq.true,workspace_id.in.(${workspaceIds.join(",")})` : "is_public.eq.true"
    const { data, error } = await admin
        .from("proposal_templates")
        .select("id, name, description, page_count, content_json, updated_at, is_public, workspace_id, workspaces(name)")
        .not("content_json", "is", null)
        .not("workspace_id", "is", null)
        .or(scope)
        .order("updated_at", { ascending: false })
    if (error) {
        console.error("List saved proposal templates error:", error)
        return []
    }
    return (data || []).map((t: any) => {
        const team = Array.isArray(t.workspaces) ? t.workspaces[0] : t.workspaces
        return {
            id: t.id, name: t.name, description: t.description, page_count: t.page_count, content_json: t.content_json, updated_at: t.updated_at,
            is_public: !!t.is_public, mine: workspaceIds.includes(t.workspace_id), team_name: team?.name ?? null,
        }
    })
}

/** The templates that come with the platform (no pages stored: they are built from their name) */
export async function listBuiltinProposalTemplates(): Promise<BuiltinTemplate[]> {
    const admin = await createAdminClient()
    const { data } = await admin.from("proposal_templates").select("id, name, preview_image").is("workspace_id", null).order("name")
    return (data || []) as BuiltinTemplate[]
}

/** Offers a team's template to every user of the platform, or keeps it to the team again */
export async function setProposalTemplatePublic(templateId: string, isPublic: boolean) {
    const workspaceIds = await getUserWorkspaceIds()
    const admin = await createAdminClient()
    const { data: existing } = await admin.from("proposal_templates").select("id, workspace_id").eq("id", templateId).maybeSingle()
    if (!existing || !existing.workspace_id || !workspaceIds.includes(existing.workspace_id)) {
        return { success: false as const, error: "Só a equipa que criou o template o pode partilhar." }
    }
    const { error } = await admin.from("proposal_templates").update({ is_public: isPublic, updated_at: new Date().toISOString() }).eq("id", templateId)
    if (error) return { success: false as const, error: error.message }
    return { success: true as const }
}

/** A new proposal in a project, started from a template (built-in, public or the team's); returns its id */
export async function createProposalFromTemplate(projectId: string, templateId: string) {
    const user = await getCurrentUser()
    if (!user) return { success: false as const, error: "Sessão expirada. Volte a entrar." }
    const workspaceIds = await getUserWorkspaceIds()
    const admin = await createAdminClient()
    const [{ data: project }, { data: template }] = await Promise.all([
        admin.from("projects").select("id, workspace_id, brand_id").eq("id", projectId).maybeSingle(),
        admin.from("proposal_templates").select("id, name, workspace_id, is_public").eq("id", templateId).maybeSingle(),
    ])
    // SECURITY: the project must be the user's, and a team's private template only theirs
    if (!project?.workspace_id || !workspaceIds.includes(project.workspace_id)) return { success: false as const, error: "Não tem acesso a este projeto." }
    if (!template || (template.workspace_id && !template.is_public && !workspaceIds.includes(template.workspace_id))) {
        return { success: false as const, error: "Este template não está disponível." }
    }
    const { createProposal, getNextProposalIdentifier } = await import("./proposals")
    const identifier = await getNextProposalIdentifier(projectId)
    const res = await createProposal({
        project_id: projectId,
        brand_id: (project as any).brand_id || "",
        identifier,
        status: "draft",
        template_id: templateId,
        items: [],
    } as any)
    if (!res.success || !("proposalId" in res) || !res.proposalId) return { success: false as const, error: (res as any).error || "Não foi possível criar a proposta." }
    revalidatePath("/projects")
    return { success: true as const, proposalId: res.proposalId as string, identifier }
}

export async function deleteProposalTemplate(templateId: string) {
    const workspaceIds = await getUserWorkspaceIds()
    const admin = await createAdminClient()
    const { data: existing } = await admin.from("proposal_templates").select("id, workspace_id").eq("id", templateId).maybeSingle()
    // The built-in templates (no workspace) and other teams' templates cannot be removed
    if (!existing || !existing.workspace_id || !workspaceIds.includes(existing.workspace_id)) {
        return { success: false as const, error: "Não pode apagar este template." }
    }
    const { error } = await admin.from("proposal_templates").delete().eq("id", templateId)
    if (error) return { success: false as const, error: error.message }
    return { success: true as const }
}
