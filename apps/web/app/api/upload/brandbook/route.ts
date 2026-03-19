import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// Route segment config for handling large file uploads
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Generate a signed upload URL for direct browser-to-Supabase upload
export async function POST(request: NextRequest) {
    console.log('[Upload API] Received request for signed URL')

    try {
        const body = await request.json()
        const { brandId, moduleId, fileName, fileType, fileSize } = body

        console.log('[Upload API] Request params:', { brandId, moduleId, fileName, fileType, fileSize })

        if (!brandId || !fileName) {
            return NextResponse.json({
                success: false,
                error: 'brandId e fileName são obrigatórios'
            }, { status: 400 })
        }

        // Check file size (max 50MB for Supabase free tier)
        const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
        if (fileSize && fileSize > MAX_FILE_SIZE) {
            return NextResponse.json({
                success: false,
                error: `Ficheiro demasiado grande. Tamanho máximo: 50MB. O seu ficheiro: ${(fileSize / (1024 * 1024)).toFixed(2)}MB`
            }, { status: 400 })
        }

        const supabase = await createAdminClient()

        // Generate a unique path
        const timestamp = Date.now()
        const sanitizedFilename = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
        const path = `brands/${brandId}/${moduleId || 'general'}/${timestamp}_${sanitizedFilename}`

        console.log('[Upload API] Creating signed URL for path:', path)

        // Create a signed upload URL valid for 5 minutes
        const { data, error } = await supabase.storage
            .from('assets')
            .createSignedUploadUrl(path)

        if (error) {
            console.error('[Upload API] Signed URL error:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        // Get the public URL that will be available after upload
        const { data: urlData } = supabase.storage
            .from('assets')
            .getPublicUrl(path)

        console.log('[Upload API] Signed URL created successfully')

        return NextResponse.json({
            success: true,
            signedUrl: data.signedUrl,
            token: data.token,
            path: path,
            publicUrl: urlData.publicUrl
        })

    } catch (error) {
        console.error('[Upload API] Unexpected error:', error)
        const message = error instanceof Error ? error.message : 'Erro desconhecido'
        return NextResponse.json({ success: false, error: message }, { status: 500 })
    }
}
