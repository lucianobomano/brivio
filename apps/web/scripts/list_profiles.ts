
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // List all creator profiles with their users
    const profiles = await prisma.creatorProfile.findMany({
        include: { user: true },
        take: 10
    })

    console.log('=== Creator Profiles ===')
    profiles.forEach(p => {
        console.log(`ID: ${p.id}`)
        console.log(`User ID: ${p.user_id}`)
        console.log(`User Name: ${p.user?.name}`)
        console.log(`User Email: ${p.user?.email}`)
        console.log(`Category: ${p.category}`)
        console.log(`Location: ${p.location}`)
        console.log('---')
    })

    console.log(`\nTotal: ${profiles.length} profiles`)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
