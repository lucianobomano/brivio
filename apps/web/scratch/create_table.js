const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Creating table...')
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "public"."saved_components" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "brand_id" UUID,
      "name" TEXT NOT NULL,
      "content_json" JSONB NOT NULL DEFAULT '{}',
      "is_public" BOOLEAN NOT NULL DEFAULT false,
      "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "saved_components_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "saved_components_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `)
  console.log('Table created successfully.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
