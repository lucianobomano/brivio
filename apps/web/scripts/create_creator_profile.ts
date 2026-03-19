
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // First, find the test user
    const testUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: { contains: 'test' } },
                { name: { contains: 'Test' } }
            ]
        }
    })

    if (!testUser) {
        console.log('No test user found. Listing all users:')
        const allUsers = await prisma.user.findMany({
            take: 10,
            select: { id: true, name: true, email: true }
        })
        console.log(allUsers)
        return
    }

    console.log('Found test user:', testUser.id, testUser.name, testUser.email)

    // Check if creator_profile already exists
    const existingProfile = await prisma.creatorProfile.findUnique({
        where: { user_id: testUser.id }
    })

    if (existingProfile) {
        console.log('Creator profile already exists:', existingProfile.id)
        return
    }

    // Create the creator profile
    const creatorProfile = await prisma.creatorProfile.create({
        data: {
            user_id: testUser.id,
            location: 'Luanda, Angola',
            website: 'https://brivio.com',
            category: 'UI/UX Designer',
            type: 'Individual',
            country: 'Angola',
            about: 'Test user creator profile',
            works_count: 5,
            soty_count: 1,
            sotm_count: 2,
            sotd_count: 3,
            hm_count: 4,
            expertise: ['UI Design', 'UX Research', 'Prototyping'],
        }
    })

    console.log('Created creator profile:', creatorProfile.id)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
