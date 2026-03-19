
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    const brandId = '33124218-aae1-446a-9fda-b9a94c9029c1'
    const settings = { active: true, expirationEnabled: false }

    console.log("1. Re-activating Root Share...")
    const { data: existing } = await supabase.from('assets')
        .select('id')
        .eq('brand_id', brandId)
        .is('folder_id', null)
        .eq('name', '.share_settings')
        .single()

    if (existing) {
        await supabase.from('assets').update({ metadata: { share: settings } }).eq('id', existing.id)
    }

    console.log("2. Ensuring Test Folder 'Test Share Folder'...")
    const { data: folder } = await supabase.from('asset_folders')
        .select('id')
        .eq('brand_id', brandId)
        .eq('name', 'Test Share Folder')
        .single()

    let folderId = folder?.id
    const { data: userAsset } = await supabase.from('assets').select('uploader_id').limit(1).single()
    const uploaderId = userAsset?.uploader_id

    if (!folderId) {
        const { data: newFolder } = await supabase.from('asset_folders').insert({
            name: 'Test Share Folder',
            brand_id: brandId,
            parent_id: null
        }).select().single()
        folderId = newFolder.id
    }

    console.log("3. Ensuring Content in Folder...")
    const { data: files } = await supabase.from('assets')
        .select('id')
        .eq('folder_id', folderId)
        .limit(1)

    if (!files?.length) {
        await supabase.from('assets').insert({
            brand_id: brandId,
            folder_id: folderId,
            name: 'test_image.png',
            type: 'image',
            file_url: 'https://placehold.co/600x400',
            uploader_id: uploaderId
        })
    }

    console.log(`DONE. Test URL for Folder: http://localhost:3000/share/${folderId}`)
}

run()
