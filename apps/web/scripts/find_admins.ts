
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Checking Admins ---')
    const admins = await prisma.user.findMany({
        where: {
            role_global: 'admin'
        },
        select: { id: true, name: true, email: true, role_global: true }
    })
    console.log('Admins:', JSON.stringify(admins, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
