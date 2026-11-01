import { cache } from "react"
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server"

/**
 * Authorization helpers for code that reads/writes brand data with the admin client
 * (which bypasses RLS). Every such access must first prove the signed-in user belongs
 * to the brand's workspace. Kept outside "use server" files on purpose: anything
 * exported from those becomes a publicly callable server action.
 */

export const BRAND_ACCESS_ERROR = "Não tem acesso a esta marca."

/** Workspaces the signed-in user can act in: memberships plus workspaces they created */
export const getUserWorkspaceIds = cache(async (): Promise<string[]> => {
    const user = await getCurrentUser()
    if (!user) return []

    const admin = await createAdminClient()
    const [{ data: members }, { data: owned }] = await Promise.all([
        admin.from('workspace_members').select('workspace_id').eq('user_id', user.id),
        admin.from('workspaces').select('id').eq('created_by', user.id),
    ])

    return [...new Set([
        ...(members || []).map((m: any) => m.workspace_id),
        ...(owned || []).map((w: any) => w.id),
    ].filter(Boolean))]
})

/**
 * Platform superadmins (admin_users.role = 'superadmin', or is_superadmin in app_metadata, which only
 * the service role can set; user_metadata is writable by the user themselves) may act on any brand.
 */
export const isSuperAdmin = cache(async (): Promise<boolean> => {
    const user = await getCurrentUser()
    if (!user) return false
    if (user.app_metadata?.is_superadmin === true) return true
    if (!user.email) return false

    const admin = await createAdminClient()
    const { data } = await admin.from('admin_users').select('role').eq('email', user.email).maybeSingle()
    return data?.role === 'superadmin'
})

/** Whether the signed-in user may act on this brand (member of its workspace, or superadmin) */
export async function canAccessBrand(brandId: string | null | undefined): Promise<boolean> {
    if (!brandId) return false

    const admin = await createAdminClient()
    const [{ data: brand }, workspaceIds, superAdmin] = await Promise.all([
        admin.from('brands').select('id, workspace_id').eq('id', brandId).maybeSingle(),
        getUserWorkspaceIds(),
        isSuperAdmin(),
    ])

    if (!brand) return false
    return superAdmin || (!!brand.workspace_id && workspaceIds.includes(brand.workspace_id))
}

/** A brandbook counts as published under any of the flags getPublicBrandbooks() honours */
export const isPublishedBrandbook = (b: any) => !!b && (b.is_public === true || b.visibility === 'public' || b.status === 'public')

/**
 * Whether the signed-in user may *view* this brand's brandbook design data: members and
 * superadmins, plus anyone when the brand has a published brandbook (read-only preview).
 */
export async function canViewBrand(brandId: string | null | undefined): Promise<boolean> {
    if (!brandId) return false
    if (await canAccessBrand(brandId)) return true

    const admin = await createAdminClient()
    const { data: brandbooks } = await admin.from('brandbooks').select('*').eq('brand_id', brandId)
    return (brandbooks || []).some(isPublishedBrandbook)
}

/** Throws unless the brand exists and the user may act on it */
export async function assertBrandAccess(brandId: string | null | undefined) {
    if (!(await canAccessBrand(brandId))) throw new Error(BRAND_ACCESS_ERROR)
    return { id: brandId as string }
}

/** Throws unless the brandbook belongs to a brand the user can access */
export async function assertBrandbookAccess(brandbookId: string | null | undefined) {
    if (!brandbookId) throw new Error(BRAND_ACCESS_ERROR)

    const admin = await createAdminClient()
    const { data: brandbook } = await admin.from('brandbooks').select('id, brand_id').eq('id', brandbookId).maybeSingle()
    if (!brandbook) throw new Error(BRAND_ACCESS_ERROR)

    await assertBrandAccess(brandbook.brand_id)
    return brandbook
}

/** Throws unless every brandbook page belongs to a brandbook the user can access */
export async function assertBrandbookModulesAccess(moduleIds: (string | null | undefined)[]) {
    const ids = [...new Set(moduleIds.filter(Boolean))] as string[]
    if (ids.length === 0) throw new Error(BRAND_ACCESS_ERROR)

    const admin = await createAdminClient()
    const { data: modules } = await admin.from('brandbook_modules').select('id, brandbook_id').in('id', ids)
    if (!modules || modules.length !== ids.length) throw new Error(BRAND_ACCESS_ERROR)

    const brandbookIds = [...new Set(modules.map((m: any) => m.brandbook_id))]
    await Promise.all(brandbookIds.map(id => assertBrandbookAccess(id)))
    return modules
}

/**
 * Runs an access check and turns a denial into the `{ success: false, error }` result the
 * server actions already return, for actions without their own try/catch.
 */
export async function denyUnlessAllowed(check: () => Promise<unknown>): Promise<{ success: false, error: string } | null> {
    try {
        await check()
        return null
    } catch {
        return { success: false, error: BRAND_ACCESS_ERROR }
    }
}

/** Throws unless the Brand Space belongs to a brand the user can access */
export async function assertSpaceAccess(spaceId: string | null | undefined) {
    if (!spaceId) throw new Error(BRAND_ACCESS_ERROR)

    const admin = await createAdminClient()
    const { data: space } = await admin.from('brand_spaces').select('id, brand_id').eq('id', spaceId).maybeSingle()
    if (!space) throw new Error(BRAND_ACCESS_ERROR)

    await assertBrandAccess(space.brand_id)
    return space
}

