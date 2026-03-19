
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'testuser@brivio.com'
    console.log(`--- Promoting ${email} to admin ---`)

    const user = await prisma.user.update({
        where: { email },
        data: { role_global: 'admin' },
        select: { id: true, name: true, email: true, role_global: true }
    })

    console.log('User updated successfully:', JSON.stringify(user, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
