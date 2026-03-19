
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProfiles() {
    try {
        const profiles = await prisma.creatorProfile.findMany({
            include: { user: true },
            take: 10
        });
        console.log('Profiles found:', JSON.stringify(profiles, null, 2));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkProfiles();
