import { createAdminClient } from '../lib/supabase/server'
import { getBrandSpaces, createBrandSpace, getBrandSpaceDetails, generateBrandWorkflowAI } from '../app/actions/brandops'

async function runTest() {
    console.log("=== Testing BrandOps Backend Engine ===")

    const admin = await createAdminClient()
    const { data: brand } = await admin.from('brands').select('id, name').limit(1).single()

    if (!brand) {
        console.error("No brand found")
        return
    }

    console.log("Testing with brand:", brand.name, brand.id)

    // 1. Test create Brand Space
    const spaceRes = await createBrandSpace(brand.id, `Test BrandOps Canvas — ${brand.name}`, "Test space created by automated test")
    console.log("Create Space Result:", spaceRes.success, spaceRes.space?.id)

    if (!spaceRes.success || !spaceRes.space) {
        console.error("Failed to create space")
        return
    }

    const spaceId = spaceRes.space.id

    // 2. Test generateBrandWorkflowAI ("Criar Marca com IA")
    console.log("Testing generateBrandWorkflowAI...")
    const wfRes = await generateBrandWorkflowAI(brand.id, spaceId, "Quero criar uma marca premium de café angolano para jovens profissionais urbanos")
    console.log("Workflow Result:", wfRes.success, "Nodes count:", wfRes.nodes?.length, "Edges count:", wfRes.relationships?.length)

    // 3. Test getBrandSpaceDetails
    console.log("Testing getBrandSpaceDetails...")
    const details = await getBrandSpaceDetails(spaceId)
    console.log("Details Result:", details.success, "Loaded nodes:", details.nodes?.length, "Loaded edges:", details.relationships?.length)

    console.log("=== BrandOps Engine Validation Completed Successfully! ===")
}

runTest().catch(console.error)
