"use client"

import { createClient } from "@/lib/supabase/client"
import { registerUploadedAsset } from "@/app/actions/assets"
import { toast } from "sonner"

/**
 * Uploads go straight from the browser to Supabase Storage with the resumable (TUS) protocol: the file is sent in
 * 6 MB chunks (the size Supabase requires), progress is reported as it goes, and a chunk that fails is retried from
 * the last byte the server kept. Nothing passes through our server, so there is no size limit of our own; the only
 * one is the Storage limit of the Supabase project (NEXT_PUBLIC_MAX_UPLOAD_MB, 50 MB on the free plan).
 */
const CHUNK = 6 * 1024 * 1024
const BUCKET = "assets"
export const MAX_UPLOAD_BYTES = (Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 50) * 1024 * 1024

export const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B"
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
    return parseFloat((bytes / 1024 ** i).toFixed(2)) + " " + sizes[i]
}

const b64 = (s: string) => btoa(unescape(encodeURIComponent(s)))

async function authHeaders() {
    const supabase = createClient()
    // getSession refreshes the token when needed: long uploads outlive one access token
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) throw new Error("A sessão terminou. Inicie sessão de novo para carregar ficheiros.")
    return {
        authorization: `Bearer ${token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        "tus-resumable": "1.0.0",
    }
}

/** Sends one chunk, reporting the bytes sent while it travels */
function patchChunk(url: string, headers: Record<string, string>, offset: number, body: Blob, onBytes: (sent: number) => void, signal?: AbortSignal) {
    return new Promise<number>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open("PATCH", url)
        for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v)
        xhr.setRequestHeader("upload-offset", String(offset))
        xhr.setRequestHeader("content-type", "application/offset+octet-stream")
        xhr.upload.onprogress = (e) => onBytes(e.loaded)
        xhr.onload = () => {
            if (xhr.status === 204) resolve(Number(xhr.getResponseHeader("upload-offset")) || offset + body.size)
            else reject(Object.assign(new Error(xhr.responseText || `HTTP ${xhr.status}`), { status: xhr.status }))
        }
        xhr.onerror = () => reject(Object.assign(new Error("Falha de rede"), { status: 0 }))
        xhr.onabort = () => reject(Object.assign(new Error("Cancelado"), { status: -1 }))
        signal?.addEventListener("abort", () => xhr.abort(), { once: true })
        xhr.send(body)
    })
}

/** Uploads `file` to `path` in the assets bucket; `onProgress` gets 0..1 */
export async function uploadToStorage(file: File, path: string, onProgress?: (fraction: number) => void, signal?: AbortSignal) {
    const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`
    let headers = await authHeaders()
    const create = await fetch(endpoint, {
        method: "POST",
        headers: {
            ...headers,
            "upload-length": String(file.size),
            "upload-metadata": [
                `bucketName ${b64(BUCKET)}`,
                `objectName ${b64(path)}`,
                `contentType ${b64(file.type || "application/octet-stream")}`,
                `cacheControl ${b64("3600")}`,
            ].join(","),
            "x-upsert": "false",
        },
        signal,
    })
    if (create.status === 413) throw new Error(`O ficheiro excede o limite de armazenamento por ficheiro (${formatBytes(MAX_UPLOAD_BYTES)}).`)
    if (!create.ok) throw new Error((await create.text().catch(() => "")) || `Não foi possível iniciar o upload (HTTP ${create.status})`)
    const location = create.headers.get("location")
    if (!location) throw new Error("O armazenamento não devolveu o endereço do upload.")
    const url = new URL(location, endpoint).toString()

    let offset = 0
    let failures = 0
    onProgress?.(0)
    while (offset < file.size) {
        const end = Math.min(file.size, offset + CHUNK)
        try {
            offset = await patchChunk(url, headers, offset, file.slice(offset, end), sent => onProgress?.(Math.min(1, (offset + sent) / file.size)), signal)
            failures = 0
            onProgress?.(offset / file.size)
        } catch (err) {
            const status = (err as { status?: number }).status
            if (status === -1) throw err
            if (++failures > 4) throw new Error("A ligação falhou várias vezes durante o upload. Tente de novo.")
            await new Promise(r => setTimeout(r, 800 * failures))
            // A fresh token, and continue from what the server kept
            headers = await authHeaders()
            const head = await fetch(url, { method: "HEAD", headers, signal }).catch(() => null)
            const kept = Number(head?.headers.get("upload-offset"))
            if (head?.ok && !Number.isNaN(kept)) offset = kept
        }
    }
    onProgress?.(1)
}

/** Dimensions of an image file ("1920x1080"), or undefined */
export function imageDimensions(file: File): Promise<string | undefined> {
    if (!file.type.startsWith("image/")) return Promise.resolve(undefined)
    return new Promise(resolve => {
        const img = new Image()
        const src = URL.createObjectURL(file)
        img.onload = () => { resolve(`${img.width}x${img.height}`); URL.revokeObjectURL(src) }
        img.onerror = () => { resolve(undefined); URL.revokeObjectURL(src) }
        img.src = src
    })
}

/**
 * The libraries' upload: takes the same FormData they built for the old server action (file, brandId or
 * workspaceId, folderId, metadata_*), sends the file directly to Storage and then records it.
 */
export async function uploadAssetDirect(formData: FormData, onProgress?: (fraction: number) => void, signal?: AbortSignal) {
    const result = await sendAsset(formData, onProgress, signal)
    // Say why it failed, per file (the libraries only count the failures)
    if (!result.success) toast.error(result.error || "Falha ao carregar o ficheiro")
    return result
}

async function sendAsset(formData: FormData, onProgress?: (fraction: number) => void, signal?: AbortSignal) {
    const file = formData.get("file") as File | null
    const brandId = (formData.get("brandId") as string) || undefined
    const workspaceId = (formData.get("workspaceId") as string) || undefined
    const rawFolder = formData.get("folderId") as string | null
    const folderId = rawFolder && rawFolder !== "undefined" && rawFolder !== "null" ? rawFolder : undefined
    if (!file || (!brandId && !workspaceId)) return { success: false as const, error: "Falta o ficheiro ou o destino" }
    if (file.size > MAX_UPLOAD_BYTES) {
        return { success: false as const, error: `«${file.name}» tem ${formatBytes(file.size)}; o limite atual por ficheiro é ${formatBytes(MAX_UPLOAD_BYTES)}.` }
    }

    const prefix = brandId ? `brand_${brandId}` : `ws_${workspaceId}`
    const path = `${prefix}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    try {
        await uploadToStorage(file, path, onProgress, signal)
    } catch (err) {
        return { success: false as const, error: `«${file.name}»: ${(err as Error).message}` }
    }
    const dimensions = (formData.get("metadata_dimensions") as string) || await imageDimensions(file)
    return registerUploadedAsset({
        path,
        name: file.name,
        mimeType: file.type,
        bytes: file.size,
        size: (formData.get("metadata_size") as string) || formatBytes(file.size),
        dimensions,
        brandId,
        workspaceId,
        folderId,
    })
}