/** Throws unless the brand object belongs to a brand the user can access */
export async function assertObjectAccess(objectId: string | null | undefined) {
    if (!objectId) throw new Error(BRAND_ACCESS_ERROR)

    const admin = await createAdminClient()
    const { data: object } = await admin.from('brand_objects').select('id, brand_id').eq('id', objectId).maybeSingle()
    if (!object) throw new Error(BRAND_ACCESS_ERROR)

    await assertBrandAccess(object.brand_id)
    return object
}

/** Throws unless the canvas node belongs to a space the user can access */
export async function assertNodeAccess(nodeId: string | null | undefined) {
    if (!nodeId) throw new Error(BRAND_ACCESS_ERROR)

    const admin = await createAdminClient()
    const { data: node } = await admin.from('brand_nodes').select('id, space_id').eq('id', nodeId).maybeSingle()
    if (!node) throw new Error(BRAND_ACCESS_ERROR)

    await assertSpaceAccess(node.space_id)
    return node
}

export const ACCESS_ERROR = "Sem acesso a este recurso."

/** Whether the signed-in user belongs to (or created) this workspace */
export async function canAccessWorkspace(workspaceId: string | null | undefined): Promise<boolean> {
    if (!workspaceId) return false
    return (await getUserWorkspaceIds()).includes(workspaceId)
}

/** Whether the signed-in user created this project or belongs to its workspace */
export async function canAccessProject(projectId: string | null | undefined): Promise<boolean> {
    if (!projectId) return false
    const user = await getCurrentUser()
    if (!user) return false

    const admin = await createAdminClient()
    const [{ data: project }, workspaceIds] = await Promise.all([
        admin.from('projects').select('created_by, workspace_id').eq('id', projectId).maybeSingle(),
        getUserWorkspaceIds(),
    ])
    if (!project) return false
    return project.created_by === user.id || (!!project.workspace_id && workspaceIds.includes(project.workspace_id))
}

/** Members of the project, plus anyone for published projects (community/portfolio, status 'done') */
export async function canViewProject(projectId: string | null | undefined): Promise<boolean> {
    if (!projectId) return false
    const admin = await createAdminClient()
    const { data: project } = await admin.from('projects').select('status').eq('id', projectId).maybeSingle()
    if (!project) return false
    return project.status === 'done' || canAccessProject(projectId)
}

/** Whether the signed-in user leads, belongs to, or shares the workspace of this standup team */
export async function canAccessStandupTeam(teamId: string | null | undefined): Promise<boolean> {
    if (!teamId) return false
    const user = await getCurrentUser()
    if (!user) return false

    const admin = await createAdminClient()
    const [{ data: team }, workspaceIds] = await Promise.all([
        admin.from('standup_teams').select('leader_id, workspace_id, members:standup_team_members(user_id)').eq('id', teamId).maybeSingle(),
        getUserWorkspaceIds(),
    ])
    if (!team) return false
    return team.leader_id === user.id
        || (!!team.workspace_id && workspaceIds.includes(team.workspace_id))
        || (team.members || []).some((m: any) => m.user_id === user.id)
}

/** Whether the signed-in user may see this standup (its creator or someone with access to its team) */
export async function canAccessStandup(standupId: string | null | undefined): Promise<boolean> {
    if (!standupId) return false
    const user = await getCurrentUser()
    if (!user) return false

    const admin = await createAdminClient()
    const { data: standup } = await admin.from('standups').select('team_id, created_by').eq('id', standupId).maybeSingle()
    if (!standup) return false
    return standup.created_by === user.id || canAccessStandupTeam(standup.team_id)
}

/** Throws unless the proposal belongs to a brand the user can access, or to a project in one of their workspaces */
export async function assertProposalAccess(proposalId: string | null | undefined) {
    if (!proposalId) throw new Error(BRAND_ACCESS_ERROR)

    const admin = await createAdminClient()
    const { data: proposal } = await admin
        .from('proposals')
        .select('id, brand_id, project:projects(workspace_id)')
        .eq('id', proposalId)
        .maybeSingle()
    if (!proposal) throw new Error(BRAND_ACCESS_ERROR)

    const project: any = Array.isArray(proposal.project) ? proposal.project[0] : proposal.project
    const [brandOk, workspaceIds] = await Promise.all([
        proposal.brand_id ? canAccessBrand(proposal.brand_id) : Promise.resolve(false),
        getUserWorkspaceIds(),
    ])
    if (!brandOk && !(project?.workspace_id && workspaceIds.includes(project.workspace_id))) {
        throw new Error(BRAND_ACCESS_ERROR)
    }
    return proposal
}

/** Throws unless every proposal section belongs to a proposal the user can access */
export async function assertProposalModulesAccess(moduleIds: (string | null | undefined)[]) {
    const ids = [...new Set(moduleIds.filter(Boolean))] as string[]
    if (ids.length === 0) throw new Error(BRAND_ACCESS_ERROR)

    const admin = await createAdminClient()
    const { data: modules } = await admin.from('proposal_modules').select('id, proposal_id').in('id', ids)
    if (!modules || modules.length !== ids.length) throw new Error(BRAND_ACCESS_ERROR)

    const proposalIds = [...new Set(modules.map((m: any) => m.proposal_id))]
    await Promise.all(proposalIds.map(id => assertProposalAccess(id)))
    return modules
}
