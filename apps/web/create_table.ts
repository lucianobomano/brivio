import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS project_notes (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                project_id UUID NOT NULL,
                content TEXT NOT NULL,
                author_name TEXT DEFAULT 'Cliente',
                is_from_client BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                CONSTRAINT project_notes_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );
        `)
        console.log("Table project_notes created successfully!")
    } catch (e) {
        console.error("Error creating table:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
