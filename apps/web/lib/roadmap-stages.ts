import { ROADMAP_TEMPLATES } from "@/lib/roadmap-templates"

/**
 * Which phases make up a project's roadmap.
 * Phases (project_stages) belong to the workspace and are shared by its projects; a project only says which ones
 * it uses through its tasks. Showing just the phases that have tasks hid the later ones of the plan (a Naming
 * roadmap with tasks in 2 of its 4 phases showed 2). So: the phases with tasks of this project, plus the other
 * phases of the template they come from (recognised by name), in the template's order, even while still empty.
 */
export function projectStages<S extends { id: string, name: string, position?: number | null }>(
    stages: S[],
    tasks: { stage_id: string | null }[],
): S[] {
    const usedIds = new Set(tasks.map(t => t.stage_id).filter(Boolean) as string[])
    const used = stages.filter(s => usedIds.has(s.id))
    if (used.length === 0) return []

    // The template that best matches the phases in use
    const usedNames = new Set(used.map(s => s.name.trim().toLowerCase()))
    let best: { names: string[], score: number } | null = null
    for (const t of ROADMAP_TEMPLATES) {
        const names = t.stages.map(st => st.name.trim().toLowerCase())
        const score = names.filter(n => usedNames.has(n)).length
        if (score > 0 && (!best || score > best.score)) best = { names, score }
    }
    if (!best) return used

    const order = best.names
    const picked = new Map<string, S>()
    used.forEach(s => picked.set(s.id, s))
    // One workspace phase per template name (the one in use, or the first one by position)
    for (const name of order) {
        if ([...picked.values()].some(s => s.name.trim().toLowerCase() === name)) continue
        const match = stages.find(s => s.name.trim().toLowerCase() === name)
        if (match) picked.set(match.id, match)
    }

    const rank = (s: S) => {
        const i = order.indexOf(s.name.trim().toLowerCase())
        return i >= 0 ? i : order.length + (s.position ?? 0) / 1e6
    }
    return [...picked.values()].sort((a, b) => rank(a) - rank(b))
}
