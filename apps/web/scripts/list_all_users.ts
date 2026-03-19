
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Listing All Users and Roles ---')
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role_global: true }
    })
    console.log('Users:', JSON.stringify(users, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
