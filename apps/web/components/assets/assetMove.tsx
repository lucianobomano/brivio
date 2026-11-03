"use client"

import React from "react"
import { createPortal } from "react-dom"
import { ChevronRight, Folder, FolderInput, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { moveAssetItems, type AssetFolder } from "@/app/actions/assets"

/**
 * Moving folders and files in the asset libraries (Asset Hub library, brandbook and proposal Asset Library):
 * a «Mover para» dialog for one item or a selection, and drag & drop onto a folder (grid, sidebar tree,
 * breadcrumb). Dragging an item that is part of the selection drags the whole selection.
 */

export type MoveRequest = { folderIds: string[], assetIds: string[] }

const count = (r: MoveRequest) => r.folderIds.length + r.assetIds.length
const describe = (r: MoveRequest) => {
    const n = count(r)
    if (n === 1) return r.folderIds.length ? "a pasta" : "o ficheiro"
    return `${n} itens`
}

/** Moves on the server, with the result shown; true when everything moved */
export async function performMove(req: MoveRequest, dest: string | null, destName: string) {
    const r = await moveAssetItems(req.folderIds, req.assetIds, dest)
    if (r.success) {
        toast.success(`${count(req) === 1 ? (req.folderIds.length ? "Pasta movida" : "Ficheiro movido") : `${count(req)} itens movidos`} para «${destName}».`)
        return true
    }
    toast.error(r.error)
    return false
}

// ---------------------------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------------------------

type TreeNode = AssetFolder & { kids: TreeNode[] }
const tree = (folders: AssetFolder[]): TreeNode[] => {
    const by = new Map<string, TreeNode>(folders.map(f => [f.id, { ...f, kids: [] }]))
    const roots: TreeNode[] = []
    for (const n of by.values()) {
        const p = n.parent_id ? by.get(n.parent_id) : undefined
        if (p) p.kids.push(n); else roots.push(n)
    }
    const sort = (l: TreeNode[]) => { l.sort((a, b) => a.name.localeCompare(b.name)); l.forEach(n => sort(n.kids)) }
    sort(roots)
    return roots
}

/** «Mover para»: the folder tree; the moved folders (and what is inside them) cannot be picked */
export function MoveItemsDialog({ request, folders, rootLabel, currentFolderId, onClose, onMoved }: {
    request: MoveRequest | null
    folders: AssetFolder[]
    rootLabel: string
    currentFolderId?: string | null
    onClose: () => void
    onMoved: () => void
}) {
    const [dest, setDest] = React.useState<string | null>(null)
    const [busy, setBusy] = React.useState(false)
    const [open, setOpen] = React.useState<Set<string>>(new Set())
    React.useEffect(() => { if (request) { setDest(null); setOpen(new Set(folders.filter(f => !f.parent_id).map(f => f.id))) } }, [request, folders])
    React.useEffect(() => {
        if (!request) return
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onClose() }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [request, busy, onClose])
    if (!request || typeof document === "undefined") return null

    const roots = tree(folders)
    const blocked = new Set(request.folderIds)
    const nameOf = (id: string | null) => id ? folders.find(f => f.id === id)?.name || "pasta" : rootLabel

    const Row = ({ node, level, disabled }: { node: TreeNode, level: number, disabled: boolean }) => {
        const off = disabled || blocked.has(node.id)
        const isOpen = open.has(node.id)
        return (
            <>
                <div
                    role="button"
                    tabIndex={off ? -1 : 0}
                    aria-disabled={off}
                    onClick={() => { if (!off) setDest(node.id) }}
                    onKeyDown={(e) => { if (!off && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setDest(node.id) } }}
                    className={cn(
                        "flex items-center gap-2 h-9 pr-3 rounded-lg text-[13px] transition-colors",
                        off ? "opacity-35 cursor-not-allowed" : "cursor-pointer hover:bg-white/5",
                        dest === node.id && !off && "bg-[#ff0054]/15 text-white ring-1 ring-[#ff0054]/60"
                    )}
                    style={{ paddingLeft: 10 + level * 18 }}
                    title={off ? "Não pode mover para aqui" : undefined}
                >
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setOpen(s => { const n = new Set(s); if (n.has(node.id)) n.delete(node.id); else n.add(node.id); return n }) }}
                        className={cn("w-4 h-4 flex items-center justify-center text-[#666]", !node.kids.length && "invisible")}
                    >
                        <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isOpen && "rotate-90")} />
                    </button>
                    <Folder className={cn("w-4 h-4 shrink-0", dest === node.id ? "text-[#ff0054]" : "text-[#666]")} />
                    <span className="truncate text-[#ddd]">{node.name}</span>
                    {currentFolderId === node.id && <span className="ml-auto text-[10px] text-[#666]">atual</span>}
                </div>
                {isOpen && node.kids.map(k => <Row key={k.id} node={k} level={level + 1} disabled={off} />)}
            </>
        )
    }

    const confirm = async () => {
        setBusy(true)
        try {
            if (await performMove(request, dest, nameOf(dest))) { onMoved(); onClose() }
        } finally { setBusy(false) }
    }
    const same = (dest ?? null) === (currentFolderId ?? null)

    return createPortal(
        // Above every library panel (they sit at z 100–10200)
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-6" onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!busy) onClose() }} />
            <div role="dialog" aria-label="Mover para" className="relative w-full max-w-[440px] bg-[#15161B] border border-[#222] rounded-2xl shadow-2xl overflow-hidden text-white">
                <div className="bg-[#FF0054] h-[56px] px-5 flex items-center justify-between">
                    <span className="font-medium text-lg flex items-center gap-2"><FolderInput className="w-5 h-5" /> Mover para</span>
                    <button type="button" disabled={busy} onClick={onClose} className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors"><span className="sr-only">Fechar</span></button>
                </div>
                <div className="p-4 flex flex-col gap-3">
                    <p className="text-[12px] text-[#97A1B3]">Escolha para onde mover {describe(request)}.</p>
                    <div className="max-h-[340px] overflow-y-auto rounded-xl bg-[#0F1012] border border-[#222] p-1.5 custom-scrollbar">
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setDest(null)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setDest(null) } }}
                            className={cn("flex items-center gap-2 h-9 px-2.5 rounded-lg text-[13px] cursor-pointer hover:bg-white/5", dest === null && "bg-[#ff0054]/15 ring-1 ring-[#ff0054]/60")}
                        >
                            <Folder className={cn("w-4 h-4", dest === null ? "text-[#ff0054]" : "text-[#666]")} />
                            <span className="font-semibold text-[#ddd]">{rootLabel}</span>
                            {!currentFolderId && <span className="ml-auto text-[10px] text-[#666]">atual</span>}
                        </div>
                        {roots.map(n => <Row key={n.id} node={n} level={1} disabled={false} />)}
                    </div>
                </div>
                <div className="px-4 py-3 border-t border-[#222] flex items-center justify-end gap-2">
                    <button type="button" disabled={busy} onClick={onClose} className="h-9 px-4 rounded-lg text-[13px] text-[#97A1B3] hover:text-white">Cancelar</button>
                    <button
                        type="button"
                        disabled={busy || same}
                        onClick={confirm}
                        title={same ? "Já está nesta pasta" : undefined}
                        className="h-9 px-4 rounded-lg bg-[#FF0054] hover:bg-[#d60048] text-[13px] font-semibold flex items-center gap-2 disabled:opacity-50"
                    >
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Mover para «{nameOf(dest)}»
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

