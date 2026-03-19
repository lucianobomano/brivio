
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const id = '6633b960-c079-4c09-9773-1184e4a79b51';
    try {
        const user = await prisma.user.findUnique({
            where: { id: id },
            include: { creator_profile: true }
        });
        console.log('User found:', JSON.stringify(user, null, 2));

        if (!user) {
            // Search by email just in case
            const allUsers = await prisma.user.findMany({ take: 5 });
            console.log('Sample users:', JSON.stringify(allUsers, null, 2));
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
