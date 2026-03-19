
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getFolder() {
    const brandId = '33124218-aae1-446a-9fda-b9a94c9029c1'
    const { data } = await supabase.from('asset_folders')
        .select('id')
        .eq('brand_id', brandId)
        .eq('name', 'Test Share Folder')
        .single()
    if (data) {
        console.log(`FOLDER_ID:${data.id}`)
    } else {
        console.log("FOLDER_NOT_FOUND")
    }
}
getFolder()
