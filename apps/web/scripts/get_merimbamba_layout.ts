import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function run() {
    console.log("Searching for Merimbamba brand...")
    const { data: brands, error: bError } = await supabase
        .from('brands')
        .select('id, name')
        .ilike('name', '%merimbamba%')

    if (bError) {
        console.error("Error fetching brands:", bError)
        return
    }

    if (!brands || brands.length === 0) {
        console.error("No brand found with name like Merimbamba.")
        return
    }

    const brand = brands[0]
    console.log("Found Brand:", brand)

    // Find brandbook
    const { data: brandbooks, error: bkError } = await supabase
        .from('brandbooks')
        .select('id')
        .eq('brand_id', brand.id)

    if (bkError) {
        console.error("Error fetching brandbooks:", bkError)
        return
    }

    if (!brandbooks || brandbooks.length === 0) {
        console.error("No brandbook found for brand:", brand.name)
        return
    }

    const brandbook = brandbooks[0]
    console.log("Found Brandbook:", brandbook)

    // Fetch "DNA da marca"
    const { data: dnaModules, error: dnaError } = await supabase
        .from('brandbook_modules')
        .select('*')
        .eq('brandbook_id', brandbook.id)
        .ilike('title', '%dna da marca%')

    if (dnaError) {
        console.error("Error fetching DNA module:", dnaError)
    } else if (dnaModules && dnaModules.length > 0) {
        const dnaModule = dnaModules[0]
        fs.writeFileSync(
            path.join(process.cwd(), 'scripts', 'merimbamba_dna_da_marca.json'),
            JSON.stringify(dnaModule.content_json || {}, null, 2),
            'utf-8'
        )
        console.log("Done writing DNA da marca JSON file!")
    } else {
        console.error("No DNA da marca module found.")
    }

    // Fetch "História da marca"
    const { data: histModules, error: histError } = await supabase
        .from('brandbook_modules')
        .select('*')
        .eq('brandbook_id', brandbook.id)
        .ilike('title', '%história da marca%')

    if (histError) {
        console.error("Error fetching History module:", histError)
    } else if (histModules && histModules.length > 0) {
        const histModule = histModules[0]
        fs.writeFileSync(
            path.join(process.cwd(), 'scripts', 'merimbamba_historia_da_marca.json'),
            JSON.stringify(histModule.content_json || {}, null, 2),
            'utf-8'
        )
        console.log("Done writing História da marca JSON file!")
    } else {
        console.error("No História da marca module found.")
    }
}

run()
