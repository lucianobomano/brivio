
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Checking Users ---')
    const users = await prisma.user.findMany({
        take: 5,
        select: { id: true, name: true, email: true, profile_type: true }
    })
    console.log('Users:', JSON.stringify(users, null, 2))

    console.log('\n--- Checking Creator Profiles ---')
    const profiles = await prisma.creatorProfile.findMany({
        take: 5,
        include: {
            user: true
        }
    })
    console.log('Profiles:', JSON.stringify(profiles.map(p => ({
        id: p.id,
        user_id: p.user_id,
        user_name: p.user?.name,
        location: p.location,
        category: p.category
    })), null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