// ---------------------------------------------------------------------------------------------
// Drag & drop
// ---------------------------------------------------------------------------------------------

export type AssetDnd = ReturnType<typeof useAssetDndState>
export const AssetDndContext = React.createContext<AssetDnd | null>(null)
/** For components inside a library (sidebar tree items) */
export const useAssetDnd = () => React.useContext(AssetDndContext)

/**
 * Drag & drop state of one library. `dragProps` on folders and files, `dropProps` on anything that is a folder
 * (null = the top level). Only drags started in the library count: files dropped from the computer are left alone.
 */
export function useAssetDndState({ selectedFolderIds, selectedAssetIds, folderName, onMoved }: {
    selectedFolderIds: Set<string>
    selectedAssetIds: Set<string>
    folderName: (id: string | null) => string
    onMoved: () => void
}) {
    const [dragging, setDragging] = React.useState<MoveRequest | null>(null)
    const [over, setOver] = React.useState<string | null | undefined>(undefined) // undefined = nothing, null = top level
    const ghost = React.useRef<HTMLDivElement | null>(null)

    const dragProps = (kind: "folder" | "asset", id: string) => ({
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
            const inSelection = kind === "folder" ? selectedFolderIds.has(id) : selectedAssetIds.has(id)
            const req: MoveRequest = inSelection
                ? { folderIds: [...selectedFolderIds], assetIds: [...selectedAssetIds] }
                : kind === "folder" ? { folderIds: [id], assetIds: [] } : { folderIds: [], assetIds: [id] }
            setDragging(req)
            e.dataTransfer.effectAllowed = "move"
            e.dataTransfer.setData("application/x-brivio-assets", JSON.stringify(req))
            // A small badge under the pointer with how many items move
            const g = document.createElement("div")
            g.textContent = count(req) === 1 ? (req.folderIds.length ? "Mover pasta" : "Mover ficheiro") : `Mover ${count(req)} itens`
            g.style.cssText = "position:fixed;top:-100px;left:-100px;padding:6px 12px;border-radius:999px;background:#FF0054;color:#fff;font:600 12px Inter,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.4)"
            document.body.appendChild(g)
            ghost.current = g
            e.dataTransfer.setDragImage(g, 16, 16)
        },
        onDragEnd: () => {
            setDragging(null); setOver(undefined)
            ghost.current?.remove(); ghost.current = null
        },
    })

    const canDrop = (dest: string | null) => !!dragging && !(dest && dragging.folderIds.includes(dest))
    const dropProps = (dest: string | null) => ({
        onDragOver: (e: React.DragEvent) => {
            if (!canDrop(dest)) return
            e.preventDefault()
            e.stopPropagation()
            e.dataTransfer.dropEffect = "move"
            if (over !== dest) setOver(dest)
        },
        onDragLeave: (e: React.DragEvent) => {
            if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null) && over === dest) setOver(undefined)
        },
        onDrop: async (e: React.DragEvent) => {
            if (!canDrop(dest) || !dragging) return
            e.preventDefault()
            e.stopPropagation()
            const req = dragging
            setDragging(null); setOver(undefined)
            if (await performMove(req, dest, folderName(dest))) onMoved()
        },
    })
    const isOver = (dest: string | null) => over === dest && canDrop(dest)

    return { dragging, dragProps, dropProps, isOver }
}

/** Highlight of a folder that accepts the drop */
export const dropRing = "ring-2 ring-[#ff0054] ring-offset-2 ring-offset-[#0A0A0B] bg-[#ff0054]/10"
