import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Creating BrandOps tables...")

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS brand_spaces (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                description TEXT,
                use_official_context BOOLEAN DEFAULT true,
                viewport JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `)
        console.log("✓ brand_spaces table created or exists")

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS brand_objects (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
                space_id UUID REFERENCES brand_spaces(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                content JSONB DEFAULT '{}',
                metadata JSONB DEFAULT '{}',
                rationale TEXT,
                status TEXT DEFAULT 'draft',
                confidence NUMERIC DEFAULT 100,
                source TEXT DEFAULT 'human',
                version INT DEFAULT 1,
                created_by TEXT,
                is_official BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `)
        console.log("✓ brand_objects table created or exists")

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS brand_nodes (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                space_id UUID NOT NULL REFERENCES brand_spaces(id) ON DELETE CASCADE,
                object_id UUID REFERENCES brand_objects(id) ON DELETE CASCADE,
                type TEXT NOT NULL,
                category TEXT NOT NULL,
                x DOUBLE PRECISION NOT NULL DEFAULT 0,
                y DOUBLE PRECISION NOT NULL DEFAULT 0,
                width DOUBLE PRECISION DEFAULT 320,
                height DOUBLE PRECISION DEFAULT 200,
                is_collapsed BOOLEAN DEFAULT false,
                group_id TEXT,
                outputs_history JSONB DEFAULT '[]',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `)
        console.log("✓ brand_nodes table created or exists")

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS brand_relationships (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                space_id UUID NOT NULL REFERENCES brand_spaces(id) ON DELETE CASCADE,
                source_node_id UUID NOT NULL,
                target_node_id UUID NOT NULL,
                relationship_type TEXT NOT NULL DEFAULT 'supports',
                status TEXT DEFAULT 'active',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `)
        console.log("✓ brand_relationships table created or exists")

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS brand_decisions (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
                space_id UUID REFERENCES brand_spaces(id) ON DELETE CASCADE,
                decision_number INT,
                title TEXT NOT NULL,
                decision TEXT NOT NULL,
                rationale TEXT,
                status TEXT DEFAULT 'approved',
                related_objects JSONB DEFAULT '[]',
                author TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `)
        console.log("✓ brand_decisions table created or exists")

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS brand_flows (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT,
                nodes_json JSONB DEFAULT '[]',
                edges_json JSONB DEFAULT '[]',
                groups_json JSONB DEFAULT '[]',
                is_template BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `)
        console.log("✓ brand_flows table created or exists")

        console.log("All BrandOps tables successfully migrated and ready!")
    } catch (e) {
        console.error("Error creating BrandOps tables:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
